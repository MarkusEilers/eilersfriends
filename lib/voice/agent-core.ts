import { persona, fillIdentity } from './personas'
import { runBrainClaude } from '@/lib/brain/core'
import { runGetSlots, runTeamStatus } from './tools'
import { logActivity } from './store'
import { sendTeamNotification } from './notify'

export type Msg = { role: 'user' | 'assistant'; content: string }
export type Ctx = { callerId?: string; source?: string; assistant?: { name?: string; gender?: 'f' | 'm' } }

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
// Sprech-Normalisierung (nur fuer TTS, nicht fuer Transkript/E-Mail):
// Telefonnummern Ziffer-fuer-Ziffer, Abkuerzungen/Namen phonetisch. Leicht erweiterbar.
const SPEAK_MAP: [RegExp, string][] = [
  [/\bAljona\b/gi, 'Aliona'],
  [/\bSDR\b/g, 'Ess Dee Arr'],
  [/\bCRM\b/g, 'Ssieh Arr Emm'],
  [/\bCRO\b/g, 'Ssieh Arr Oh'],
  [/\bCEO\b/g, 'Ssieh Ieh Oh'],
  [/\bB2B\b/g, 'Bieh tu Bieh'],
  [/\bKPIs?\b/g, 'Kah Pieh Eis'],
  [/\bROI\b/g, 'Arr Oh Ieh'],
]
function spaceNumbers(t: string): string {
  return t.replace(/\+?\d[\d\s/().\-]{5,}\d/g, (m) => {
    const plus = m.trim().startsWith('+')
    const digits = m.replace(/\D/g, '')
    if (digits.length < 7) return m
    return (plus ? 'plus ' : '') + digits.split('').join(' ')
  })
}
export function speakable(t: string): string {
  let s = stripSpeakable(t)
  for (const [re, rep] of SPEAK_MAP) s = s.replace(re, rep)
  return spaceNumbers(s)
}
export function renderTranscript(messages: Msg[]): string {
  return messages.map(m => (m.role === 'user' ? 'Anrufer' : 'Assistentin') + ': ' + m.content).join('\n')
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
  const idName = ctx?.assistant?.name || 'Eilisabet'
  const idGender: 'f' | 'm' = ctx?.assistant?.gender || 'f'
  if (!messages.length) return { reply: fillIdentity(p.greeting, idName, idGender), mode: 'greeting' }
  const r = await runBrainClaude({ channel: 'voice', dw, assistant: ctx?.assistant, messages, ctx })
  if (r) return { reply: r.reply || 'Einen Moment bitte.', mode: r.mode, tools: r.tools }
  return await scriptedReply(dw, messages, ctx)
}
