"use client";

import { motion } from 'framer-motion';
import { Target, Cog, GraduationCap, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const beliefs = [
  {
    icon: Target,
    titleKey: 'beliefs.belief1.title',
    descriptionKey: 'beliefs.belief1.description',
  },
  {
    icon: Cog,
    titleKey: 'beliefs.belief2.title',
    descriptionKey: 'beliefs.belief2.description',
  },
  {
    icon: GraduationCap,
    titleKey: 'beliefs.belief3.title',
    descriptionKey: 'beliefs.belief3.description',
  },
  {
    icon: Users,
    titleKey: 'beliefs.belief4.title',
    descriptionKey: 'beliefs.belief4.description',
  },
];

export default function BeliefsSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-padding">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16"
        >
          {t('beliefs.headline')}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {beliefs.map((belief, index) => (
            <motion.div
              key={belief.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex gap-5"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <belief.icon className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t(belief.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(belief.descriptionKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

