import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId: _draftId } = await params
  void _draftId

  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const organisationName = (body.organisationName as string) ?? ''
  const websiteUrl = (body.websiteUrl as string) ?? ''
  if (!websiteUrl) return NextResponse.json({ error: 'websiteUrl required' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  // Fetch website HTML (best-effort, no third-party scraper to keep it simple)
  let websiteText = ''
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : 'https://' + websiteUrl
    const res = await fetch(url, { headers: { 'User-Agent': 'EilersFriendsBauplanBot/1.0' } })
    if (res.ok) {
      const html = await res.text()
      // Naive text extraction
      websiteText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 8000)
    }
  } catch (e) {
    console.log('Website fetch failed:', String(e))
  }

  const systemPrompt = `Du analysierst eine B2B-Unternehmenswebsite und extrahierst die Kontextfelder fuer den Bauplan-Wizard. Antwort als gueltiges JSON. Nutze ausschliesslich Informationen aus dem Website-Text. Erfinde nichts. Wenn ein Feld unklar ist, lass es leer.`

  const userPrompt = `Organisation: "${organisationName}"
URL: ${websiteUrl}

Website-Text (gekuerzt):
${websiteText || '[Website konnte nicht geladen werden]'}

Bitte extrahiere:
{
  "summary": "1-2 Saetze: was macht das Unternehmen",
  "valueProposition": "1 Satz: das eindeutige Versprechen",
  "targetAudience": "wer ist Zielgruppe (Rolle + Firmengroesse + Branche)",
  "tone": "1-2 Adjektive: Sprachstil",
  "keywords": ["5-10 Keywords"],
  "industry": "Branche normalisiert",
  "brandColor": "Hex-Code wenn erkennbar",
  "accentColor": "Hex-Code wenn erkennbar"
}

Antworte nur mit dem JSON-Objekt.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `OpenAI ${res.status}`, detail: text.slice(0, 500) }, { status: 502 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let profile: Record<string, unknown> = {}
    try { profile = JSON.parse(content) } catch {
      return NextResponse.json({ error: 'AI returned non-JSON', raw: content.slice(0, 500) }, { status: 502 })
    }

    // Save into company_profile (reuse existing table — works across frameworks)
    await db.execute(sql`
      INSERT INTO company_profile (user_id, organisation_name, website, summary, value_proposition,
                                   target_audience, tone, keywords, brand_color, accent_color, industry,
                                   last_analysed_at)
      VALUES (${session.user.id}, ${organisationName}, ${websiteUrl},
              ${(profile.summary as string) ?? null}, ${(profile.valueProposition as string) ?? null},
              ${(profile.targetAudience as string) ?? null}, ${(profile.tone as string) ?? null},
              ${JSON.stringify((profile.keywords as string[]) ?? [])}::jsonb,
              ${(profile.brandColor as string) ?? null}, ${(profile.accentColor as string) ?? null},
              ${(profile.industry as string) ?? null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        organisation_name = EXCLUDED.organisation_name,
        website = EXCLUDED.website,
        summary = EXCLUDED.summary,
        value_proposition = EXCLUDED.value_proposition,
        target_audience = EXCLUDED.target_audience,
        tone = EXCLUDED.tone,
        keywords = EXCLUDED.keywords,
        brand_color = EXCLUDED.brand_color,
        accent_color = EXCLUDED.accent_color,
        industry = EXCLUDED.industry,
        last_analysed_at = NOW()
    `)

    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
