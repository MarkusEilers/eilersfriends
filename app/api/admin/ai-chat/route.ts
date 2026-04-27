import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

interface SectionContext {
  id: string
  type: string
  content: Record<string, unknown>
}

const SYSTEM_PROMPT = `Du bist der LP Co-Pilot für Eilers+Friends — eine deutschsprachige B2B-Marketing-Plattform.

KONTEXT
- Die Site nutzt einen Landing-Page-Builder mit folgenden Sektionstypen:
  hero, video, social_proof, problem, origin_story, solution, features,
  how_it_works, curriculum, bonus_deliverables, fit_check, testimonials,
  tweet_wall, offer, pricing_card, risk_reversal, faq, email_capture,
  cta, coach_bio, spacer
- Vorbilder & Tonalität: Justin Welsh, Taki Moore, Matt Gray.
- Zielgruppe: B2B-Founder, CEOs, Sales-Verantwortliche.
- Sprache: Deutsch (Du-Form, direkt, klar, ohne Marketing-Schwafel).

WAS DU TUST
1. Ich gebe dir die aktuelle Page (Liste der Sektionen mit content-JSON) plus
   optional eine markierte Sektion (selectedSection).
2. Du beantwortest die User-Anfrage entweder mit reinem Text (Vorschläge,
   Headlines, Erklärungen) ODER mit einem strukturierten payload, der direkt
   auf die Page angewendet wird.

PAYLOAD-FORMAT (immer gültiges JSON in einem Markdown-Codeblock am Ende der Antwort)
- Single section update:
  \`\`\`payload
  { "kind": "apply_section", "content": { ... new content JSON ... } }
  \`\`\`
- Full page replacement:
  \`\`\`payload
  { "kind": "replace_all", "sections": [
    { "type": "hero", "content": { ... } },
    { "type": "problem", "content": { ... } },
    ...
  ]}
  \`\`\`

WICHTIG für apply_section:
- content-JSON muss zu dem Sektionstyp passen.
- Behalte vorhandene Felder, ergänze/ersetze nur sinnvoll.
- Beispiel hero: { headline, subheadline, ctaLabel, ctaHref, eyebrow }
- Beispiel curriculum: { headline, subheadline, modules: [{ title, description, lessons }] }
- Beispiel tweet_wall: { headline, tweets: [{ name, handle, body, date }] }

WENN keine Aktion nötig (z.B. Headline-Vorschläge zur Auswahl), antworte
in Plain-Text — KEIN payload-Codeblock.

STIL
- Kurze Sätze. Konkrete Beispiele. Keine Floskeln.
- Du-Form, NICHT Sie-Form.
- Bei Headlines: 7-12 Worte ideal. Bei Body: 1-3 Sätze.`

export async function POST(request: Request) {
  // ── 1. Auth check ────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ────────────────────────────────────────────────────
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { messages = [], page, sections = [], selectedSectionId } = body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    page?: { id: string; title: string; slug: string }
    sections?: SectionContext[]
    selectedSectionId?: string | null
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'no messages' }, { status: 400 })
  }

  // ── 3. Anthropic API key ─────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'ANTHROPIC_API_KEY nicht gesetzt. Im Vercel-Dashboard unter Settings → Environment Variables anlegen.',
      },
      { status: 503 },
    )
  }

  // ── 4. Build context preamble ────────────────────────────────────────
  const selectedSection = sections.find((s) => s.id === selectedSectionId)
  const contextBlock = `AKTUELLER ZUSTAND
Page: "${page?.title ?? '(unbenannt)'}" (slug: ${page?.slug ?? '?'})
Sektionen: ${sections.length} insgesamt

${selectedSection ? `MARKIERTE SEKTION (zum direkten Bearbeiten gedacht):
type: ${selectedSection.type}
content:
${JSON.stringify(selectedSection.content, null, 2)}` : '(keine Sektion markiert)'}

ALLE SEKTIONEN (Reihenfolge):
${sections
  .map(
    (s, i) => `[${i}] ${s.type}: ${JSON.stringify(s.content).slice(0, 200)}${
      JSON.stringify(s.content).length > 200 ? '…' : ''
    }`,
  )
  .join('\n')}`

  // Inject context into the first user message
  const enrichedMessages = messages.map((m, i) =>
    i === 0 && m.role === 'user'
      ? { role: 'user' as const, content: `${contextBlock}\n\n---\n\nUSER-ANFRAGE:\n${m.content}` }
      : m,
  )

  // ── 5. Call Claude ───────────────────────────────────────────────────
  let claudeResponse: Response
  try {
    claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: enrichedMessages,
      }),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Claude API unreachable', detail: String(err) }, { status: 502 })
  }

  if (!claudeResponse.ok) {
    const detail = await claudeResponse.text()
    return NextResponse.json(
      { error: `Claude API error ${claudeResponse.status}`, detail: detail.slice(0, 500) },
      { status: 502 },
    )
  }

  const data = await claudeResponse.json()
  const text: string = data?.content?.[0]?.text ?? '(leere Antwort)'

  // ── 6. Extract payload (if present) ──────────────────────────────────
  let payload: { kind: string; [k: string]: any } | undefined
  let cleanText = text
  const payloadMatch = text.match(/```payload\s*\n([\s\S]*?)\n```/)
  if (payloadMatch) {
    try {
      payload = JSON.parse(payloadMatch[1])
      cleanText = text.replace(/```payload[\s\S]*?```/, '').trim()
    } catch (e) {
      // payload didn't parse — leave it in the text
    }
  }

  return NextResponse.json({
    text: cleanText || 'Vorschlag generiert — siehe Aktion unten.',
    payload,
    usage: data?.usage,
  })
}
