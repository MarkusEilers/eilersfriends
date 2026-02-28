"use client";
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function GrowthCalculator() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-padding">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] via-[#1a2f4a] to-[#0f1f33] p-12 md:p-16 text-center"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Decorative Circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FF7518]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#0EA5E9]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-[#FF7518] font-semibold text-lg mb-6"
            >
              {t('sm.finalcta.tagline')}
            </motion.p>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              {t('sm.finalcta.headline')}
            </motion.h2>

            {/* Body Text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {t('sm.finalcta.text')}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <Link href={`/${locale}/contact`}>
                <Button 
                  size="lg" 
                  className="bg-[#FF7518] hover:bg-[#FF7518]/90 text-white rounded-full px-10 py-6 text-lg font-semibold group shadow-xl shadow-[#FF7518]/20"
                >
                  <Calendar className="mr-2 w-5 h-5" />
                  {t('sm.finalcta.button')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Footnote */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-white/40 mt-8"
            >
              {t('sm.finalcta.footnote')}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

