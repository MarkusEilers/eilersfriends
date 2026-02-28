"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

const offers = [
  {
    icon: TrendingUp,
    titleKey: 'offers.salesmade.title',
    taglineKey: 'offers.salesmade.tagline',
    features: ['offers.salesmade.feature1', 'offers.salesmade.feature2', 'offers.salesmade.feature3', 'offers.salesmade.feature4'],
    color: 'brand',
    href: '/salesmade',
    popular: true,
  },
  {
    icon: Sparkles,
    titleKey: 'offers.liquid.title',
    taglineKey: 'offers.liquid.tagline',
    features: ['offers.liquid.feature1', 'offers.liquid.feature2', 'offers.liquid.feature3', 'offers.liquid.feature4'],
    color: 'coral',
    href: '/aljona',
    popular: false,
  },
  {
    icon: Users,
    titleKey: 'offers.winning.title',
    taglineKey: 'offers.winning.tagline',
    features: ['offers.winning.feature1', 'offers.winning.feature2', 'offers.winning.feature3', 'offers.winning.feature4'],
    color: 'brand',
    href: '/contact',
    popular: false,
  },
];

export default function OffersSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16"
        >
          {t('offers.headline')}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`bg-card rounded-2xl p-8 shadow-sm border ${
                offer.popular ? 'border-brand ring-2 ring-brand/20' : 'border-border'
              } card-hover relative flex flex-col h-full`}
            >
              {offer.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-white text-sm font-medium rounded-full">
                  Popular
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center mb-6`}>
                <offer.icon className={`w-7 h-7 text-brand`} />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{t(offer.titleKey)}</h3>
              <p className="text-muted-foreground mb-8 min-h-[60px]">{t(offer.taglineKey)}</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {offer.features.map((featureKey) => (
                  <li key={featureKey} className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-[#0096FF] flex-shrink-0" />
                    <span>{t(featureKey)}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <Link href={`/${locale}${offer.href}`}>
                  <Button 
                    className={`w-full ${offer.popular ? 'btn-primary' : ''}`}
                    variant={offer.popular ? 'default' : 'outline'}
                  >
                    {t('offers.cta')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

