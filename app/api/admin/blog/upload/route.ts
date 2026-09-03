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
      const mammoth = await import('mammoth')
      const buf = Buffer.from(await file.arrayBuffer())
      const res = await mammoth.convertToMarkdown({ buffer: buf })
      text = res.value
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
