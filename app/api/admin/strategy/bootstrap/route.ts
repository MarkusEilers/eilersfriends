import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ensureFactSchema } from '@/lib/strategy/schema'
import { upsertFactKey, listFactKeys } from '@/lib/strategy/facts'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Legt Schema und Fakt-Registry an (idempotent). */
export async function POST() {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    await ensureFactSchema()
    for (let i = 0; i < FACT_KEYS.length; i++) {
      const k = FACT_KEYS[i]
      await upsertFactKey({ ...k, sortOrder: i })
    }
    const keys = await listFactKeys()
    return NextResponse.json({ ok: true, factKeys: keys.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await ensureFactSchema()
  return NextResponse.json({ ok: true, factKeys: await listFactKeys() })
}

/** Die Landkarte des Wissens — welcher Schritt erzeugt welche Fakten. */
const FACT_KEYS: { key: string; label: string; scope: 'company' | 'product'; valueType: string; producedBy: string; description: string }[] = [
  // Firmen-Ebene
  { key: 'company.origin_story', label: 'Origin Story', scope: 'company', valueType: 'text', producedBy: 'foundation', description: 'Warum es das Unternehmen gibt, was der Auslöser war.' },
  { key: 'company.culture', label: 'Wofür das Unternehmen steht', scope: 'company', valueType: 'text', producedBy: 'foundation', description: 'Woran man es erkennt, auch ohne Logo.' },
  { key: 'company.unfair_advantage', label: 'Unfairer Vorteil', scope: 'company', valueType: 'text', producedBy: 'foundation', description: 'Was das Unternehmen kann, das andere so nicht können.' },
  { key: 'company.industry', label: 'Branche und Marktumfeld', scope: 'company', valueType: 'text', producedBy: 'foundation', description: 'In welchem Markt bewegt sich das Unternehmen.' },
  { key: 'company.objective', label: 'Übergeordnetes Ziel', scope: 'company', valueType: 'text', producedBy: 'success-goals', description: 'Was in zwölf Monaten wahr sein soll.' },
  { key: 'company.key_results', label: 'Key Results', scope: 'company', valueType: 'list', producedBy: 'success-goals', description: 'Kennzahlen mit Ausgangs- und Zielwert.' },
  { key: 'company.obstacles', label: 'Was bisher aufhält', scope: 'company', valueType: 'list', producedBy: 'success-goals', description: 'Die ehrlichen Hürden.' },
  { key: 'research.website', label: 'Website-Analyse', scope: 'company', valueType: 'object', producedBy: 'foundation', description: 'Aus der Website gelesene Positionierung, Tonalität, Versprechen.' },

  // Produkt-Ebene
  { key: 'product.goal', label: 'Produkt-Ziel', scope: 'product', valueType: 'text', producedBy: 'product-goals', description: 'Umsatz, Kunden, Marktanteil — konkret.' },
  { key: 'product.timeframe', label: 'Zeithorizont', scope: 'product', valueType: 'text', producedBy: 'product-goals', description: 'Bis wann.' },
  { key: 'product.why_now', label: 'Warum jetzt', scope: 'product', valueType: 'text', producedBy: 'product-goals', description: 'Was den Zeitpunkt richtig macht.' },

  { key: 'icp.segments', label: 'Zielsegmente', scope: 'product', valueType: 'list', producedBy: 'icp', description: 'Wer genau kauft — Rolle, Größe, Branche.' },
  { key: 'icp.pains', label: 'Woran sie leiden', scope: 'product', valueType: 'list', producedBy: 'icp', description: 'In deren Worten, nicht in Anbieter-Worten.' },
  { key: 'icp.gains', label: 'Was sie gewinnen wollen', scope: 'product', valueType: 'list', producedBy: 'icp', description: 'Das Ergebnis, nicht die Funktion.' },
  { key: 'icp.triggers', label: 'Kaufauslöser', scope: 'product', valueType: 'list', producedBy: 'icp', description: 'Welches Ereignis macht aus interessant ein jetzt.' },
  { key: 'icp.anti_persona', label: 'Für wen nicht', scope: 'product', valueType: 'text', producedBy: 'icp', description: 'Klare Abgrenzung spart allen Zeit.' },

  { key: 'compete.alternatives', label: 'Echte Alternativen', scope: 'product', valueType: 'list', producedBy: 'compete', description: 'Auch nichts tun und selbst bauen zählen.' },
  { key: 'compete.their_story', label: 'Versprechen der anderen', scope: 'product', valueType: 'list', producedBy: 'compete', description: 'Wie sich der Wettbewerb erzählt.' },
  { key: 'compete.gap', label: 'Unbesetzte Lücke', scope: 'product', valueType: 'text', producedBy: 'compete', description: 'Die Position, die keiner hält.' },

  { key: 'beef.what', label: 'WAS ihr tut', scope: 'product', valueType: 'text', producedBy: 'beef-radar', description: 'Nüchtern: die Leistung.' },
  { key: 'beef.how', label: 'WIE ihr es tut', scope: 'product', valueType: 'text', producedBy: 'beef-radar', description: 'Der Unterschied im Vorgehen.' },
  { key: 'beef.why', label: 'WARUM das zählt', scope: 'product', valueType: 'text', producedBy: 'beef-radar', description: 'Der Nutzen in der Währung des Kunden.' },

  { key: 'conviction.stages', label: 'Überzeugungspfad', scope: 'product', valueType: 'list', producedBy: 'conviction-path', description: 'Welche Überzeugung auf welcher Stufe fehlt.' },
  { key: 'conviction.objections', label: 'Wesentliche Einwände', scope: 'product', valueType: 'list', producedBy: 'conviction-path', description: 'Was den Kauf verhindert.' },

  { key: 'solution.from_state', label: 'IST-Zustand', scope: 'product', valueType: 'text', producedBy: 'signature-solution', description: 'Der schmerzhafte Ausgangspunkt.' },
  { key: 'solution.to_state', label: 'SOLL-Zustand', scope: 'product', valueType: 'text', producedBy: 'signature-solution', description: 'Das gewünschte Ergebnis.' },
  { key: 'solution.phases', label: 'Phasen dazwischen', scope: 'product', valueType: 'list', producedBy: 'signature-solution', description: 'Je Phase: von X zu Y.' },

  { key: 'offer.core', label: 'Kernangebot', scope: 'product', valueType: 'text', producedBy: 'irresistible-offer', description: 'Was der Kunde genau bekommt.' },
  { key: 'offer.value_stack', label: 'Was dazugehört', scope: 'product', valueType: 'list', producedBy: 'irresistible-offer', description: 'Alles, was den Wert erhöht.' },
  { key: 'offer.risk_reversal', label: 'Risikoübernahme', scope: 'product', valueType: 'text', producedBy: 'irresistible-offer', description: 'Garantie, Probe, Etappenzahlung.' },
  { key: 'offer.guarantee', label: 'Garantie', scope: 'product', valueType: 'text', producedBy: 'irresistible-offer', description: 'Die konkrete Zusage.' },

  { key: 'launch.audience', label: 'Wer zuerst erfährt davon', scope: 'product', valueType: 'text', producedBy: 'soft-launch', description: 'Die erste Gruppe.' },
  { key: 'launch.sequence', label: 'Launch-Etappen', scope: 'product', valueType: 'list', producedBy: 'soft-launch', description: 'Was wann über welchen Kanal.' },

  { key: 'funnel.target', label: 'Umsatzziel', scope: 'product', valueType: 'text', producedBy: 'funnel-math', description: 'Die Zahl, auf die gerechnet wird.' },
  { key: 'funnel.deal_size', label: 'Auftragswert', scope: 'product', valueType: 'text', producedBy: 'funnel-math', description: 'Durchschnittlicher Auftragswert.' },
  { key: 'funnel.rates', label: 'Conversion-Raten', scope: 'product', valueType: 'object', producedBy: 'funnel-math', description: 'Besucher bis Abschluss.' },
  { key: 'funnel.required_input', label: 'Nötiger Zufluss', scope: 'product', valueType: 'text', producedBy: 'funnel-math', description: 'Was oben hereinkommen muss.' },

  { key: 'content.asset', label: 'Zentrales Asset', scope: 'product', valueType: 'text', producedBy: 'high-value-content', description: 'Was verschenkt wird und echte Arbeit spart.' },
  { key: 'content.promise', label: 'Versprechen des Assets', scope: 'product', valueType: 'text', producedBy: 'high-value-content', description: 'In einem Satz.' },
  { key: 'content.distribution', label: 'Verbreitung', scope: 'product', valueType: 'list', producedBy: 'high-value-content', description: 'Wie es Reichweite bekommt.' },

  { key: 'ads.angle', label: 'Anzeigen-Winkel', scope: 'product', valueType: 'text', producedBy: 'ads-lab', description: 'Welche Überzeugung die Anzeige angreift.' },
  { key: 'ads.hooks', label: 'Hooks zum Testen', scope: 'product', valueType: 'list', producedBy: 'ads-lab', description: 'Drei Varianten.' },

  { key: 'lp.headline', label: 'Landingpage-Headline', scope: 'product', valueType: 'text', producedBy: 'landing-page', description: 'Wer, was, warum in einem Satz.' },
  { key: 'lp.proof', label: 'Beweise', scope: 'product', valueType: 'list', producedBy: 'landing-page', description: 'Zahlen, Referenzen, Logos.' },
  { key: 'lp.cta', label: 'Nächster Schritt', scope: 'product', valueType: 'text', producedBy: 'landing-page', description: 'Was der Besucher tun soll.' },

  { key: 'outreach.trigger', label: 'Anlass der Ansprache', scope: 'product', valueType: 'text', producedBy: 'outreach', description: 'Warum diese Person, warum jetzt.' },
  { key: 'outreach.beats', label: 'Die Beats', scope: 'product', valueType: 'list', producedBy: 'outreach', description: 'Tag, Kanal, Kernbotschaft.' },
  { key: 'outreach.objection', label: 'Häufigster Abbruchgrund', scope: 'product', valueType: 'text', producedBy: 'outreach', description: 'Wo die Sequenz stirbt.' },
]
