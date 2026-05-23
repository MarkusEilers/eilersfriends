'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('Unauthorized')
  }
  return session
}

interface SaveTemplateInput {
  id?: string
  type: 'doi_confirmation' | 'doi_welcome' | 'sequence_step' | 'transactional'
  name: string
  locale: string
  subject: string
  bodyHtml: string
  bodyText?: string
  fromName?: string
  fromEmail?: string
  isDefault: boolean
}

export async function saveEmailTemplate(input: SaveTemplateInput) {
  await requireAdmin()

  const values = {
    type: input.type,
    name: input.name,
    locale: input.locale,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText || null,
    fromName: input.fromName || 'Eilers+Friends',
    fromEmail: input.fromEmail || 'hallo@eilersfriends.com',
    isDefault: input.isDefault,
    updatedAt: new Date(),
  }

  if (input.id) {
    await db.update(emailTemplates).set(values).where(eq(emailTemplates.id, input.id))
  } else {
    await db.insert(emailTemplates).values({ ...values, variables: [] })
  }

  revalidatePath('/admin/email-templates')
}

export async function deleteEmailTemplate(id: string) {
  await requireAdmin()
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id))
  revalidatePath('/admin/email-templates')
}

/* ──────────────────────────────────────────────────────────────────────
 * KI-Suggest für Email-Templates (Sabri Suby / Aaron Ross HVCO-Stil)
 * Nimmt Briefing + Kontext (Audience/Framework/Tone) → generiert subject + bodyHtml.
 * ────────────────────────────────────────────────────────────────────── */
export async function suggestEmailContentAction(input: {
  brief: string
  audience?: string
  frameworkName?: string
  templateType?: string
  tone?: string
}): Promise<{ ok: true; subject: string; bodyHtml: string; bodyText: string } | { ok: false; error: string }> {
  await requireAdmin()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY missing in Vercel env' }

  const sys = 'Du bist ein Senior B2B-Sales-Copywriter im Stil von Sabri Suby und Aaron Ross — HVCO-Logik (High Value Content Offer), Curiosity-Gap Subject-Lines, persönlicher Ton, P.S. mit dem stärksten Hook. Kurze Sätze. Schreibst direkt für eine:n Software-Gründer:in. Keine Buzzwords. Antworte AUSSCHLIESSLICH als JSON, kein Kommentar, kein Markdown.'

  const schema = `{
    "subject": string,    // Curiosity-Gap Subject-Line (max 60 Zeichen, neugierig machend)
    "bodyHtml": string,   // HTML-Body mit kurzen Absätzen, kein Stock-Footer, mit P.S. am Ende
    "bodyText": string    // Plaintext-Fallback (gleicher Inhalt, ohne HTML-Tags)
  }`

  const userMsg = `Brief: ${input.brief}
Audience: ${input.audience ?? 'B2B-Software-Gründer:innen'}
Framework: ${input.frameworkName ?? '(nicht angegeben)'}
Template-Typ: ${input.templateType ?? 'sequence_step'}
Tone: ${input.tone ?? 'direkt, persönlich, ohne Hype'}

Generiere subject + bodyHtml + bodyText im HVCO-Sabri-Suby/Aaron-Ross-Stil.
Verwende Template-Variablen wo sinnvoll: {{firstName}}, {{framework_name}}, {{framework_url}}, {{loginUrl}}.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${sys}\n\nSchema:\n${schema}` },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })
  if (!res.ok) return { ok: false, error: `OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}` }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return { ok: false, error: 'empty OpenAI response' }

  try {
    const parsed = JSON.parse(content)
    return {
      ok: true,
      subject: String(parsed.subject ?? ''),
      bodyHtml: String(parsed.bodyHtml ?? ''),
      bodyText: String(parsed.bodyText ?? ''),
    }
  } catch {
    return { ok: false, error: 'invalid JSON from OpenAI' }
  }
}
