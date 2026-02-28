"use client";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Award,
  Mic,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Quote
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function Markus() {
  const t = useTranslations();
  const locale = useLocale();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const keynoteTopics = [
    {
      title: t('markus.topic1.title'),
      subtitle: t('markus.topic1.subtitle'),
      points: [
        t('markus.topic1.point1'),
        t('markus.topic1.point2'),
        t('markus.topic1.point3')
      ]
    },
    {
      title: t('markus.topic2.title'),
      subtitle: t('markus.topic2.subtitle'),
      points: [
        t('markus.topic2.point1'),
        t('markus.topic2.point2'),
        t('markus.topic2.point3')
      ]
    },
    {
      title: t('markus.topic3.title'),
      subtitle: t('markus.topic3.subtitle'),
      points: [
        t('markus.topic3.point1'),
        t('markus.topic3.point2'),
        t('markus.topic3.point3')
      ]
    }
  ];

  const testimonials = [
    {
      text: t('markus.testimonial1.text'),
      author: t('markus.testimonial1.author'),
      role: t('markus.testimonial1.role')
    },
    {
      text: t('markus.testimonial2.text'),
      author: t('markus.testimonial2.author'),
      role: t('markus.testimonial2.role')
    },
    {
      text: t('markus.testimonial3.text'),
      author: t('markus.testimonial3.author'),
      role: t('markus.testimonial3.role')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-cyan-50/30" />
        
        <div className="container relative z-10 pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              className="space-y-8"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="flex flex-col items-center lg:items-start gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    {t('markus.hero.badge')}
                  </span>
                </div>
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center lg:text-left">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  {t('markus.hero.headline')}
                </span>
              </motion.h1>

              <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-center lg:text-left">
                {t('markus.hero.subheadline')}
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg"
                  onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('markus.hero.cta.primary')}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-6 text-lg border-2"
                  onClick={() => document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('markus.hero.cta.secondary')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>{t('markus.hero.proof1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>{t('markus.hero.proof2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>{t('markus.hero.proof3')}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Card className="p-8 bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-0 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                    <Mic className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-center">
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                    </div>
                    <p className="text-lg italic text-center">
                      "{t('markus.hero.testimonial')}"
                    </p>
                    <p className="text-sm text-white/80 text-center">
                      — {t('markus.hero.testimonial_author')}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-8">
            {t('markus.logos.title')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="text-2xl font-bold text-muted-foreground">Amazon</div>
            <div className="text-2xl font-bold text-muted-foreground">Microsoft</div>
            <div className="text-2xl font-bold text-muted-foreground">Telekom</div>
            <div className="text-2xl font-bold text-muted-foreground">Cisco</div>
            <div className="text-2xl font-bold text-muted-foreground">Intel</div>
            <div className="text-2xl font-bold text-muted-foreground">WSJ</div>
          </div>
        </div>
      </section>

      {/* Keynote Topics Section */}
      <section id="topics" className="py-24 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('markus.topics.headline')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('markus.topics.subheadline')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {keynoteTopics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-xl transition-shadow border-2 hover:border-blue-500/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                      <Mic className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{topic.title}</h3>
                      <p className="text-muted-foreground mb-4">{topic.subtitle}</p>
                    </div>
                    <ul className="space-y-3">
                      {topic.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('markus.credentials.headline')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('markus.credentials.subheadline')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="p-8 h-full">
                  <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{t('markus.credential1.title')}</h3>
                  <p className="text-muted-foreground">{t('markus.credential1.description')}</p>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-8 h-full">
                  <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{t('markus.credential2.title')}</h3>
                  <p className="text-muted-foreground">{t('markus.credential2.description')}</p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('markus.testimonials.headline')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('markus.testimonials.subheadline')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full flex flex-col justify-between">
                  <Quote className="w-8 h-8 text-blue-200 mb-4" />
                  <p className="text-muted-foreground italic mb-6 flex-grow">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('markus.cta.headline')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t('markus.cta.subheadline')}
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-8 text-xl"
              onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
            >
              <Calendar className="w-6 h-6 mr-3" />
              {t('markus.cta.button')}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

