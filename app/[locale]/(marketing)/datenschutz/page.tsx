"use client";

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export default function Datenschutz() {
  const t = useTranslations('Datenschutz');
  const locale = useLocale();

  const sections = [
    "section1",
    "section2",
    "section3",
    "section4",
    "section5",
    "section6",
  ];

  const subsections = {
    section1: ["subsection1_1", "subsection1_2"],
    section2: ["subsection2_1"],
    section3: ["subsection3_1", "subsection3_2", "subsection3_3", "subsection3_4", "subsection3_5", "subsection3_6", "subsection3_7"],
    section4: ["subsection4_1", "subsection4_2", "subsection4_3", "subsection4_4"],
    section5: ["subsection5_1"],
    section6: ["subsection6_1"],
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
            <p className="text-muted-foreground mb-12">{t('lastUpdated')}</p>

            <div className="space-y-12">
              {sections.map((sectionKey, sectionIndex) => (
                <section key={sectionIndex}>
                  <h2 className="text-2xl font-bold mb-6 text-brand">{t(`${sectionKey}.title`)}</h2>
                  <div className="space-y-6">
                    {subsections[sectionKey as keyof typeof subsections].map((subsectionKey, subIndex) => (
                      <div key={subIndex} className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="text-lg font-semibold mb-3">{t(`${sectionKey}.${subsectionKey}.title`)}</h3>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {t.rich(`${sectionKey}.${subsectionKey}.content`, {
                            br: (chunks) => <>{chunks}<br /></>,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

