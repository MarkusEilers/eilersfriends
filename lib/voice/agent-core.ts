import { persona } from './personas'
import { runGetSlots, runBook, runTeamStatus } from './tools'
import { knowledgeContext } from './knowledge'
import { logActivity } from './store'
import { sendTeamNotification } from './notify'

export type Msg = { role: 'user' | 'assistant'; content: string }
export type Ctx = { callerId?: string; source?: string }

export function stripSpeakable(t: string): string {
  return String(t || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // [Text](url) -> Text
    .replace(/(\*\*|__)(.*?)\1/g, '$2')              // **fett** / __fett__
    .replace(/(^|\s)[*_]([^*_\n]+)[*_]/g, '$1$2')     // *kursiv* / _kursiv_
    .replace(/`([^`]+)`/g, '$1')                       // `code`
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')               // # Ueberschriften
    .replace(/^\s{0,3}[-*+]\s+/gm, '')                // Listen-Bullets
    .replace(/[\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[:;]-?[)(\]\[dpDP]/g, '')
    .replace(/\s{2,}/g, ' ').trim()
}
export function renderTranscript(messages: Msg[]): string {
  return messages.map(m => (m.role === 'user' ? 'Anrufer' : 'Assistentin') + ': ' + m.content).join('\n')
}

const TOOLS = [
  { name: 'get_slots', description: 'Holt freie Termine einer Person. person: markus|aljona|cosima|daniel.', input_schema: { type: 'object', properties: { person: { type: 'string' }, type: { type: 'string' } }, required: ['person'] } },
  { name: 'book', description: 'Bucht einen Termin. slot_id aus get_slots. Telefonnummer Pflicht.', input_schema: { type: 'object', properties: { person: { type: 'string' }, type: { type: 'string' }, slot_id: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, topic: { type: 'string' } }, required: ['person', 'slot_id', 'name', 'phone'] } },
  { name: 'team_status', description: 'Aktueller Status des Teams (available|meeting|offline).', input_schema: { type: 'object', properties: {} } },
  { name: 'send_message', description: 'Schickt der Zielperson eine E-Mail mit dem Anliegen des Anrufers (Name, Rückrufnummer, E-Mail, volles Transkript) und legt einen CRM-Anrufversuch an. Nutze es, wenn der Anrufer für jemanden eine Nachricht/einen Rückruf hinterlassen will oder die Person nicht erreichbar ist. Vorher freundlich Name und Rückrufnummer erfragen.', input_schema: { type: 'object', properties: { person: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, summary: { type: 'string' } }, required: ['person', 'name', 'phone'] } },
]

async function execTool(name: string, input: Record<string, unknown>, extra: { dw: number; defaultPerson?: string; messages: Msg[]; ctx?: Ctx }) {
  const person = String(input.person || extra.defaultPerson || 'markus')
  if (name === 'get_slots') return await runGetSlots(person, input.type ? String(input.type) : undefined)
  if (name === 'team_status') return await runTeamStatus()
  if (name === 'book') return await runBook({ person, typeSlug: input.type ? String(input.type) : undefined, slotId: String(input.slot_id || ''), name: String(input.name || ''), phone: String(input.phone || ''), email: input.email ? String(input.email) : undefined, topic: input.topic ? String(input.topic) : undefined })
  if (name === 'send_message') {
    const transcript = renderTranscript(extra.messages) + (input.summary ? `\n\nZusammenfassung: ${input.summary}` : '')
    const res = await sendTeamNotification({ person, dw: extra.dw, callerName: input.name ? String(input.name) : undefined, callerPhone: input.phone ? String(input.phone) : undefined, callerEmail: input.email ? String(input.email) : undefined, callerId: extra.ctx?.callerId, transcript, whenISO: new Date().toISOString() })
    await logActivity({ type: 'anrufversuch', dw: extra.dw, personSlug: person, name: input.name ? String(input.name) : null, phone: input.phone ? String(input.phone) : null, email: input.email ? String(input.email) : null, topic: input.summary ? String(input.summary) : null, summary: `Nachricht an ${person} (Voice)`, transcript, meta: { callerId: extra.ctx?.callerId, emailSent: res.sent } }).catch(() => {})
    return { ok: true, delivered: res.sent }
  }
  return { error: 'unknown_tool' }
}

async function scriptedReply(dw: number, messages: Msg[], ctx?: Ctx): Promise<{ reply: string; mode: string }> {
  const p = persona(dw)
  const lastUser = (messages[messages.length - 1]?.content || '')
  const low = lastUser.toLowerCase()
  const lastA = [...messages].reverse().find(m => m.role === 'assistant')?.content || ''
  const person = p.person || 'markus'
  const firstName = p.name.replace(/ .*/, '')
  const teamName = ({ markus: 'Markus', aljona: 'Aljona', cosima: 'Cosima', daniel: 'Daniel' } as Record<string, string>)[person] || firstName

  const reEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/
  const rePhone = /(\+?\d[\d\s/().-]{5,}\d)/
  const yes = /\b(ja|gern|gerne|bitte|klar|okay|ok|passt|mach|jup|jep)\b/.test(low)
  const no = /\b(nein|ne|nö|keine?|nicht|später|kein interesse)\b/.test(low)
  const emailInText = (t: string) => (t.match(reEmail) || [])[0] || ''
  const phoneInText = (t: string) => { const m = t.match(rePhone); if (!m) return ''; return m[0].replace(/\D/g, '').length >= 6 ? m[0].trim() : '' }
  const answerAfter = (marker: RegExp): string => { for (let i = 0; i < messages.length - 1; i++) if (messages[i].role === 'assistant' && marker.test(messages[i].content) && messages[i + 1]?.role === 'user') return messages[i + 1].content; return '' }
  const topic = messages.find(m => m.role === 'user')?.content || ''

  async function finalize(): Promise<{ reply: string; mode: string }> {
    const name = answerAfter(/wie darf ich sie nennen|ihr name/i).trim()
    const phone = messages.map(m => phoneInText(m.content)).find(Boolean) || ''
    const email = messages.map(m => emailInText(m.content)).find(Boolean) || ''
    const transcript = renderTranscript(messages)
    const res = await sendTeamNotification({ person, dw, callerName: name, callerPhone: phone, callerEmail: email, callerId: ctx?.callerId, transcript, whenISO: new Date().toISOString() }).catch(() => ({ sent: false }))
    await logActivity({ type: 'anrufversuch', dw, personSlug: person, name: name || null, phone: phone || null, email: email || null, topic: topic || null, summary: `Anrufversuch (Voice, DW${dw})`, transcript, meta: { callerId: ctx?.callerId, emailSent: res.sent } }).catch(() => {})
    return { reply: `Danke${name ? ', ' + name.split(' ')[0] : ''}! Ich habe ${teamName} Ihre Nachricht mit Ihrer Nummer geschickt — man meldet sich bei Ihnen. Bis bald!`, mode: 'scripted' }
  }

  if (/deine e-?mail|ihre e-?mail|e-?mail.*(hinterlassen|angeben|nennen)/i.test(lastA)) return finalize()
  if (/welcher nummer|r(ü|ue)ckrufnummer|erreichen wir sie|ihre nummer/i.test(lastA)) {
    if (!phoneInText(lastUser)) return { reply: 'Die Nummer habe ich nicht ganz verstanden — sagen Sie sie mir bitte noch einmal langsam?', mode: 'scripted' }
    return { reply: 'Danke. Möchten Sie noch eine E-Mail-Adresse hinterlassen? Sonst reicht die Nummer.', mode: 'scripted' }
  }
  if (/wie darf ich sie nennen|ihr name/i.test(lastA)) return { reply: `Danke${lastUser.trim() ? ', ' + lastUser.trim().split(' ')[0] : ''}. Und unter welcher Nummer erreichen wir Sie am besten?`, mode: 'scripted' }
  if (/anliegen.*(aufnehmen|notieren)|nachricht.*(senden|schicken|hinterlassen)|r(ü|ue)ckruf.*notieren|soll ich.*(aufnehmen|notieren|schicken)/i.test(lastA) && yes) return { reply: 'Gern. Wie darf ich Sie nennen?', mode: 'scripted' }

  if (/(termin|buchen|zeit|slot|kalender|verf(ü|ue)gbar)/.test(low)) {
    const r = await runGetSlots(person); const slots = (r as { slots?: { label: string }[] }).slots || []
    if (slots.length) return { reply: `Gerne. Als Nächstes frei wäre: ${slots.slice(0, 3).map(s => s.label).join(', oder ')}. Was passt Ihnen? Ich brauche dann noch Ihren Namen und eine Nummer.`, mode: 'scripted' }
    return { reply: 'Aktuell sehe ich keine freien Zeiten. Ich schicke gern Ihre Nachricht ans Team — wie darf ich Sie nennen?', mode: 'scripted' }
  }
  if (/(r(ü|ue)ckruf|zur(ü|ue)ckrufen|melden|anrufen lassen|nachricht|hinterlassen|ausrichten|bescheid)/.test(low)) return { reply: `Sehr gern schicke ich ${teamName} Ihre Nachricht. Wie darf ich Sie nennen?`, mode: 'scripted' }
  if (/(status|erreichbar|frei|sprechen mit|durchstellen)/.test(low) && p.person) {
    const st = (await runTeamStatus()) as Record<string, { status: string }>
    const smap: Record<string, string> = { available: 'gerade erreichbar', meeting: 'gerade im Termin', offline: 'aktuell nicht am Platz', training: 'im Training', vacation: 'im Urlaub' }
    const status = st[person]?.status || 'offline'
    if (status === 'available') return { reply: `${firstName} ist ${smap[status]}. Ich versuche zu verbinden — worum geht es kurz?`, mode: 'scripted' }
    return { reply: `${firstName} ist ${smap[status] || status}. Soll ich ${firstName} Ihre Nachricht mit einer Rückrufnummer schicken?`, mode: 'scripted' }
  }
  if (/(preis|kost|teuer|was kostet|invest)/.test(low)) return { reply: 'Zu Zahlen sage ich am Telefon ungern etwas Verbindliches — was passt und ob Plätze frei sind, klären wir am besten kurz persönlich. Soll ich einen Termin einrichten oder Ihre Nachricht ans Team schicken?', mode: 'scripted' }
  if (/(info|was macht|was ist|erz(ä|ae)hl|academy|salesmade|angebot|programm|leistung|frameworks?)/.test(low)) return { reply: 'Wir machen B2B-Vertrieb planbar — Ausbildung fürs Sales-Team, AI im Verkauf und Leadership. Wo steht Euer Team gerade? Dann sage ich, was passt — oder ich schicke Ihre Nachricht ans Team.', mode: 'scripted' }
  if (/(vertrieb|sales|verkauf|neukunde|akquise)/.test(low)) return { reply: 'Da hilft unser Vertriebs-Team. Möchten Sie einen Termin, oder soll ich Ihre Nachricht mit Rückrufnummer schicken?', mode: 'scripted' }
  if (/(kunde|teilnehmer|betreuung|umbuchen|programm l(ä|ae)uft|schon dabei)/.test(low)) return { reply: 'Für laufende Programme ist die Kundenbetreuung da. Ich kann einen Termin einrichten oder Ihre Nachricht weiterleiten — was möchten Sie?', mode: 'scripted' }
  if (/\b(markus)\b/.test(low)) return { reply: 'Gern. Soll ich Markus Ihre Nachricht mit einer Rückrufnummer schicken, oder möchten Sie einen Termin?', mode: 'scripted' }
  if (/\b(aljona)\b/.test(low)) return { reply: 'Gern. Soll ich Aljona Ihre Nachricht schicken, oder einen Termin einrichten?', mode: 'scripted' }
  if (/\b(cosima)\b/.test(low)) return { reply: 'Gern. Soll ich Cosima Ihre Nachricht mit Rückrufnummer schicken?', mode: 'scripted' }
  if (/\b(daniel)\b/.test(low)) return { reply: 'Gern. Soll ich Daniel Ihre Nachricht mit Rückrufnummer schicken?', mode: 'scripted' }
  if (/(hallo|hi\b|guten|hey|servus|moin)/.test(low)) return { reply: 'Hallo! Ich kann Sie mit Vertrieb, Kundenbetreuung oder Infos weiterbringen, einen Termin einrichten — oder ich schicke jemandem im Team Ihre Nachricht. Was möchten Sie?', mode: 'scripted' }
  if (/(danke|tsch(ü|ue)ss|wiederh(ö|oe)ren|ciao|auf wiedersehen)/.test(low)) return { reply: 'Sehr gern — bis bald!', mode: 'scripted' }
  if (no && /anliegen|r(ü|ue)ckruf|termin|nachricht/i.test(lastA)) return { reply: 'Alles gut. Schauen Sie gern auf eilersfriends.com vorbei oder rufen Sie später wieder an. Bis bald!', mode: 'scripted' }

  return { reply: 'Ich kann Sie mit Vertrieb, Kundenbetreuung oder Infos weiterbringen, einen Termin einrichten — oder ich schicke jemandem im Team Ihre Nachricht mit Rückrufnummer. Was davon passt für Sie?', mode: 'scripted' }
}

export async function runAgent(dw: number, messages: Msg[], ctx?: Ctx): Promise<{ reply: string; mode: string; tools?: string[] }> {
  const p = persona(dw)
  if (!messages.length) return { reply: p.greeting, mode: 'greeting' }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return await scriptedReply(dw, messages, ctx)

  const model = process.env.VOICE_AGENT_MODEL || 'claude-sonnet-4-6'
  const systemPrompt = p.system + '\n\n' + await knowledgeContext()
  const convo: Array<{ role: 'user' | 'assistant'; content: unknown }> = messages.map(m => ({ role: m.role, content: m.content }))
  const usedTools: string[] = []
  try {
    for (let i = 0; i < 5; i++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 220, system: systemPrompt, tools: TOOLS, messages: convo }),
      })
      const data = await res.json()
      if (!res.ok) { console.error('anthropic', data); return await scriptedReply(dw, messages, ctx) }
      const content = data.content as Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>
      if (data.stop_reason === 'tool_use') {
        convo.push({ role: 'assistant', content })
        const results = []
        for (const block of content) {
          if (block.type === 'tool_use') { usedTools.push(block.name || ''); const out = await execTool(block.name || '', block.input || {}, { dw, defaultPerson: p.person, messages, ctx }); results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) }) }
        }
        convo.push({ role: 'user', content: results })
        continue
      }
      const text = content.filter(c => c.type === 'text').map(c => c.text).join(' ').trim()
      return { reply: text || 'Einen Moment bitte.', mode: 'claude', tools: usedTools }
    }
    return { reply: 'Einen Moment, ich verbinde Sie mit dem Team.', mode: 'claude', tools: usedTools }
  } catch (e) { console.error(e); return await scriptedReply(dw, messages, ctx) }
}
