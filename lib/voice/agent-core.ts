import { persona } from './personas'
import { runGetSlots, runBook, runTeamStatus } from './tools'
import { knowledgeContext } from './knowledge'

export type Msg = { role: 'user' | 'assistant'; content: string }

async function execTool(name: string, input: Record<string, unknown>, defaultPerson?: string) {
  const person = String(input.person || defaultPerson || 'markus')
  if (name === 'get_slots') return await runGetSlots(person, input.type ? String(input.type) : undefined)
  if (name === 'team_status') return await runTeamStatus()
  if (name === 'book') return await runBook({ person, typeSlug: input.type ? String(input.type) : undefined, slotId: String(input.slot_id || ''), name: String(input.name || ''), phone: String(input.phone || ''), email: input.email ? String(input.email) : undefined, topic: input.topic ? String(input.topic) : undefined })
  return { error: 'unknown_tool' }
}

const TOOLS = [
  { name: 'get_slots', description: 'Holt freie Termine einer Person. person: markus|aljona|cosima|daniel. type optional.', input_schema: { type: 'object', properties: { person: { type: 'string' }, type: { type: 'string' } }, required: ['person'] } },
  { name: 'book', description: 'Bucht einen Termin. slot_id ist die ID aus get_slots. Telefonnummer ist Pflicht.', input_schema: { type: 'object', properties: { person: { type: 'string' }, type: { type: 'string' }, slot_id: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, topic: { type: 'string' } }, required: ['person', 'slot_id', 'name', 'phone'] } },
  { name: 'team_status', description: 'Aktueller Status des Teams (available|meeting|offline).', input_schema: { type: 'object', properties: {} } },
]

async function scriptedReply(dw: number, messages: Msg[]): Promise<{ reply: string; mode: string }> {
  const p = persona(dw)
  const last = (messages[messages.length - 1]?.content || '').toLowerCase()
  if (/(termin|buchen|zeit|slot|kalender)/.test(last)) {
    const r = await runGetSlots(p.person || 'markus')
    const slots = (r as { slots?: { label: string }[] }).slots || []
    if (slots.length) return { reply: `Gerne. Als Nächstes frei wäre: ${slots.slice(0, 3).map(s => s.label).join(', oder ')}. Was passt Ihnen?`, mode: 'scripted' }
    return { reply: 'Aktuell sehe ich keine freien Zeiten — ich lasse Sie vom Team zurückrufen. Wie ist Ihre Nummer?', mode: 'scripted' }
  }
  if (/(status|erreichbar|verf(ü|ue)gbar|frei)/.test(last) && p.person) {
    const st = (await runTeamStatus()) as Record<string, { status: string }>
    const s = st[p.person]?.status || 'offline'
    const map: Record<string, string> = { available: 'gerade erreichbar', meeting: 'gerade im Termin', offline: 'aktuell nicht verbunden', training: 'im Training', vacation: 'im Urlaub' }
    return { reply: `${p.name.replace(/ .*/, '')} ist ${map[s] || s}. Soll ich Ihr Anliegen aufnehmen oder einen Termin einrichten?`, mode: 'scripted' }
  }
  if (/(preis|kost|teuer|was kostet|invest)/.test(last)) return { reply: 'Zu Zahlen sage ich am Telefon ungern etwas Verbindliches — ob wir freie Plätze haben und was passt, klären wir am besten kurz persönlich. Soll ich einen Termin einrichten?', mode: 'scripted' }
  if (/(info|was macht|was ist|erz(ä|ae)hl|academy|salesmade|angebot|programm|leistung)/.test(last)) return { reply: 'Wir machen B2B-Vertrieb planbar — Ausbildung fürs Sales-Team (SalesMade Academy), AI im Verkauf und Leadership. Wo steht Euer Team gerade, dann sage ich, was passt?', mode: 'scripted' }
  if (/(hallo|hi\b|guten|hey|servus|moin)/.test(last)) return { reply: 'Hallo! Worum geht es — ein Termin, eine Frage zu unseren Programmen, oder jemand Bestimmtes im Team?', mode: 'scripted' }
  if (/(danke|tsch(ü|ue)ss|wiederh(ö|oe)ren|ciao)/.test(last)) return { reply: 'Sehr gern — bis bald!', mode: 'scripted' }
  const outros = ['Erzählen Sie kurz, worum es geht — dann helfe ich gezielt weiter.', 'Sagen Sie mir kurz Ihr Anliegen, dann leite ich das Richtige ein.', 'Was wäre für Sie ein gutes Ergebnis aus diesem Gespräch?']
  return { reply: outros[Math.floor(Math.random() * outros.length)], mode: 'scripted' }
}

export async function runAgent(dw: number, messages: Msg[]): Promise<{ reply: string; mode: string; tools?: string[] }> {
  const p = persona(dw)
  if (!messages.length) return { reply: p.greeting, mode: 'greeting' }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return await scriptedReply(dw, messages)

  const model = process.env.VOICE_AGENT_MODEL || 'claude-sonnet-4-6'
  const systemPrompt = p.system + '\n\n' + await knowledgeContext()
  const convo: Array<{ role: 'user' | 'assistant'; content: unknown }> = messages.map(m => ({ role: m.role, content: m.content }))
  const usedTools: string[] = []
  try {
    for (let i = 0; i < 4; i++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 500, system: systemPrompt, tools: TOOLS, messages: convo }),
      })
      const data = await res.json()
      if (!res.ok) { console.error('anthropic', data); return await scriptedReply(dw, messages) }
      const content = data.content as Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>
      if (data.stop_reason === 'tool_use') {
        convo.push({ role: 'assistant', content })
        const results = []
        for (const block of content) {
          if (block.type === 'tool_use') { usedTools.push(block.name || ''); const out = await execTool(block.name || '', block.input || {}, p.person); results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) }) }
        }
        convo.push({ role: 'user', content: results })
        continue
      }
      const text = content.filter(c => c.type === 'text').map(c => c.text).join(' ').trim()
      return { reply: text || 'Einen Moment bitte.', mode: 'claude', tools: usedTools }
    }
    return { reply: 'Einen Moment, ich verbinde Sie mit dem Team.', mode: 'claude', tools: usedTools }
  } catch (e) { console.error(e); return await scriptedReply(dw, messages) }
}
