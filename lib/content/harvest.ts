import { addSnippet, addEvidence } from './catalog'
import { checkSnippet } from './claims'
import type { Post } from '@/lib/blog/posts'

/**
 * Die Rueckkopplung.
 *
 * Was veroeffentlicht wurde, kommt als Beleg in den Katalog zurueck — nicht die
 * Fassung, die freigegeben wurde, sondern die, die tatsaechlich draussen steht.
 * Das ist der Unterschied, auf den es ankommt: zwischen Freigabe und Posting
 * wird oft noch etwas geaendert, und genau diese Aenderung ist die
 * interessanteste im ganzen Ablauf.
 *
 * Was hier ankommt, ist ein Kandidat mit einem Beleg — nicht mehr. Ob der Satz
 * gut war, entscheidet spaeter die Wirkung, nicht die Veroeffentlichung.
 */

/** Die Saetze, die als Baustein taugen. Ein Absatz ist keiner. */
function sentences(text: string): string[] {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>]/g, '')
    // Ohne Rueckblick im Muster — das Sprachziel des Projekts kennt ihn nicht.
    .replace(/([.!?])\s+/g, '$1\u0000')
    .split('\u0000')
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 220)
}

/** Der Einstieg: die ersten Saetze bis zum ersten Absatzende. */
function hookOf(text: string): string | null {
  const first = text.split(/\n{2,}/)[0]?.replace(/^#{1,6}\s+/, '').trim()
  if (!first || first.length < 20) return null
  return first.length > 260 ? `${first.slice(0, 255)}…` : first
}

export interface HarvestResult { aufgenommen: number; gesperrt: number; bausteine: string[] }

export async function harvestPost(input: {
  companyId: string
  post: Pick<Post, 'id' | 'slug' | 'title' | 'subtitle' | 'excerpt' | 'content' | 'author_slug' | 'tags'>
  channel?: string
  segmentKey?: string | null
  url?: string | null
}): Promise<HarvestResult> {
  const { post } = input
  const text = post.content ?? ''
  const ref = input.url ?? `blog:${post.slug}`
  const taken: string[] = []
  let blocked = 0

  const candidates: Array<{ kind: Parameters<typeof addSnippet>[0]['kind']; text: string; score?: number }> = []

  if (post.title?.trim()) candidates.push({ kind: 'headline', text: post.title.trim() })
  if (post.subtitle?.trim()) candidates.push({ kind: 'subheadline', text: post.subtitle.trim() })
  const hook = hookOf(text)
  if (hook) candidates.push({ kind: 'hook', text: hook })

  // Aus dem Fliesstext nur, was fuer sich stehen kann: kurze Saetze mit einem
  // Gedanken. Lange Erklaerungen taugen nicht als Baustein, weil sie ihren
  // Zusammenhang brauchen.
  for (const s of sentences(text)) {
    const words = s.split(/\s+/).length
    if (words < 6 || words > 26) continue
    if (/^(und|aber|denn|weil|das heißt|zum beispiel)/i.test(s)) continue
    candidates.push({ kind: 'botschaft', text: s })
    if (candidates.length > 14) break
  }

  for (const c of candidates) {
    const id = await addSnippet({
      companyId: input.companyId,
      segmentKey: input.segmentKey ?? null,
      kind: c.kind,
      text: c.text,
      channel: input.channel ?? 'blog',
      pillar: (post.tags ?? [])[0] ?? null,
      source: 'gepostet',
      sourceRef: ref,
    })
    if (!id) continue
    // Claims zuerst — was unzulaessig ist, wird gesperrt und bekommt keinen Beleg.
    const check = await checkSnippet(id).catch(() => ({ status: 'ungeprueft' as string }))
    if (check.status === 'unzulaessig') { blocked++; continue }
    await addEvidence({ snippetId: id, kind: 'gepostet', sourceRef: ref, note: post.title })
    taken.push(c.text)
  }

  return { aufgenommen: taken.length, gesperrt: blocked, bausteine: taken }
}
