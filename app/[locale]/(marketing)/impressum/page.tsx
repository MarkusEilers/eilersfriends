"use client";

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export default function Impressum() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              {locale === 'de' ? 'Impressum' : 'Legal Notice'}
            </h1>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* Markenhinweis */}
              <section className="mb-12">
                <div className="bg-secondary/50 rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground italic">
                    {locale === 'de' 
                      ? 'Eilers+Friends, SalesMade & LeaderShe sind Marken der uphill ventures GmbH.'
                      : 'Eilers+Friends, SalesMade & LeaderShe are trademarks of uphill ventures GmbH.'}
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Angaben gemäß § 5 TMG' : 'Information according to § 5 TMG'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <p className="mb-2"><strong>uphill ventures GmbH</strong></p>
                  <p className="mb-2">Blütenäcker 55/2</p>
                  <p className="mb-2">71332 Waiblingen</p>
                  <p>Deutschland</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Kontakt</h2>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <p className="mb-2">
                    <strong>E-Mail:</strong>{' '}
                    <a href="mailto:team@eilersfriends.com" className="text-brand hover:underline">
                      team@eilersfriends.com
                    </a>
                  </p>
                  <p>
                    <strong>Website:</strong>{' '}
                    <a href="https://eilersfriends.com" className="text-brand hover:underline">
                      www.eilersfriends.com
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Verantwortlich i.S.d. § 55 Abs. 2 RStV' : 'Responsible according to § 55 Abs. 2 RStV'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <p className="mb-2"><strong>Markus Eilers</strong></p>
                  <p className="mb-2">Blütenäcker 55/1</p>
                  <p className="mb-2">71332 Waiblingen</p>
                  <p>Deutschland</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'EU-Streitschlichtung' : 'EU Dispute Resolution'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <p className="mb-4">
                    {locale === 'de' 
                      ? 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:'
                      : 'The European Commission provides a platform for online dispute resolution (OS):'}
                  </p>
                  <p className="mb-4">
                    <a 
                      href="https://ec.europa.eu/consumers/odr/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand hover:underline break-all"
                    >
                      https://ec.europa.eu/consumers/odr/
                    </a>
                  </p>
                  <p>
                    {locale === 'de' 
                      ? 'Unsere E-Mail-Adresse finden Sie oben im Impressum.'
                      : 'You can find our email address in the legal notice above.'}
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Verbraucherstreitbeilegung/Universalschlichtungsstelle' : 'Consumer Dispute Resolution'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <p>
                    {locale === 'de' 
                      ? 'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'
                      : 'We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.'}
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Haftung für Inhalte' : 'Liability for Content'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
                  <p className="mb-4">
                    {locale === 'de' 
                      ? 'Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.'
                      : 'As a service provider, we are responsible for our own content on these pages in accordance with § 7 para. 1 TMG under general law. According to §§ 8 to 10 TMG, however, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.'}
                  </p>
                  <p>
                    {locale === 'de' 
                      ? 'Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.'
                      : 'Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific infringement. Upon becoming aware of corresponding infringements, we will remove this content immediately.'}
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Haftung für Links' : 'Liability for Links'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
                  <p className="mb-4">
                    {locale === 'de' 
                      ? 'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.'
                      : 'Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages.'}
                  </p>
                  <p>
                    {locale === 'de' 
                      ? 'Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.'
                      : 'The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognizable at the time of linking. However, permanent monitoring of the content of the linked pages is not reasonable without concrete evidence of an infringement. Upon becoming aware of legal violations, we will remove such links immediately.'}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'de' ? 'Urheberrecht' : 'Copyright'}
                </h2>
                <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
                  <p className="mb-4">
                    {locale === 'de' 
                      ? 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.'
                      : 'The content and works created by the site operators on these pages are subject to German copyright law. The reproduction, editing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.'}
                  </p>
                  <p>
                    {locale === 'de' 
                      ? 'Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.'
                      : 'Downloads and copies of this page are only permitted for private, non-commercial use. Insofar as the content on this page was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.'}
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

