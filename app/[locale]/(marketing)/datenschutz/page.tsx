import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.datenschutz');
  return {
    title: t('metadata.title'),
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DatenschutzPage({ params }: PageProps) {
  await params; // locale not needed — Link from i18n nav resolves it
  const t = await getTranslations('legal.datenschutz');
  const serverLogItems = t.raw('sections.2.serverLogItems') as string[];
  const rightsList = t.raw('sections.4.rightsList') as string[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-3xl font-bold mb-10" style={{ color: '#0D0D0B' }}>{t('hero.title')}</h1>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.0.title')}</h2>
              <h3 className="font-semibold mb-2">{t('sections.0.generalTitle')}</h3>
              <p>{t('sections.0.generalText')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.1.title')}</h2>
              <p>
                {t.rich('sections.1.text', {
                  br: () => <br />,
                  a: (chunks) => (
                    <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: '#1A5FD4' }}>{chunks}</a>
                  ),
                })}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.2.title')}</h2>
              <h3 className="font-semibold mb-2">{t('sections.2.cookiesTitle')}</h3>
              <p>{t('sections.2.cookiesText')}</p>
              <h3 className="font-semibold mb-2 mt-4">{t('sections.2.serverLogTitle')}</h3>
              <p>{t('sections.2.serverLogText')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                {serverLogItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.3.title')}</h2>
              <p>{t('sections.3.text1')}</p>
              <p className="mt-3">{t('sections.3.text2')}</p>
              <p className="mt-3">
                {t.rich('sections.3.text3', {
                  b: (chunks) => <strong>{chunks}</strong>,
                  a: (chunks) => (
                    <a href="https://www.beehiiv.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#1A5FD4' }}>{chunks}</a>
                  ),
                })}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.4.title')}</h2>
              <p>{t('sections.4.rightsIntro')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                {rightsList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">{t('sections.4.complaint')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.5.title')}</h2>
              <h3 className="font-semibold mb-2">{t('sections.5.vercelTitle')}</h3>
              <p>
                {t.rich('sections.5.vercelText', {
                  a: (chunks) => (
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#1A5FD4' }}>{chunks}</a>
                  ),
                })}
              </p>
              <h3 className="font-semibold mb-2 mt-4">{t('sections.5.googleFontsTitle')}</h3>
              <p>{t('sections.5.googleFontsText')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.6.title')}</h2>
              <p>
                {t.rich('sections.6.text', {
                  a: (chunks) => (
                    <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: '#1A5FD4' }}>{chunks}</a>
                  ),
                })}
              </p>
              <p className="mt-3 text-xs text-gray-400">{t('sections.6.stand')}</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
