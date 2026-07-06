import { listEventTypes } from '@/lib/schedule/types-store'

// Kuratiertes Grundwissen (aus freigegebenen Inhalten). Fakten, keine Erfindungen.
// Später admin-editierbar / per Retrieval erweiterbar.
const BASE = `ÜBER EILERS+FRIENDS (eilersfriends.com)
Beratung und Ausbildung für planbaren, systematischen Vertrieb — plus Leadership. Über 500 Gründer:innen und Führungskräfte begleitet. Wir bringen Revenue Systems (Markus) und Transformational Leadership (Aljona) zusammen.

ZIELGRUPPE (ICP)
Primär: CEO / Geschäftsführung mit einem Sales-Team, das planbar funktionieren soll. Nicht: reine Solo-Gründer ohne Team.

PROGRAMME & ANGEBOTE
- SalesMade Academy (Premium): 12-monatiges Ausbildungsprogramm, das ein Sales-Team auf das Niveau von Ausnahme-Verkäufern bringt — monatliches 1:1, Frameworks, sichtbarer Fortschritt, 90-Tage-Zufriedenheitsgarantie. Founding-Kohorte mit begrenzten Plätzen.
- SalesMade AI Intensive: zwei Tage live (Stuttgart oder Berlin), nur für Alumni, maximal 20 Teilnehmer je Termin — Wirksam Überzeugen + kompletter AI-Sales-Stack.
- Mystery Shopping: Test-/Kennenlernangebot.
- Frameworks: Baupläne unter /frameworks (z. B. der 8-Schritte-Bauplan für unwiderstehliche B2B-Angebote).

TEAM
- Markus Eilers — Vertrieb & AI im Sales (Speaker, Vertriebs-Coach).
- Aljona Eilers — Leadership / Liquid Leadership.
- Cosima Bär — Eilers+Friends.
- Daniel — Sales Development (SDR).

TERMINE BUCHEN
Über eilersfriends.com/schedule: Person wählen (Markus/Aljona/Cosima/Daniel) oder Team, dann Termin-Typ (z. B. Kennenlernen, Strategiegespräch). Buchung erzeugt einen Microsoft-Teams-Termin.

KONTAKT
E-Mail team@eilersfriends.com. Bei Preis-/Vertragsdetails niemals raten — anbieten, an das Team zu verbinden oder einen Termin einzurichten.`

function ownerName(slug: string): string {
  return ({ markus: 'Markus', aljona: 'Aljona', cosima: 'Cosima', daniel: 'Daniel', team: 'Team (Markus & Aljona)' } as Record<string, string>)[slug] || slug
}

export async function knowledgeContext(): Promise<string> {
  let bookable = ''
  try {
    const types = (await listEventTypes()).filter(t => t.visibility === 'live')
    if (types.length) bookable = '\n\nAKTUELL BUCHBAR:\n' + types.map(t => `- ${t.name} (${t.durationMin} Min) bei ${ownerName(t.ownerSlug)}: /schedule/${t.ownerSlug}/${t.slug}`).join('\n')
  } catch { /* ignore */ }
  return BASE + bookable
}
