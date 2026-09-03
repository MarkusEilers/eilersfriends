import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readingMinutes } from '@/lib/blog/admin'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Eine Datei wird zu einem Entwurf.
 *
 * Markdown direkt, Word ueber mammoth. Titel ist die erste Ueberschrift, und
 * wenn es keine gibt, die erste Zeile — was danach kommt, ist Text. Kein
 * Ratespiel um Metadaten: alles Weitere setzt man im Editor, wo man es sieht.
 */
/** Nur so viel HTML, wie aus einem Word-Dokument herauskommt. */
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, s) => `\n> ${String(s).replace(/<[^>]+>/g, '').trim()}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function POST(req: Request) {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

  const name = file.name.toLowerCase()
  let text = ''
  try {
    if (name.endsWith('.docx')) {
      // mammoth kennt in den Typen nur convertToHtml — der Markdown-Wandler
      // existiert zur Laufzeit, steht aber nicht in der Typdefinition.
      const mammoth = (await import('mammoth')) as unknown as {
        convertToMarkdown?: (o: { buffer: Buffer }) => Promise<{ value: string }>
        convertToHtml: (o: { buffer: Buffer }) => Promise<{ value: string }>
      }
      const buf = Buffer.from(await file.arrayBuffer())
      if (mammoth.convertToMarkdown) {
        text = (await mammoth.convertToMarkdown({ buffer: buf })).value
      } else {
        text = htmlToMarkdown((await mammoth.convertToHtml({ buffer: buf })).value)
      }
    } else if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
      text = await file.text()
    } else {
      return NextResponse.json({ error: 'Nur .md, .txt oder .docx' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: `Datei nicht lesbar: ${String(e).slice(0, 160)}` }, { status: 400 })
  }

  // Frontmatter mitnehmen, falls jemand es gewohnt ist, es zu schreiben.
  let front: Record<string, string> = {}
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/i)
      if (m) front[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
    text = text.slice(fm[0].length)
  }

  const lines = text.split('\n')
  let title = front.title ?? ''
  if (!title) {
    const h1 = lines.findIndex((l) => /^#\s+/.test(l))
    if (h1 >= 0) { title = lines[h1].replace(/^#\s+/, '').trim(); lines.splice(h1, 1) }
    else { title = (lines.find((l) => l.trim()) ?? 'Ohne Titel').trim().slice(0, 140) }
  }
  const content = lines.join('\n').trim()

  return NextResponse.json({
    ok: true,
    draft: {
      title,
      subtitle: front.subtitle ?? null,
      excerpt: front.excerpt ?? null,
      content,
      tags: front.tags ? front.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      authorSlug: front.author?.toLowerCase().includes('aljona') ? 'aljona' : 'markus',
      readingMinutes: readingMinutes(content),
    },
  })
}
