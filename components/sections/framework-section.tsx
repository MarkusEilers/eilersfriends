"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, Heart, Users, Linkedin, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function FrameworkSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand/10 text-brand text-sm font-medium mb-6"
          >
            {t('framework.badge') || 'Your Coaches'}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            {t('framework.headline')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            {t('framework.subheadline')}
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Markus Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden card-hover group"
          >
            {/* Image */}
            <div className="relative h-[420px] overflow-hidden">
              <img 
                src="/markus-eilers.png" 
                alt="Markus Eilers"
                className="w-full h-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3 py-1 rounded-full bg-brand text-white text-xs font-medium mb-2">
                  {t('framework.markus.title')}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold">{t('framework.markus.name')}</h3>
                  <p className="text-muted-foreground text-sm">Co-Founder & Revenue Architect</p>
                </div>
                <a 
                  href="https://linkedin.com/in/markuseilers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-brand/10 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-muted-foreground hover:text-brand" />
                </a>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {t('framework.markus.description')}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0096FF]/10 text-[#0096FF] text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  {t('framework.markus.result')}
                </div>
                <Link href={`/${locale}/markus`}>
                  <span className="text-sm font-medium text-[#0096FF] hover:text-[#0077CC] flex items-center gap-1 cursor-pointer">
                    {t('common.learnMore')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Aljona Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden card-hover group"
          >
            {/* Image */}
            <div className="relative h-[420px] overflow-hidden">
              <img 
                src="/aljona-eilers.png" 
                alt="Aljona Eilers"
                className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3 py-1 rounded-full bg-brand text-white text-xs font-medium mb-2">
                  {t('framework.aljona.title')}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold">{t('framework.aljona.name')}</h3>
                  <p className="text-muted-foreground text-sm">Co-Founder & Leadership Coach</p>
                </div>
                <a 
                  href="https://www.linkedin.com/in/aljona-eilers-812b65194/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-brand/10 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-muted-foreground hover:text-brand" />
                </a>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {t('framework.aljona.description')}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                  <Heart className="w-4 h-4" />
                  {t('framework.aljona.result')}
                </div>
                <Link href={`/${locale}/aljona`}>
                  <span className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer">
                    {t('common.learnMore')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Together Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-brand to-[#ff9a5a] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-8 h-8" />
              <h3 className="text-2xl md:text-3xl font-bold">{t('framework.together')}</h3>
            </div>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-6">
              Revenue Systems + Transformational Leadership = Predictable Growth
            </p>
            <Link href={`/${locale}/contact`}>
              <Button 
                size="lg" 
                className="bg-white text-brand hover:bg-white/90 rounded-full px-8"
              >
                {t('hero.cta.primary')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

