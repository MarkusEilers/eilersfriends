'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { updateCardMeta, type CardMeta, type Deliverable } from '@/lib/db/queries/framework-meta'

const ALLOWED_ICONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

export type SaveFrameworkMetaState =
  | { ok: true; savedAt: string }
  | { ok: false; error: string }
  | null

/**
 * Server action — kompatibel mit useActionState.
 * Erste Variante (Wrapper): (_prev, formData) → SaveFrameworkMetaState
 * Direkte Form-action ist nicht mehr empfohlen — bitte über FrameworkMetaForm wrappen.
 */
export async function saveFrameworkMetaAction(
  _prev: SaveFrameworkMetaState,
  formData: FormData,
): Promise<SaveFrameworkMetaState> {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
      return { ok: false, error: 'Nicht eingeloggt oder fehlende Berechtigung.' }
    }

    const slug = String(formData.get('slug') || '').trim()
    if (!slug) return { ok: false, error: 'slug fehlt im Formular.' }

    const posterTitle = String(formData.get('posterTitle') || '').trim()
    const posterSubtitle = String(formData.get('posterSubtitle') || '').trim()
    const tagline = String(formData.get('tagline') || '').trim()
    const agentLabel = String(formData.get('agentLabel') || '').trim()

    const toneFrom = String(formData.get('toneFrom') || '#0F1E3A').trim()
    const toneTo = String(formData.get('toneTo') || '#1A5FD4').trim()
    const toneAccent = String(formData.get('toneAccent') || '#5DDBF5').trim()

    const deliverables: Deliverable[] = []
    for (let i = 0; i < 5; i++) {
      const icon = String(formData.get(`deliverable_${i}_icon`) || '').trim() as Deliverable['icon']
      const label = String(formData.get(`deliverable_${i}_label`) || '').trim()
      if (label && ALLOWED_ICONS.includes(icon)) {
        deliverables.push({ icon, label })
      }
    }

    const meta: CardMeta = {
      posterTitle: posterTitle || undefined,
      posterSubtitle: posterSubtitle || undefined,
      tagline: tagline || undefined,
      agentLabel: agentLabel || undefined,
      tone: { from: toneFrom, to: toneTo, accent: toneAccent },
      deliverables: deliverables.length > 0 ? deliverables : undefined,
    }

    await updateCardMeta(slug, meta)
    revalidatePath('/')
    revalidatePath('/frameworks')
    revalidatePath(`/frameworks/${slug}`)
    revalidatePath('/admin/frameworks')
    revalidatePath(`/admin/frameworks/${slug}`)

    return { ok: true, savedAt: new Date().toISOString() }
  } catch (err) {
    console.error('[saveFrameworkMetaAction] failed', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Speichern.',
    }
  }
}


// ─── AI-Suggest — Big-Input-Box → komplette Card-Meta ────────────────────────
export interface FrameworkSuggestion {
  posterTitle?: string
  posterSubtitle?: string
  agentLabel?: string
  tagline?: string
  tone?: { from: string; to: string; accent: string }
  deliverables?: Deliverable[]
}

export type FrameworkSuggestResult =
  | { ok: true; suggestion: FrameworkSuggestion }
  | { ok: false; error: string }

export async function suggestFrameworkMetaAction(brief: string, slug: string): Promise<FrameworkSuggestResult> {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return { ok: false, error: 'Nicht eingeloggt oder fehlende Berechtigung.' }
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY nicht gesetzt.' }
  if (!brief?.trim()) return { ok: false, error: 'Bitte beschreibe, was auf der Card stehen soll.' }

  const sys = `Du bist ein erfahrener B2B-Marketing-Designer und Conversion-Copywriter. Du designst Framework-Cards für die Website von Eilers+Friends (B2B-Coaching, Voice: Markus Eilers — direkt, neugierig, kein Marketing-Sprech, ohne Buzzwords wie "transformiert", "revolutioniert", "ehrliche Rechnung").

Du bekommst eine freie Beschreibung eines Frameworks und produzierst ALLE Card-Meta-Felder daraus. Antworte AUSSCHLIESSLICH als JSON.

Schema:
{
  "posterTitle": "string (max 2 Zeilen, UPPERCASE, mit \n als Zeilentrenner)",
  "posterSubtitle": "string (max 1 Zeile, UPPERCASE oder Title-Case)",
  "agentLabel": "string (max 3 Worte, Glass-Pill oben links — z.B. 'AI Agent', 'Worksheet', 'Bauplan + Video')",
  "tagline": "string (max 5 Worte, kleine Zeile unter dem Body-Titel)",
  "tone": { "from": "#RRGGBB", "to": "#RRGGBB", "accent": "#RRGGBB" },
  "deliverables": [
    { "icon": "FileDown"|"Video"|"ClipboardList"|"Wand2"|"BookOpen"|"Sparkles", "label": "string (max 100 chars)" }
  ]
}

Farben — wähle harmonisch passend zum Thema:
- Sales/Energy/Active: Navy (#0F1E3A) → Blue (#1A5FD4) Accent Cyan (#5DDBF5)
- Premium/Strategy: Deep Navy (#0F1E3A) → Royal (#0A2851) Accent Gold (#FFD37A)
- Conflict/Urgency: Dark (#1F2228) → Red (#A8252A) Accent Amber (#FFC93C)
- Creative/Bright: Blue (#1A4DB0) → Light (#0F3D8E) Accent Cyan (#5DDBF5)
- Calm/Reflective: Dark (#1F2228) → Navy (#0F1E3A) Accent Bronze (#C8A67A)

Deliverables: 2-4 Items. Konkret formulieren (z.B. "32-S. PDF" statt "Detailliertes PDF"). Icons sinnvoll wählen.`

  const user = `Slug: ${slug}

Briefing vom Markus:
${brief}`

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  }

  try {
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
    if (!content) return { ok: false, error: 'OpenAI lieferte leere Antwort.' }
    const parsed = JSON.parse(content) as FrameworkSuggestion
    // Defensive: ensure deliverables icons are in allow-list
    if (parsed.deliverables) {
      parsed.deliverables = parsed.deliverables.filter(d =>
        ALLOWED_ICONS.includes(d.icon as Deliverable['icon']) && d.label
      )
    }
    return { ok: true, suggestion: parsed }
  } catch (err) {
    console.error('[suggestFrameworkMetaAction] failed', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unbekannter Fehler.' }
  }
}
