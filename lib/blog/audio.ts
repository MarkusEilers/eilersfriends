import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { parseBlocks } from '@/components/blog/PostBody'

/**
 * Vorlesefassung der Beiträge (KI-Stimme, OpenAI gpt-4o-mini-tts).
 *
 * Wird serverseitig erzeugt, sobald ein Beitrag veröffentlicht oder sein Text geändert wird —
 * je Sprachfassung eine eigene MP3. Stimme je Autor:in (Markus: tief, männlich; Aljona: warm, weiblich).
 * Ein Hash über Text + Stimme verhindert, dass unveränderte Beiträge neu vertont werden.
 * Sobald eigene Stimmprofile (ElevenLabs) da sind, wird nur synthesize() ausgetauscht.
 */

const VOICE: Record<string, string> = { markus: 'onyx', aljona: 'coral' }
const LANG: Record<string, string> = { de: 'Deutsch', en: 'English', es: 'Español', ru: 'Русский' }
const STYLE: Record<string, string> = {
  markus: 'a calm, warm, confident male business coach telling a true story to a founder; natural pace, short pauses between paragraphs, slight smile in the voice, never salesy',
  aljona: 'a warm, clear, confident female leadership coach telling a personal story; natural pace, short pauses between paragraphs, empathetic and calm, never theatrical',
}

let ready = false
export async function ensureAudioSchema() {
  if (ready) return
  for (const q of [
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audio_url TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audio_hash TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audio_minutes INTEGER`,
  ]) await db.execute(q).catch(() => {})
  ready = true
}

const strip = (s: string) => s
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\{\{([^}|¦]+)(?:[|¦][^}]*)?\}\}/g, '$1')
  .replace(/\(\((.+?)\)\)/g, '$1')
  .replace(/\*\*|==|%/g, '').replace(/(^|\s)\*([^*]+)\*/g, '$1$2')
  .replace(/\s+/g, ' ').trim()

/** Text zum Vorlesen: Fließtext und die Aussagen der Bausteine, ohne Grafik-Beschriftungen, Glossar und Bildunterschriften. */
export function narrationText(post: { title: string; subtitle?: string | null; content?: string | null; author?: string | null }, locale = 'de') {
  const by = { de: 'Von', en: 'By', es: 'Por', ru: 'Автор:' }[locale] ?? 'Von'
  const out: string[] = [strip(post.title), post.subtitle ? strip(post.subtitle) : '', post.author ? `${by} ${post.author}.` : '']
  for (const b of parseBlocks(post.content ?? '')) {
    if (b.t === 'h2' || b.t === 'h3' || b.t === 'p' || b.t === 'quote') out.push(strip(b.text))
    else if (b.t === 'say') out.push(`${b.who}: ${strip(b.text)}`)
    else if (b.t === 'ul' || b.t === 'ol') out.push(b.items.map(strip).join('. '))
    else if (b.t === 'box') {
      const lines = b.lines.map((l) => l.trim()).filter((l) => l && !/^[~^]\s/.test(l) && l !== '---')
      const cols = (l: string) => l.replace(/^\d+[.)]\s|^[-?+!]\s|^=\s/, '').split('|').map((x) => strip(x)).filter(Boolean)
      switch (b.kind) {
        case 'glossar': case 'crm': case 'kreise': case 'folie': case 'video': case 'fahrplan': case 'gipfel': case 'balken': case 'chat':
          break
        case 'weiter': {
          const label = b.arg.split('|')[0]?.trim()
          if (lines[0]) out.push(`${strip(label ?? '')}: ${strip(lines[0])}.`)
          break
        }
        case 'zahl': out.push(strip(b.arg.replace('|', ' '))); break
        case 'menschen': out.push(strip(b.arg.replace('|', ' '))); break
        case 'hud': out.push(strip(b.arg.replace('|', ', ')), ...lines.map(strip)); break
        case 'anteil': out.push(...lines.filter((l) => !l.startsWith('klammer ')).map((l) => cols(l).slice(2).join(' '))); break
        case 'protokoll': out.push(lines.map((l) => cols(l).slice(1).join(' ')).join(' ')); break
        case 'notiz': out.push(...lines.filter((l) => !l.startsWith('- ')).map((l) => strip(l.replace(/^\?\s/, '')))); break
        case 'vergleich': out.push(...lines.map((l) => cols(l).join(': '))); break
        default: out.push(...lines.map((l) => cols(l).join(': ')))
      }
    }
  }
  return out.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + `\n\n${{ de: 'Langfassung und Grafiken auf eilersfriends.com.', en: 'Full version with graphics at eilersfriends.com.', es: 'Versión completa con gráficos en eilersfriends.com.', ru: 'Полная версия с графиками на eilersfriends.com.' }[locale] ?? ''}`
}

/** In Stücke unter ~1800 Zeichen teilen, an Absatz- bzw. Satzgrenzen */
function chunks(text: string, max = 1800) {
  const out: string[] = []
  let cur = ''
  for (const para of text.split(/\n\n+/)) {
    const parts = para.length > max ? para.match(/[^.!?]+[.!?]+["“”«»]?\s*|[^.!?]+$/g) ?? [para] : [para]
    for (const p of parts) {
      if ((cur + '\n\n' + p).length > max && cur) { out.push(cur); cur = p } else cur = cur ? `${cur}\n\n${p}` : p
    }
  }
  if (cur) out.push(cur)
  return out
}

async function synthesize(text: string, voice: string, instructions: string): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, instructions, response_format: 'mp3' }),
  })
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Vorlesefassung erzeugen (oder überspringen, wenn sich nichts geändert hat). Gibt die URL zurück. */
export async function generatePostAudio(id: string, opts?: { force?: boolean }): Promise<{ url: string | null; skipped?: boolean }> {
  await ensureAudioSchema()
  const rows = (await db.execute(sql`SELECT id, slug, title, subtitle, content, author, author_slug, locale, status, audio_hash, audio_url FROM blog_posts WHERE id = ${id}`)) as unknown as Array<{ id: string; slug: string; title: string; subtitle: string | null; content: string | null; author: string | null; author_slug: string; locale: string; status: string; audio_hash: string | null; audio_url: string | null }>
  const p = rows[0]
  if (!p || p.status !== 'published' || !p.content?.trim()) return { url: null, skipped: true }
  const voice = VOICE[p.author_slug] ?? 'onyx'
  const text = narrationText(p, p.locale)
  const hash = createHash('sha256').update(`${voice}|${p.locale}|${text}`).digest('hex').slice(0, 24)
  if (!opts?.force && p.audio_hash === hash && p.audio_url) return { url: p.audio_url, skipped: true }
  const instructions = `Read in ${LANG[p.locale] ?? 'Deutsch'}. Voice: ${STYLE[p.author_slug] ?? STYLE.markus}. Pronounce English terms like "AI", "Leader", "Trial Close" naturally.`
  const parts: Buffer[] = []
  const list = chunks(text)
  for (let i = 0; i < list.length; i += 3) {
    const batch = await Promise.all(list.slice(i, i + 3).map((c) => synthesize(c, voice, instructions)))
    parts.push(...batch)
  }
  const mp3 = Buffer.concat(parts)
  const { put } = await import('@vercel/blob')
  const blob = await put(`blog-audio/${p.slug}-${p.locale}-${hash.slice(0, 8)}.mp3`, mp3, { access: 'public', contentType: 'audio/mpeg', token: process.env.BLOB_READ_WRITE_TOKEN })
  const minutes = Math.max(1, Math.round(text.split(/\s+/).length / 150))
  await db.execute(sql`UPDATE blog_posts SET audio_url = ${blob.url}, audio_hash = ${hash}, audio_minutes = ${minutes} WHERE id = ${p.id}`)
  return { url: blob.url }
}
