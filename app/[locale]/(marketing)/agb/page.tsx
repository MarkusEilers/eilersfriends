import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.agb');
  return {
    title: t('metaTitle'),
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AgbPage({ params }: PageProps) {
  await params; // locale not needed — Link from i18n nav resolves it
  const t = await getTranslations('legal.agb');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-3xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
            {t('title')}
          </h1>
          <p className="mb-10 text-sm text-gray-500">
            {t('subtitle')}
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.1.title')}</h2>
              <p>{t('sections.1.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.2.title')}</h2>
              <p>{t('sections.2.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.3.title')}</h2>
              <p>{t('sections.3.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.4.title')}</h2>
              <p>{t('sections.4.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.5.title')}</h2>
              <p>{t('sections.5.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.6.title')}</h2>
              <p>{t('sections.6.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.7.title')}</h2>
              <p>{t('sections.7.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.8.title')}</h2>
              <p>{t('sections.8.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.9.title')}</h2>
              <p>{t('sections.9.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.10.title')}</h2>
              <p>{t('sections.10.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.11.title')}</h2>
              <p>{t('sections.11.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.12.title')}</h2>
              <p>{t.rich('sections.12.text', {
                a: (chunks) => (
                  <a href="/datenschutz" className="underline hover:text-gray-900">{chunks}</a>
                ),
              })}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.13.title')}</h2>
              <p>{t('sections.13.text')}</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>{t('sections.14.title')}</h2>
              <p>{t('sections.14.text')}</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
