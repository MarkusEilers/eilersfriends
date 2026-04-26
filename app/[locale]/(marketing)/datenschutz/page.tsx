import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — Eilers+Friends',
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-3xl font-bold mb-10" style={{ color: '#0D0D0B' }}>Datenschutzerklärung</h1>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>1. Datenschutz auf einen Blick</h2>
              <h3 className="font-semibold mb-2">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit
                denen Sie persönlich identifiziert werden können.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>2. Verantwortliche Stelle</h2>
              <p>
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
                Eilers+Friends GmbH<br />
                Markus Eilers<br />
                Hamburg, Deutschland<br />
                E-Mail: <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: '#F05A1A' }}>team@eilersfriends.com</a>
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>3. Datenerfassung auf dieser Website</h2>
              <h3 className="font-semibold mb-2">Cookies</h3>
              <p>
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und
                richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die
                Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät
                gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente
                Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine
                automatische Löschung durch Ihren Webbrowser erfolgt.
              </p>
              <h3 className="font-semibold mb-2 mt-4">Server-Log-Dateien</h3>
              <p>
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>4. Newsletter</h2>
              <p>
                Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen
                eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der
                Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden
                sind. Weitere Daten werden nicht erhoben. Diese Daten verwenden wir ausschließlich für den
                Versand der angeforderten Informationen und geben sie nicht an Dritte weiter.
              </p>
              <p className="mt-3">
                Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung
                zum Versand des Newsletters können Sie jederzeit widerrufen, etwa über den
                „Austragen"-Link im Newsletter.
              </p>
              <p className="mt-3">
                Wir Verwenden <strong>Beehiiv</strong> als Newsletter-Plattform. Weitere Informationen zur
                Datenverarbeitung durch Beehiiv finden Sie unter:{' '}
                <a href="https://www.beehiiv.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#F05A1A' }}>
                  beehiiv.com/privacy
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>5. Ihre Rechte</h2>
              <p>Sie haben jederzeit das Recht:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten</li>
                <li>die Berichtigung oder Löschung dieser Daten zu verlangen</li>
                <li>die Einschränkung der Verarbeitung zu verlangen</li>
                <li>Ihrer Verarbeitung zu widersprechen</li>
                <li>Datenübertragbarkeit zu verlangen</li>
              </ul>
              <p className="mt-3">
                Außerdem steht Ihnen das Recht zu, sich bei einer Aufsichtsbehörde für Datenschutz zu beschweren.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>6. Drittanbieter</h2>
              <h3 className="font-semibold mb-2">Vercel</h3>
              <p>
                Diese Website wird auf der Plattform Vercel (Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
                USA) gehostet. Beim Aufruf dieser Website werden automatisch Verbindungsdaten an Vercel übermittelt.
                Weitere Informationen: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#F05A1A' }}>vercel.com/legal/privacy-policy</a>
              </p>
              <h3 className="font-semibold mb-2 mt-4">Google Fonts</h3>
              <p>
                Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten Google Fonts (Anbieter:
                Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA). Beim Aufruf einer
                Seite lädt Ihr Browser die benötigten Fonts in Ihren Browsercache, um Texte und Schriftarten
                korrekt anzuzeigen.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>7. Kontakt bei Datenschutzfragen</h2>
              <p>
                Bei Fragen zum Datenschutz wenden Sie sich bitte an:{' '}
                <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: '#F05A1A' }}>
                  team@eilersfriends.com
                </a>
              </p>
              <p className="mt-3 text-xs text-gray-400">Stand: März 2026</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
