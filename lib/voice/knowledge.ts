import { listEventTypes } from '@/lib/schedule/types-store'
import { getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'

// Kuratiertes Grundwissen (aus freigegebenen Inhalten). Fakten, keine Erfindungen.
// Später admin-editierbar / per Retrieval erweiterbar.
const BASE = `ÜBER EILERS+FRIENDS (eilersfriends.com)
Beratung und Ausbildung für planbaren, systematischen Vertrieb — plus Leadership. Über 500 Gründer:innen und Führungskräfte begleitet. Wir bringen Revenue Systems (Markus) und Transformational Leadership (Aljona) zusammen.

ZIELGRUPPE (ICP)
Primär: CEO / Geschäftsführung mit einem Sales-Team, das planbar funktionieren soll. Nicht: reine Solo-Gründer ohne Team.

PROGRAMME & ANGEBOTE
- SalesMade Academy (Premium): 12-monatiges Ausbildungsprogramm, das ein Sales-Team auf das Niveau von Ausnahme-Verkäufern bringt — monatliches 1:1, Frameworks, sichtbarer Fortschritt, 90-Tage-Zufriedenheitsgarantie. Nur 30 Plätze je Flight. Der nächste Academy-Flight startet am 20. November (Seite: /academy).
- SalesMade AI Intensive: zwei Tage live (Stuttgart oder Berlin), nur für Alumni, maximal 20 Teilnehmer je Termin — Wirksam Überzeugen + kompletter AI-Sales-Stack.
- Mystery Shopping (Einstiegsangebot, Seite: eilersfriends.com/mystery-shopping): Wir führen ein Erstgespräch mit dem Vertriebsteam des Kunden — gern auch den SDR-Call davor — als imaginärer Kunde. Das Team weiß es nicht. Danach forensische Analyse mit AI und einem Panel spezialisierter Agenten. Ergebnis: ein 14-seitiger Report (wie es um die wichtigsten Skills steht, welche unnötigen Fehler passieren, welche „Handbremse“ jetzt zu lösen ist; geprüft u. a. gefährliche Annahmen, liegengelassene Elfmeter, Serienfragen, fehlende Empathie, zu früh übers Produkt reden, kein Commitment/Nachfassen, belanglose Angebote). Dazu eine kostenfreie Trainingssession zum wichtigsten Skill. Preis: 1 € statt regulär 997 € (zzgl. USt.). Nur 16 Sessions pro Quartal, einmal pro Firma (Firmen-E-Mail nötig). Ablauf: auf /mystery-shopping Vorname + Firmen-E-Mail eintragen → kurzes Video + Buchung unter /checkout/mystery-shopping → Zahlung über Stripe → Zeitraum wird nach der Buchung abgestimmt; den genauen Tag erfährt das Team nicht. Der Report geht nur an die Person, die gebucht hat. Warum 1 €? Wir sind selbst Technologieunternehmer, kennen die Unsicherheit, nicht zu wissen, wie gut das eigene Team ist — und wollen zeigen statt behaupten. Danach entscheidet der Kunde frei, kein Abo.
- Gesprächs-Check (kostenlos, /gespraechs-check): eigenes Gesprächstranskript hochladen und automatisch auswerten lassen.
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
  return ({
    markus: 'Markus', aljona: 'Aljona', cosima: 'Cosima', daniel: 'Daniel',
    team: 'Aljona & Markus', 'daniel-markus': 'Daniel & Markus',
  } as Record<string, string>)[slug] || slug
}

let _cache: { text: string; at: number } | null = null
export async function knowledgeContext(): Promise<string> {
  if (_cache && Date.now() - _cache.at < 300000) return _cache.text + (await mysteryLive())
  let bookable = ''
  try {
    const types = (await listEventTypes()).filter(t => t.visibility === 'live')
    if (types.length) bookable = '\n\nAKTUELL BUCHBAR:\n' + types.map(t => `- ${t.name} (${t.durationMin} Min) bei ${ownerName(t.ownerSlug)}: /schedule/${t.ownerSlug}/${t.slug}`).join('\n')
  } catch { /* ignore */ }
  _cache = { text: BASE + bookable, at: Date.now() }
  return _cache.text + (await mysteryLive())
}

/** Live-Stand Mystery Shopping (nicht gecacht — ändert sich mit jeder Buchung). */
async function mysteryLive(): Promise<string> {
  try {
    const a = await getAvailability()
    return a.soldOut
      ? `\n\nMYSTERY SHOPPING LIVE: Dieses Quartal ausgebucht. Nächster Durchgang ab ${nextQuarterLabel(a.quarter)}.`
      : `\n\nMYSTERY SHOPPING LIVE (aktuell, verlässlich — direkt nennen, ohne Vorbehalt): Noch ${a.free} von ${a.capacity} Sessions in diesem Quartal frei.`
  } catch { return '' }
}
