"use client";
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, Users, Zap, CheckCircle2, Shield, Award } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SalesMadeSection() {
  const locale = useLocale();

  const content = {
    de: {
      badge: 'Soft-Launch 2026 · Nur 30 Plätze',
      headline: 'SalesMade Academy',
      subheadline: 'Bridging the Sales Education Gap.',
      description: 'Wie wir die besten Verkäufer:Innen noch besser machen und den übrigen 82% eine echte Chance geben, Erwartungen zu erfüllen und ihre Ziele zu erreichen.',
      step1: {
        label: 'Schritt 1',
        title: 'Simuliertes Kundenszenario',
        description: 'Jeder Teilnehmer durchläuft ein realistisches Kundenszenario, in dem 13 entscheidende Sales-Skills individuell gemessen und bewertet werden.',
      },
      step2: {
        label: 'Schritt 2',
        title: 'Individueller Lernpfad',
        description: 'Basierend auf dem Benchmark entwickeln wir für jeden Seller einen maßgeschneiderten Entwicklungsplan – mit angepassten Szenarien in 5 Schwierigkeitsstufen.',
      },
      stats: [
        { number: '12', label: 'Monate Begleitung' },
        { number: '30', label: 'Exklusive Plätze' },
        { number: '13', label: 'Core Skills' },
      ],
      trustItems: [
        '867+ trainierte Verkäufer',
        'Geld-zurück-Garantie',
        '15 Jahre Erfahrung',
      ],
      cta: 'Mehr über die Academy erfahren',
    },
    en: {
      badge: 'Soft-Launch 2026 · Only 30 Spots',
      headline: 'SalesMade Academy',
      subheadline: 'Bridging the Sales Education Gap.',
      description: 'How we make the best salespeople even better and give the remaining 82% a real chance to meet expectations and achieve their goals.',
      step1: {
        label: 'Step 1',
        title: 'Simulated Customer Scenario',
        description: 'Each participant goes through a realistic customer scenario where 13 critical sales skills are individually measured and evaluated.',
      },
      step2: {
        label: 'Step 2',
        title: 'Individual Learning Path',
        description: 'Based on the benchmark, we develop a customized development plan for each seller – with adapted scenarios across 5 difficulty levels.',
      },
      stats: [
        { number: '12', label: 'Months of Support' },
        { number: '30', label: 'Exclusive Spots' },
        { number: '13', label: 'Core Skills' },
      ],
      trustItems: [
        '867+ trained salespeople',
        'Money-back guarantee',
        '15 years experience',
      ],
      cta: 'Learn more about the Academy',
    },
    ru: {
      badge: 'Soft-Launch 2026 · Только 30 мест',
      headline: 'SalesMade Academy',
      subheadline: 'Bridging the Sales Education Gap.',
      description: 'Как мы делаем лучших продавцов ещё лучше и даём остальным 82% реальный шанс оправдать ожидания и достичь своих целей.',
      step1: {
        label: 'Шаг 1',
        title: 'Симулированный клиентский сценарий',
        description: 'Каждый участник проходит реалистичный клиентский сценарий, в котором индивидуально измеряются и оцениваются 13 ключевых навыков продаж.',
      },
      step2: {
        label: 'Шаг 2',
        title: 'Индивидуальный путь обучения',
        description: 'На основе бенчмарка мы разрабатываем индивидуальный план развития для каждого продавца – с адаптированными сценариями 5 уровней сложности.',
      },
      stats: [
        { number: '12', label: 'Месяцев сопровождения' },
        { number: '30', label: 'Эксклюзивных мест' },
        { number: '13', label: 'Ключевых навыков' },
      ],
      trustItems: [
        '867+ обученных продавцов',
        'Гарантия возврата денег',
        '15 лет опыта',
      ],
      cta: 'Узнать больше об Академии',
    }
  };

  const c = content[locale as keyof typeof content] || content.de;

  return (
    <section className="section-padding bg-background">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">{c.badge}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              {c.headline}
            </h2>
            <p className="text-xl md:text-2xl font-semibold text-blue-500 mb-6">
              {c.subheadline}
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {c.description}
            </p>
          </motion.div>

          {/* Two-Step Preview */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative h-full rounded-2xl bg-gradient-to-br from-blue-500/[0.08] via-blue-400/[0.03] to-transparent border border-blue-500/15 p-7 md:p-8 hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{c.step1.label}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{c.step1.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {c.step1.description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="relative h-full rounded-2xl bg-gradient-to-br from-green-500/[0.08] via-emerald-400/[0.03] to-transparent border border-green-500/15 p-7 md:p-8 hover:border-green-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">{c.step2.label}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{c.step2.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {c.step2.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Compact Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {c.stats.map((stat, index) => (
                <div key={index} className="text-center p-3">
                  <div className="text-2xl md:text-3xl font-bold text-blue-500 mb-0.5">{stat.number}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
              {c.trustItems.map((item, index) => {
                const icons = [CheckCircle2, Shield, Award];
                const Icon = icons[index];
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-500" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>

            <Link href={`/${locale}/salesmade`}>
              <Button size="lg" className="rounded-full px-8 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
                {c.cta}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

