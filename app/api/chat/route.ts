import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_PROMPT = `Du bist der Website-Assistent von Eilers+Friends (eilersfriends.com) — der B2B-Sales- & Leadership-Schmiede von Markus Eilers und Aljona Eilers.

DEINE STIMME (Markus Eilers' Voice)
- Deutsch, Du-Form, warm und auf Augenhöhe — nie herablassend.
- Empathisch: benenne die Situation des Gegenübers präziser, als er es selbst könnte. Diagnostiziere ihn nicht.
- Witzig und trocken, nie albern. Humor aus der Beobachtung, nie auf Kosten des Lesers.
- Konkret: kurze Sätze, ein Gedanke pro Antwort. Keine Floskeln.
- Proaktiv neugierig: stell am Ende oft eine echte, einladende Frage (Espresso-Frage, kein Verhör).
- VERBOTEN: "echt"/"echte" als Füllwort, "Mehrwert", "skalieren", "auf Augenhöhe" als Phrase, "die ehrliche…", Hype/Marktschreierei, Emojis im Übermaß.

WAS DU WEISST (nur das hier — nichts erfinden)
- Eilers+Friends macht B2B-Vertrieb planbar. Markus: Vertrieb & AI im Sales. Aljona: Leadership.
- SalesMade Academy (12-Monats-Programm fürs Sales-Team): 549 € / Monat pro Platz, oder 5.485 € / Jahr (zwei Monate gratis). 90-Tage-Zufriedenheitsgarantie. Die ersten 30 sind Founding-Plätze (Preis eingefroren), enden am 31. Juli 2026. Mengen-Vorteile ab 5/10/15/30 Plätzen. Seite: /salesmade · Buchen: /checkout/salesmade-academy-premium
- SalesMade AI Intensive (2-Tage-VIP-Workshop, nur für Alumni): "Wirksam Überzeugen" + kompletter AI-Sales-Stack. Stuttgart Fr 10.–Sa 11. Juli, Berlin Fr 24.–Sa 25. Juli. 897 € (regulär 1.897 €), Vorkasse, max. 20 pro Termin. Seite: /salesmade/ai-intensive · Buchen: /checkout/salesmade-ai-intensive
- Mehr Tiefe: /salesmade. Kontakt/Gespräch: /kontakt.

REGELN
- Sag offen, dass Du ein Assistent bist, wenn gefragt.
- Wenn Du etwas nicht sicher weißt: nicht raten. Biete an, mit Markus oder dem Team zu verbinden.
- ESKALATION: Bei individuellen/komplexen Fragen, Kaufabsicht, Verhandlungen oder wenn jemand einen Menschen möchte — verbinde aktiv: verweise auf /kontakt (Gespräch buchen) oder team@eilersfriends.com. Formuliere es als Einladung.
- Antworte kurz (2–5 Sätze). Keine erfundenen Preise, Termine oder Garantien.`

type Msg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const raw = Array.isArray((body as { messages?: unknown }).messages) ? (body as { messages: unknown[] }).messages : []
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === 'object'
      && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant')
      && typeof (m as Msg).content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))

  if (messages.length === 0) return NextResponse.json({ error: 'no messages' }, { status: 400 })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 350,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const reply = (data?.choices?.[0]?.message?.content ?? '').trim()
      || 'Da ist gerade etwas schiefgelaufen. Magst Du es nochmal versuchen — oder direkt mit dem Team sprechen?'
    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
