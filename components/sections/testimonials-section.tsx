"use client";

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const testimonials = [
  {
    name: 'Dirk Battermann',
    role: 'CEO, B2B SaaS',
    quote: 'Markus hat uns das Framework gegeben, das wir brauchten. Unser Team ist jetzt selbstbewusst und unsere Conversion Rate hat sich versiebenfacht.',
    quoteEn: 'Markus gave us the framework we needed. Our team is now confident and our conversion rate has increased sevenfold.',
    quoteRu: 'Маркус дал нам фреймворк, который нам был нужен. Наша команда теперь уверена, а конверсия выросла в семь раз.',
    rating: 5,
  },
  {
    name: 'Michael Strohäcker',
    role: 'Founder & CEO',
    quote: 'Die Kombination aus Revenue Systems und Leadership Coaching war genau das, was wir brauchten. 48% Umsatzwachstum in 12 Monaten.',
    quoteEn: 'The combination of Revenue Systems and Leadership Coaching was exactly what we needed. 48% revenue growth in 12 months.',
    quoteRu: 'Комбинация Revenue Systems и Leadership Coaching — именно то, что нам было нужно. 48% роста выручки за 12 месяцев.',
    rating: 5,
  },
  {
    name: 'Cornelius Zinow',
    role: 'Managing Director',
    quote: 'Zum ersten Mal fühle ich mich wie ein Leader, nicht nur wie ein Arbeiter. Die Transformation war unglaublich.',
    quoteEn: 'For the first time, I feel like a leader, not just a worker. The transformation was incredible.',
    quoteRu: 'Впервые я чувствую себя лидером, а не просто работником. Трансформация была невероятной.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const t = useTranslations();
  const locale = useLocale();

  const getQuote = (testimonial: typeof testimonials[0]) => {
    if (locale === 'en') return testimonial.quoteEn;
    if (locale === 'ru') return testimonial.quoteRu;
    return testimonial.quote;
  };

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
          {t('testimonials.headline')}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-sm border border-border card-hover"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <div className="flex gap-3 mb-6">
                <Quote className="w-5 h-5 text-brand flex-shrink-0 mt-1" />
                <p className="text-foreground italic leading-relaxed">
                  &ldquo;{getQuote(testimonial)}&rdquo;
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-coral flex items-center justify-center text-white font-bold">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
