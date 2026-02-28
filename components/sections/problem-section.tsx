"use client";

import { motion } from 'framer-motion';
import { TrendingDown, Flame, AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const avatars = [
  {
    icon: TrendingDown,
    titleKey: 'problem.avatar1.title',
    descriptionKey: 'problem.avatar1.description',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Flame,
    titleKey: 'problem.avatar2.title',
    descriptionKey: 'problem.avatar2.description',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: AlertTriangle,
    titleKey: 'problem.avatar3.title',
    descriptionKey: 'problem.avatar3.description',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
];

export default function ProblemSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            {t('problem.headline')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-muted-foreground"
          >
            {t('problem.subheadline')}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {avatars.map((avatar, index) => (
            <motion.div
              key={avatar.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-sm border border-border card-hover"
            >
              <div className={`w-14 h-14 rounded-xl ${avatar.bgColor} flex items-center justify-center mb-6`}>
                <avatar.icon className={`w-7 h-7 ${avatar.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(avatar.titleKey)}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(avatar.descriptionKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

