'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createOffer, updateOffer, getOfferById } from '@/lib/db/queries/offers'

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
