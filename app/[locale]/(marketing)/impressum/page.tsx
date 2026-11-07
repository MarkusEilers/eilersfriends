import { getTranslations, getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.impressum');
  return {
    title: t('metaTitle'),
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImpressumPage({ params }: PageProps) {
  await params; // locale not needed — Link from i18n nav resolves it
  const t = await getTranslations('legal.impressum');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-3xl font-bold mb-10" style={{ color: '#0D0D0B' }}>{t('title')}</h1>
          {/* Übersetzungen: Hinweis, dass die deutsche Fassung maßgeblich ist */}
          {(await getLocale()) !== 'de' && <p className="mb-8 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-600">{t('languageNote')}</p>}

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.legalNotice.title')}</h2>
              <p>
                {t.rich('sections.legalNotice.address', {
                  br: () => <br />
                })}
              </p>
              <p className="mt-4">
                {t('sections.legalNotice.representedBy')}
              </p>
              <p className="mt-1">
                {t('sections.legalNotice.register')}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                {t('sections.legalNotice.brands')}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.contact.title')}</h2>
              <p>
                {t.rich('sections.contact.content', {
                  a1: (c) => <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: '#1A5FD4' }}>{c}</a>,
                  a2: (c) => <a href="https://eilersfriends.com" className="underline" style={{ color: '#1A5FD4' }}>{c}</a>,
                  br: () => <br />
                })}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.vat.title')}</h2>
              <p>
                {t.rich('sections.vat.content', {
                  br: () => <br />
                })}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.responsible.title')}</h2>
              <p>
                {t.rich('sections.responsible.content', {
                  br: () => <br />
                })}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.dispute.title')}</h2>
              <p>
                {t.rich('sections.dispute.platform', {
                  a: (c) => <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#1A5FD4' }}>{c}</a>
                })}
              </p>
              <p className="mt-3">
                {t('sections.dispute.noParticipation')}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.liabilityContent.title')}</h2>
              <p>
                {t('sections.liabilityContent.content')}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.liabilityLinks.title')}</h2>
              <p>
                {t('sections.liabilityLinks.content')}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.copyright.title')}</h2>
              <p>
                {t('sections.copyright.content')}
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
