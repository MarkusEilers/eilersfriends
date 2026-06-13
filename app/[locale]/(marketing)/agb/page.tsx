import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGB — Eilers+Friends',
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AgbPage({ params }: PageProps) {
  await params // locale not needed — Link from i18n nav resolves it

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-3xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="mb-10 text-sm text-gray-500">
            Für die Ausbildungs- und Coaching-Leistungen der SalesMade Academy. Stand: Juni 2026.
          </p>

          {/* ENTWURF-Hinweis — vor Live-Verkauf anwaltlich prüfen lassen */}
          <div className="mb-10 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <strong>Entwurf.</strong> Diese Fassung ist ein erster, auf das Angebot zugeschnittener
            Entwurf und ersetzt keine anwaltliche Prüfung. Vor dem ersten verbindlichen Verkauf bitte
            durch eine Rechtsberatung freigeben lassen.
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>1. Geltungsbereich und Anbieter</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die
                Ausbildungs-, Coaching- und Trainingsleistungen der SalesMade Academy, angeboten von der
                Eilers+Friends, uphill ventures GmbH, Blütenäcker 55/2, 71332 Waiblingen (nachfolgend
                „Anbieter"). Die Leistungen richten sich ausschließlich an Unternehmer im Sinne des
                § 14 BGB. Ein Verbrauchergeschäft liegt nicht vor.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>2. Vertragsgegenstand</h2>
              <p>
                Der Anbieter bildet pro gebuchtem Ausbildungsplatz („Seat") eine vom Kunden benannte
                Person über zwölf Monate aus. Enthalten sind insbesondere Assessment, ein individueller
                Entwicklungs-Fahrplan, eine monatliche 1:1-Coaching-Session, Zugang zu Frameworks und
                Playbook-Library, werktägliches Sparring sowie der Zugang zur Founding-Community im
                jeweils zum Buchungszeitpunkt beschriebenen Umfang. Der Kunde kann selbst einen der
                Plätze wahrnehmen. Mengen-Boni gelten in dem auf der Angebotsseite beschriebenen Umfang.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>3. Vertragsschluss</h2>
              <p>
                Der Vertrag kommt mit Abschluss des Buchungsvorgangs und Bestätigung durch den Anbieter
                zustande. Die Darstellung der Leistungen auf der Website ist eine Aufforderung zur Abgabe
                eines Angebots; die Buchung des Kunden ist das Angebot.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>4. Laufzeit und Verlängerung</h2>
              <p>
                Der Vertrag hat eine feste Laufzeit von zwölf Monaten ab Ausbildungsbeginn. Er verlängert
                sich um jeweils ein weiteres Jahr, sofern er nicht mit einer Frist von drei Monaten zum
                Ende der jeweiligen Laufzeit in Textform gekündigt wird.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>5. Preise, Zahlung und Reisekosten</h2>
              <p>
                Es gelten die zum Buchungszeitpunkt ausgewiesenen Preise je Seat, zuzüglich der
                gesetzlichen Umsatzsteuer. Bei gültiger Umsatzsteuer-Identifikationsnummer außerhalb
                Deutschlands erfolgt die Abrechnung im Reverse-Charge-Verfahren. Reisekosten für
                Präsenztermine, die der Kunde wünscht, werden gesondert nach tatsächlichem Aufwand in
                Rechnung gestellt und sind im Seat-Preis nicht enthalten.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>6. Zufriedenheitsgarantie (14 Tage)</h2>
              <p>
                Innerhalb von 14 Tagen nach Vertragsbeginn kann der Kunde den Vertrag ohne weitere Kosten
                beenden, sofern die teilnehmende Person das Assessment durchlaufen und die erste
                Coaching-Session wahrgenommen hat und die Zusammenarbeit dennoch nicht passt. Eine bereits
                geleistete Zahlung wird in diesem Fall vollständig erstattet. Die Mitteilung genügt in
                Textform an team@eilersfriends.com.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>7. Mitwirkung des Kunden</h2>
              <p>
                Die Ausbildung setzt die aktive Teilnahme der benannten Person voraus. Termine, die der
                Kunde nicht wahrnimmt, verfallen, soweit sie nicht rechtzeitig (mindestens 24 Stunden
                vorher) verschoben werden. Eine Pflicht zur Nachholung besteht insoweit nicht.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>8. Kein Widerrufsrecht für Unternehmer</h2>
              <p>
                Da sich das Angebot ausschließlich an Unternehmer richtet, besteht kein gesetzliches
                Widerrufsrecht für Verbraucher. Unabhängig davon gilt die in Ziffer 6 beschriebene
                freiwillige Zufriedenheitsgarantie.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>9. Haftung</h2>
              <p>
                Der Anbieter erbringt eine Dienstleistung und schuldet keinen bestimmten wirtschaftlichen
                Erfolg. Die Haftung richtet sich nach den gesetzlichen Bestimmungen; für leichte
                Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und
                begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>10. Schlussbestimmungen</h2>
              <p>
                Nebenabreden bedürfen der Schriftform; dies gilt auch für die Aufhebung des
                Schriftformerfordernisses. Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine
                Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
