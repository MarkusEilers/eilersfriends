'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createOffer, updateOffer, getOfferById } from '@/lib/db/queries/offers'
import { HERO_STYLE_BRIEF, type HeroStyle } from '@/lib/offer/hero-styles'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
  return session
}

export async function createOfferAction(formData: FormData) {
  await requireAdmin()
  const customerName = String(formData.get('customerName') || '').trim()
  const customerCompany = String(formData.get('customerCompany') || '').trim() || null
  const customerEmail = String(formData.get('customerEmail') || '').trim() || null
  const title = String(formData.get('title') || '').trim()
  const subtitle = String(formData.get('subtitle') || '').trim() || null
  const tagline = String(formData.get('tagline') || '').trim() || null
  if (!customerName) throw new Error('customerName required')
  if (!title) throw new Error('title required')
  const offer = await createOffer({ customerName, customerCompany, customerEmail, title, subtitle, tagline })
  revalidatePath('/admin/offers')
  redirect(`/admin/offers/${offer.id}`)
}

interface UpdatePayload {
  title?: string
  subtitle?: string | null
  tagline?: string | null
  customerName?: string
  customerCompany?: string | null
  customerEmail?: string | null
  understandingSection?: { title?: string; goals?: string[]; challenges?: string[] }
  empathySection?: { title?: string; statement?: string; successMessage?: string }
  economicResults?: Array<{ icon?: string; title: string; description?: string }>
  programs?: unknown[]
  recipientRole?: string | null
  meetingNotes?: string | null
  programId?: string | null
  aiPrompt?: string | null
  sweatEquityEnabled?: boolean
  sweatEquityPercent?: number | null
  sectionOrder?: object
  // Wave 2.F
  customerLogoUrl?: string | null
  customerLogoUrlBw?: string | null
  guaranteeText?: string | null
  // Wave 3
  paymentCardEnabled?: boolean
  paymentInvoiceEnabled?: boolean
  rhythmMonthlyEnabled?: boolean
  rhythmUpfrontEnabled?: boolean
  upfrontDiscountPct?: number | null
  track?: unknown[]
  teamMembers?: string[]
  teamHeading?: string | null
  heroImageUrl?: string | null
}

export async function updateOfferAction(id: string, payload: UpdatePayload) {
  await requireAdmin()
  await updateOffer(id, payload)
  revalidatePath(`/admin/offers/${id}`)
}

export async function setOfferStatusAction(id: string, status: 'draft' | 'sent' | 'signed' | 'paid' | 'expired' | 'cancelled') {
  await requireAdmin()
  await updateOffer(id, { status })
  revalidatePath(`/admin/offers/${id}`)
  revalidatePath('/admin/offers')
}

// AI-Suggest — calls OpenAI gpt-4o-mini for section-specific copy generation
interface SuggestRequest {
  offerId: string
  section: 'title' | 'understanding' | 'empathy' | 'economic' | 'pricing'
  customPrompt?: string
}

export async function suggestSectionAction(req: SuggestRequest): Promise<{ ok: true; suggestion: unknown } | { ok: false; error: string }> {
  await requireAdmin()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY not set' }

  const offer = await getOfferById(req.offerId)
  if (!offer) return { ok: false, error: 'offer not found' }

  const customerCtx = `${offer.customer_name}${offer.customer_company ? ` (${offer.customer_company})` : ''}`
  const offerCtx = `Angebot: "${offer.title}"${offer.subtitle ? ` — ${offer.subtitle}` : ''}`

  const prompts: Record<SuggestRequest['section'], { sys: string; user: string; jsonSchema: string }> = {
    title: {
      sys: 'Du bist ein erfahrener B2B-Sales-Copywriter. Schreibe knackige, persönliche Angebotstitel auf Deutsch. Stil: Markus Eilers — direkt, neugierig, kein Marketing-Sprech. Knapp.',
      user: `Schreibe einen neuen Titel + Subtitle + Tagline für ein Coaching/Sales-Angebot an ${customerCtx}. Aktueller Stand: ${offerCtx}. Tagline = 1 kurzer Hook. Subtitle = 1 Satz, was der Kunde bekommt.${req.customPrompt ? '\n\nZusätzliche Hinweise: ' + req.customPrompt : ''}`,
      jsonSchema: '{"title": string, "subtitle": string, "tagline": string}',
    },
    understanding: {
      sys: 'Du bist ein präziser B2B-Sales-Discovery-Analyst. Du formulierst Ziele und Herausforderungen so, dass der Kunde sich verstanden fühlt — konkret, nicht generisch.',
      user: `Generiere für ein Angebot an ${customerCtx} (${offerCtx}) 3–5 konkrete Ziele + 3–5 Herausforderungen, die typisch für deren Situation sind.${req.customPrompt ? '\n\nKontext vom Berater: ' + req.customPrompt : ''}`,
      jsonSchema: '{"title": "Das haben wir verstanden.", "goals": string[], "challenges": string[]}',
    },
    empathy: {
      sys: 'Du formulierst empathische, persönliche Statements im Stil von Markus Eilers: warm, direkt, ohne Coach-Sprech. Du sprichst den Kunden mit Du an.',
      user: `Schreibe für ${customerCtx} (${offerCtx}) ein Empathy-Statement: ein kurzes "Wir verstehen Dich"-Zitat (1–2 Sätze) + eine kurze Success-Message (1 Satz, was Erfolg für uns heißt).${req.customPrompt ? '\n\nZusätzlich: ' + req.customPrompt : ''}`,
      jsonSchema: '{"title": "Was uns wichtig ist", "statement": string, "successMessage": string}',
    },
    economic: {
      sys: 'Du formulierst messbare Ergebnis-Versprechen für B2B-Sales-Coaching im persönlichen Markus-Stil. Konkret, glaubwürdig, kein Hype.',
      user: `Schreibe für ${customerCtx} (${offerCtx}) 4–6 ökonomische Ergebnis-Tiles. Jedes Tile: kurzer Titel (max 6 Worte) + 1-Zeilen-Beschreibung.${req.customPrompt ? '\n\nZusätzlich: ' + req.customPrompt : ''}`,
      jsonSchema: '[{"icon": "target"|"users"|"trending-up"|"shield"|"zap"|"star", "title": string, "description": string}]',
    },
    pricing: {
      sys: 'Du strukturierst Preis-Optionen klar in DIY/DWY/DFY (Do-It-Yourself / Done-With-You / Done-For-You). Jede Option hat Features.',
      user: `Schreibe für ${customerCtx} (${offerCtx}) 3 Preis-Optionen (DIY, DWY, DFY). Nur Struktur — Preise lässt Du frei zum Befüllen. Pro Option: title, description (1 Satz), 4–6 features.${req.customPrompt ? '\n\nZusätzlich: ' + req.customPrompt : ''}`,
      jsonSchema: '[{"type": "DIY"|"DWY"|"DFY", "title": string, "description": string, "price": 0, "monthlyDuration": 1, "features": string[], "recommended": boolean}]',
    },
  }

  const p = prompts[req.section]
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: p.sys + ` Antworte AUSSCHLIESSLICH als JSON nach diesem Schema: ${p.jsonSchema}. Kein Kommentar, kein Markdown, nur JSON.` },
      { role: 'user', content: p.user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    return { ok: false, error: `OpenAI ${res.status}: ${t.slice(0, 300)}` }
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return { ok: false, error: 'empty response' }

  try {
    // For 'economic' and 'pricing' we asked for an array — but response_format wraps as {sections: [...]}
    // Normalise: if the parsed JSON has exactly one array property at root, return that array.
    const parsed = JSON.parse(content)
    if (req.section === 'economic' || req.section === 'pricing') {
      if (Array.isArray(parsed)) return { ok: true, suggestion: parsed }
      // Find first array prop
      const arr = Object.values(parsed).find((v) => Array.isArray(v))
      if (arr) return { ok: true, suggestion: arr }
    }
    return { ok: true, suggestion: parsed }
  } catch {
    return { ok: false, error: 'invalid JSON from OpenAI' }
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Hero-Bild-Prompt vorschlagen — baut aus Angebotsinhalt (Ziele, Ergebnisse,
 * Kunde/Branche) + gewähltem Stil einen fertigen Bild-Prompt für gpt-image-2.
 * ────────────────────────────────────────────────────────────────────── */
export async function suggestHeroPromptAction(req: { offerId: string; style: HeroStyle; extra?: string }):
  Promise<{ ok: true; prompt: string } | { ok: false; error: string }> {
  await requireAdmin()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY not set' }

  const offer = await getOfferById(req.offerId)
  if (!offer) return { ok: false, error: 'offer not found' }

  const o = offer as Record<string, unknown>
  const understanding = (o.understanding_section ?? {}) as { goals?: string[]; challenges?: string[] }
  const economic = (o.economic_results ?? []) as Array<{ title?: string; description?: string }>
  const ctx = [
    `Kunde: ${o.customer_name}${o.customer_company ? ` (${o.customer_company})` : ''}`,
    `Angebot: ${o.title}${o.subtitle ? ` — ${o.subtitle}` : ''}`,
    understanding.goals?.length ? `Ziele des Kunden: ${understanding.goals.join('; ')}` : '',
    economic.length ? `Versprochene Ergebnisse: ${economic.map((e) => e.title).filter(Boolean).join('; ')}` : '',
  ].filter(Boolean).join('\n')

  const sys = 'Du bist Art Director und schreibst Prompts für fotorealistische Bildgenerierung (gpt-image-2). '
    + 'Du lieferst EINEN englischen Prompt für ein Hero-Hintergrundbild einer B2B-Angebotsseite. '
    + 'Pflicht: kein Text/keine Buchstaben/keine Logos im Bild; 3:2 Querformat; dunkle, ruhige Bildbereiche oben für weiße Headline; '
    + 'das Motiv wird später mit 75% dunkelblauem Overlay (#0F1E3A) überlagert, muss also mit dunklen Blautönen harmonieren und darf nicht zu hell oder zu bunt sein. '
    + 'Das Bild soll den ERREICHTEN Erfolgszustand des Kunden visualisieren, nicht das Problem. Keine Menschen mit erkennbaren Gesichtern in Nahaufnahme.'
  const user = `Kontext des Angebots:\n${ctx}\n\nGewünschter Stil: ${HERO_STYLE_BRIEF[req.style]}`
    + (req.extra?.trim() ? `\n\nZusätzliche Wünsche: ${req.extra.trim()}` : '')
    + '\n\nAntworte als JSON: {"prompt": string}'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  })
  if (!res.ok) return { ok: false, error: `OpenAI ${res.status}` }
  const data = await res.json()
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt : ''
    if (!prompt) return { ok: false, error: 'empty prompt' }
    return { ok: true, prompt }
  } catch { return { ok: false, error: 'invalid JSON' } }
}

/* ──────────────────────────────────────────────────────────────────────
 * Draft-Create — single-click "+ Neues Angebot" button.
 * Creates an empty draft with placeholder values and redirects to the
 * editor for filling in the real data.
 * ────────────────────────────────────────────────────────────────────── */
export async function createDraftOfferAction() {
  await requireAdmin()
  const { createOffer } = await import('@/lib/db/queries/offers')
  const offer = await createOffer({
    customerName: 'Neuer Kunde',
    customerCompany: null,
    customerEmail: null,
    title: 'Neues Angebot',
    subtitle: null,
    tagline: null,
  })
  revalidatePath('/admin/offers')
  redirect(`/admin/offers/${offer.id}`)
}

/* Sign-out wrapper for the admin top-bar logout icon. */
export async function signOutAdminAction() {
  const { signOut } = await import('@/lib/auth')
  await signOut({ redirectTo: '/auth/login' })
}

/* ──────────────────────────────────────────────────────────────────────
 * KI-Assistent — Full Offer Generation
 * Liest aktuelle Offer-Felder + Free-Text-Prompt + optional Programm-/Notiz-Kontext
 * und generiert in EINEM Call: title/subtitle/tagline + understanding(goals/challenges)
 * + empathy(statement/successMessage) + economic[6 tiles]. Patcht das Offer direkt.
 * ────────────────────────────────────────────────────────────────────── */
export async function generateOfferFromPromptAction(
  offerId: string,
  payload: { prompt: string; recipientRole?: string; meetingNotes?: string; programId?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY missing in Vercel env' }

  // Load current offer for customer context
  const cur = await getOfferById(offerId) as Record<string, unknown> | null
  if (!cur) return { ok: false, error: 'offer not found' }

  // Persist context fields immediately (so reloads keep them)
  await updateOffer(offerId, {
    aiPrompt: payload.prompt,
    recipientRole: payload.recipientRole ?? null,
    meetingNotes: payload.meetingNotes ?? null,
    programId: payload.programId ?? null,
  } as never)

  // Optional: load program details for richer context
  let programContext = ''
  if (payload.programId) {
    try {
      const { db } = await import('@/lib/db')
      const { sql } = await import('drizzle-orm')
      const rows = await db.execute(sql`SELECT name, description FROM programs WHERE id = ${payload.programId} LIMIT 1`) as unknown as Array<{ name: string; description: string | null }>
      const p = rows[0]
      if (p) programContext = `\nAngebotetes Programm: ${p.name}${p.description ? ' — ' + p.description : ''}`
    } catch { /* non-fatal */ }
  }

  const customerStr = [cur.customer_name, cur.customer_company].filter(Boolean).join(' · ')
  const sys = 'Du bist ein Senior B2B-Sales-Consultant im Stil von Markus Eilers. Du formulierst Angebote glaubwürdig, klar, ohne Hype, ohne Buzzwords. Du sprichst den Empfänger direkt an. Antworte AUSSCHLIESSLICH als JSON nach dem angegebenen Schema, kein Kommentar, kein Markdown.'
  const schema = `{
    "title": string,         // klarer Angebots-Titel (max 8 Worte)
    "subtitle": string,      // Untertitel-Klammer (1 Satz)
    "tagline": string,       // markante Tagline für den Empfänger (max 7 Worte)
    "understanding": {
      "title": string,       // typisch "So haben wir Euch verstanden"
      "goals": string[],     // 3–4 konkrete Ziele aus Sicht des Empfängers
      "challenges": string[] // 3–4 konkrete Herausforderungen
    },
    "empathy": {
      "title": string,
      "statement": string,   // "Wir verstehen, dass..." 2–3 Sätze
      "successMessage": string  // "Nach der Zusammenarbeit werdet Ihr..."
    },
    "economic": [            // 4–6 messbare Ergebnis-Tiles
      { "icon": "target"|"users"|"trending-up"|"shield"|"zap"|"star", "title": string, "description": string }
    ]
  }`

  const userPrompt = `Empfänger: ${customerStr}
Rolle des Empfängers: ${payload.recipientRole || '(nicht angegeben)'}${programContext}
${payload.meetingNotes ? '\nGesprächsnotizen:\n' + payload.meetingNotes : ''}

Briefing (Kern-Input vom Berater):
${payload.prompt}

Generiere ein vollständiges Angebot in JSON nach dem Schema.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${sys}\n\nSchema:\n${schema}` },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })
  if (!res.ok) {
    return { ok: false, error: `OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}` }
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return { ok: false, error: 'empty OpenAI response' }

  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(content) } catch { return { ok: false, error: 'invalid JSON from OpenAI' } }

  // Patch offer
  await updateOffer(offerId, {
    title: typeof parsed.title === 'string' ? parsed.title : undefined,
    subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : null,
    tagline: typeof parsed.tagline === 'string' ? parsed.tagline : null,
    understandingSection: parsed.understanding as object,
    empathySection: parsed.empathy as object,
    economicResults: Array.isArray(parsed.economic) ? parsed.economic as Array<{ icon: string; title: string; description: string }> : undefined,
  })

  revalidatePath(`/admin/offers/${offerId}`)
  return { ok: true }
}
