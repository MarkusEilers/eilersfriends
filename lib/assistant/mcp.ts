import { NextResponse } from 'next/server'
import { verifyApiKey, hasScope, type ApiKeyContext } from '@/lib/events/auth'
import {
  listEvents, freeTime, createBlock, moveEvent, updateEvent, deleteEvent, recentActions, draftMail,
} from './calendar'

/**
 * MCP server for the personal assistant (Streamable HTTP, stateless JSON).
 *
 * Reachable two ways, same handler:
 *   /api/assistant/mcp            Authorization: Bearer <key>
 *   /api/assistant/mcp/<key>      key in the path — for connectors that cannot
 *                                 send headers (claude.ai custom connectors)
 *
 * A key works only if it is bound to a person (scope "person:<slug>") and
 * carries calendar:read; writes need calendar:write, mail drafts mail:draft.
 * There is deliberately no tool that sends mail.
 */

const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05']

const INSTRUCTIONS = `Kalender-Assistent von Eilers+Friends. Zeiten sind Berliner Ortszeit im Format YYYY-MM-DDTHH:MM, solange nichts anderes angegeben ist.

Arbeitsweise:
- Erst lesen (calendar_list_events, calendar_free_time), dann einen Plan zeigen, dann schreiben.
- Verschieben oder Löschen: vorher die betroffenen Termine nennen und Bestätigung abwarten, außer der Nutzer hat ausdrücklich gesagt, dass Du es direkt tun sollst.
- Termine mit anderen Teilnehmern nicht anfassen. Das Werkzeug weist sie ab; notify_attendees: true nur, wenn der Nutzer genau das will — die anderen bekommen dann eine Nachricht.
- Prioritäten: importance (low/normal/high) und categories. Fokuszeit: calendar_create_block mit show_as "busy".
- E-Mails nur als Entwurf (mail_draft). Es gibt kein Werkzeug zum Senden; der Nutzer schickt selbst.
- Jede Änderung wird protokolliert (assistant_recent_actions) und lässt sich damit zurückdrehen.`

type Tool = { name: string; description: string; scope: string; inputSchema: Record<string, unknown> }

const str = (d: string) => ({ type: 'string', description: d })
const TOOLS: Tool[] = [
  {
    name: 'calendar_list_events', scope: 'calendar:read',
    description: 'Alle Termine in einem Zeitraum, über alle verbundenen Kalender. Mit Teilnehmern, Organisator, Priorität, Kategorien.',
    inputSchema: { type: 'object', required: ['from', 'to'], properties: { from: str('Beginn, z. B. 2026-10-07T00:00'), to: str('Ende, z. B. 2026-10-12T00:00') } },
  },
  {
    name: 'calendar_free_time', scope: 'calendar:read',
    description: 'Freie Lücken an Werktagen innerhalb der Arbeitszeit.',
    inputSchema: {
      type: 'object', required: ['from', 'to'],
      properties: {
        from: str('Beginn'), to: str('Ende'),
        min_minutes: { type: 'number', description: 'Mindestlänge, Standard 30' },
        day_start: str('Arbeitsbeginn HH:MM, Standard 08:00'), day_end: str('Arbeitsende HH:MM, Standard 19:00'),
      },
    },
  },
  {
    name: 'calendar_create_block', scope: 'calendar:write',
    description: 'Legt einen Termin ohne Teilnehmer an — Fokuszeit, Aufgabe, Puffer. Lädt niemanden ein.',
    inputSchema: {
      type: 'object', required: ['subject', 'start'],
      properties: {
        subject: str('Titel'), start: str('Beginn'),
        minutes: { type: 'number', description: 'Dauer, Standard 60' }, end: str('Alternativ: Ende'),
        calendar: str('Kalender-Adresse, Standard: Hauptkalender'),
        show_as: { type: 'string', enum: ['free', 'tentative', 'busy', 'oof', 'workingElsewhere'] },
        importance: { type: 'string', enum: ['low', 'normal', 'high'] },
        categories: { type: 'array', items: { type: 'string' } },
        notes: str('Notiz im Termin'),
      },
    },
  },
  {
    name: 'calendar_move_event', scope: 'calendar:write',
    description: 'Verschiebt einen eigenen Termin. Termine mit anderen Teilnehmern nur mit notify_attendees: true.',
    inputSchema: {
      type: 'object', required: ['id', 'calendar', 'start'],
      properties: {
        id: str('Termin-ID aus calendar_list_events'), calendar: str('Kalender aus calendar_list_events'),
        start: str('Neuer Beginn'), minutes: { type: 'number', description: 'Neue Dauer, Standard: bisherige' },
        notify_attendees: { type: 'boolean' },
      },
    },
  },
  {
    name: 'calendar_update_event', scope: 'calendar:write',
    description: 'Ändert Titel, Priorität, Kategorien, Anzeige-Status oder Notiz eines Termins.',
    inputSchema: {
      type: 'object', required: ['id', 'calendar'],
      properties: {
        id: str('Termin-ID'), calendar: str('Kalender'), subject: str('Neuer Titel'),
        importance: { type: 'string', enum: ['low', 'normal', 'high'] },
        show_as: { type: 'string', enum: ['free', 'tentative', 'busy', 'oof', 'workingElsewhere'] },
        categories: { type: 'array', items: { type: 'string' } }, notes: str('Notiz'),
      },
    },
  },
  {
    name: 'calendar_delete_event', scope: 'calendar:write',
    description: 'Löscht einen eigenen Termin. Termine mit anderen Teilnehmern nur mit notify_attendees: true (dann geht eine Absage raus).',
    inputSchema: {
      type: 'object', required: ['id', 'calendar'],
      properties: { id: str('Termin-ID'), calendar: str('Kalender'), notify_attendees: { type: 'boolean' } },
    },
  },
  {
    name: 'assistant_recent_actions', scope: 'calendar:read',
    description: 'Die letzten Änderungen durch diesen Assistenten, mit Zustand davor — zum Nachvollziehen und Zurückdrehen.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
  {
    name: 'mail_draft', scope: 'mail:draft',
    description: 'Legt eine E-Mail als Entwurf im Postfach ab. Sendet nie — der Nutzer prüft und schickt sie selbst aus Outlook.',
    inputSchema: {
      type: 'object', required: ['to', 'subject', 'body'],
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: 'Empfänger' },
        cc: { type: 'array', items: { type: 'string' } },
        subject: str('Betreff'), body: str('Text, Absätze mit Leerzeile'),
        mailbox: str('Postfach-Adresse, Standard: Hauptkonto'),
      },
    },
  },
]

function personOf(ctx: ApiKeyContext): string | null {
  const s = ctx.scopes.find((x) => x.startsWith('person:'))
  return s ? s.slice('person:'.length) : null
}

async function call(ctx: ApiKeyContext, person: string, name: string, a: Record<string, unknown>) {
  const key = ctx.name
  switch (name) {
    case 'calendar_list_events': return listEvents(person, String(a.from), String(a.to))
    case 'calendar_free_time': return freeTime(person, String(a.from), String(a.to),
      Number(a.min_minutes ?? 30), String(a.day_start ?? '08:00'), String(a.day_end ?? '19:00'))
    case 'calendar_create_block': return createBlock(person, key, {
      subject: String(a.subject), start: String(a.start), minutes: a.minutes as number | undefined,
      end: a.end as string | undefined, calendar: a.calendar as string | undefined,
      showAs: a.show_as as string | undefined, importance: a.importance as string | undefined,
      categories: a.categories as string[] | undefined, body: a.notes as string | undefined,
    })
    case 'calendar_move_event': return moveEvent(person, key, {
      id: String(a.id), calendar: a.calendar as string | undefined, start: String(a.start),
      minutes: a.minutes as number | undefined, notify_attendees: a.notify_attendees === true,
    })
    case 'calendar_update_event': return updateEvent(person, key, {
      id: String(a.id), calendar: a.calendar as string | undefined, subject: a.subject as string | undefined,
      importance: a.importance as string | undefined, showAs: a.show_as as string | undefined,
      categories: a.categories as string[] | undefined, body: a.notes as string | undefined,
    })
    case 'calendar_delete_event': return deleteEvent(person, key, {
      id: String(a.id), calendar: a.calendar as string | undefined, notify_attendees: a.notify_attendees === true,
    })
    case 'assistant_recent_actions': return recentActions(person, Number(a.limit ?? 20))
    case 'mail_draft': return draftMail(person, key, {
      to: (Array.isArray(a.to) ? a.to : [a.to]).map(String), cc: Array.isArray(a.cc) ? a.cc.map(String) : [],
      subject: String(a.subject), body: String(a.body), mailbox: a.mailbox as string | undefined,
    })
    default: throw new Error(`unknown_tool:${name}`)
  }
}

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> }

async function handleOne(ctx: ApiKeyContext, person: string, msg: Rpc): Promise<Record<string, unknown> | null> {
  const id = msg.id ?? null
  // Notifications get no answer.
  if (msg.id === undefined || msg.method.startsWith('notifications/')) return null

  if (msg.method === 'initialize') {
    const asked = String((msg.params as { protocolVersion?: string } | undefined)?.protocolVersion ?? '')
    return {
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'eilersfriends-assistant', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      },
    }
  }
  if (msg.method === 'ping') return { jsonrpc: '2.0', id, result: {} }
  if (msg.method === 'tools/list') {
    const tools = TOOLS.filter((t) => hasScope(ctx, t.scope)).map(({ scope: _s, ...t }) => t)
    return { jsonrpc: '2.0', id, result: { tools } }
  }
  if (msg.method === 'tools/call') {
    const p = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }
    const tool = TOOLS.find((t) => t.name === p.name)
    if (!tool) return { jsonrpc: '2.0', id, error: { code: -32602, message: `unknown_tool:${p.name}` } }
    if (!hasScope(ctx, tool.scope)) {
      return { jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: `Keine Berechtigung (${tool.scope}).` }] } }
    }
    try {
      const out = await call(ctx, person, tool.name, p.arguments ?? {})
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } }
    } catch (e) {
      // Tool errors are results, not protocol errors — the model should read them and react.
      return { jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }] } }
    }
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `method_not_found:${msg.method}` } }
}

export async function handleAssistantMcp(req: Request, token: string | null): Promise<Response> {
  const header = token ? `Bearer ${token}` : req.headers.get('authorization')
  const ctx = await verifyApiKey(header)
  const person = ctx ? personOf(ctx) : null
  if (!ctx || !person || !hasScope(ctx, 'calendar:read')) {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'unauthorized' } }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse_error' } }, { status: 400 })
  }

  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleOne(ctx, person, m as Rpc)))).filter(Boolean)
    return out.length ? NextResponse.json(out) : new Response(null, { status: 202 })
  }
  const one = await handleOne(ctx, person, body as Rpc)
  return one ? NextResponse.json(one) : new Response(null, { status: 202 })
}

export function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } })
}
