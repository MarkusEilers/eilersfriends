"use client";
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  MessageCircle, 
  Shield, 
  Fingerprint,
  Users,
  BookOpen,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  TrendingUp,
  Calendar,
  Mic
} from "lucide-react";
import { motion } from "framer-motion";

export default function Aljona() {
  const t = useTranslations();
  const locale = useLocale();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      
      {/* Hero Section - TOF */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-background to-yellow-50/30" />
        
        <div className="container relative z-10 pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge - Centered */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center lg:justify-start"
              >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border border-yellow-500/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-600">{t('aljona.hero.tagline')}</span>
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center lg:text-left">
                {t('aljona.hero.headline')}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-400">
                  {t('aljona.hero.headline_highlight')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-center lg:text-left">
                {t('aljona.hero.subheadline')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-6 text-lg"
                  onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('aljona.hero.cta.primary')}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-6 text-lg border-2"
                  onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('aljona.hero.cta.secondary')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  <span>{t('aljona.hero.trust1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  <span>{t('aljona.hero.trust2')}</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/aljona/aljona-hero-yellow.png" 
                  alt="Aljona Eilers - Leadership Coach"
                  className="w-full h-auto object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                
                {/* TEDx Speaker Badge Overlay - Right aligned */}
                <div className="absolute bottom-4 right-4">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 backdrop-blur-sm rounded-lg text-black text-sm font-bold shadow-xl transform -rotate-1 border-2 border-yellow-500">
                    <Award className="w-4 h-4" />
                    <span>{t('aljona.hero.badge')}</span>
                  </div>
                </div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {t('aljona.hero.testimonial')}
                </p>
                <p className="text-xs font-medium mt-1">{t('aljona.hero.testimonial_author')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logo Marquee - Above the Fold */}
      <section className="py-4 bg-background border-y border-border/30 overflow-hidden">
        <div className="container mb-4">
          <p className="text-center text-sm text-muted-foreground font-medium">
            {t('aljona.marquee.title')}
          </p>
        </div>
        
        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Fade Left */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          
          {/* Gradient Fade Right */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling Logos */}
          <div className="flex animate-marquee-aljona">
            {[1, 2, 3].map((set) => (
              <div key={set} className="flex items-center gap-16 shrink-0 px-8">
                <img src="/logos/wsj.png" alt="Wall Street Journal" className="h-12 md:h-14 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                <img src="/images/logos/usa-today.png" alt="USA Today" className="h-12 md:h-14 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                <img src="/logos/amazon.png" alt="Amazon" className="h-12 md:h-14 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                <img src="/logos/barnes-noble.png" alt="Barnes & Noble" className="h-12 md:h-14 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
        
        <style>{`
          @keyframes marquee-aljona {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
          .animate-marquee-aljona {
            animation: marquee-aljona 25s linear infinite;
            will-change: transform;
          }
          .animate-marquee-aljona:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Problem Section - TOF */}
      <section className="py-24 bg-black text-white">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.problem.headline')}{" "}
              <span className="text-yellow-400">{t('aljona.problem.headline_highlight')}</span>
            </h2>
            <p className="text-xl text-neutral-300">
              {t('aljona.problem.subheadline')}
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            {...staggerContainer}
          >
            {[
              {
                icon: TrendingUp,
                title: t('aljona.problem.item1.title'),
                description: t('aljona.problem.item1.description')
              },
              {
                icon: Users,
                title: t('aljona.problem.item2.title'),
                description: t('aljona.problem.item2.description')
              },
              {
                icon: Heart,
                title: t('aljona.problem.item3.title'),
                description: t('aljona.problem.item3.description')
              },
              {
                icon: Shield,
                title: t('aljona.problem.item4.title'),
                description: t('aljona.problem.item4.description')
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="bg-neutral-900 rounded-xl p-6 border border-neutral-800"
              >
                <item.icon className="w-10 h-10 mb-4 text-yellow-400" />
                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-neutral-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Section - MOF */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.solution.headline')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('aljona.solution.subheadline')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="relative"
              {...fadeInUp}
            >
              <img 
                src="/images/aljona/aljona-speaking.png" 
                alt="Aljona speaking at a conference"
                className="rounded-2xl shadow-xl w-full"
              />
            </motion.div>
            <motion.div 
              className="space-y-6"
              {...staggerContainer}
            >
              {[
                {
                  icon: BookOpen,
                  title: t('aljona.solution.item1.title'),
                  description: t('aljona.solution.item1.description')
                },
                {
                  icon: Mic,
                  title: t('aljona.solution.item2.title'),
                  description: t('aljona.solution.item2.description')
                },
                {
                  icon: Fingerprint,
                  title: t('aljona.solution.item3.title'),
                  description: t('aljona.solution.item3.description')
                }
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start gap-4"
                >
                  <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section - MOF */}
      <section id="programs" className="py-24 bg-yellow-50/50">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.programs.headline')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('aljona.programs.subheadline')}
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            {...staggerContainer}
          >
            {(['liquid', 'leadershe', 'bestseller'] as const).map((key) => (
              <motion.div key={key} {...fadeInUp}>
                <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8 flex flex-col flex-grow">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{t(`aljona.programs.${key}.title`)}</h3>
                      <p className="text-muted-foreground mb-2">{t(`aljona.programs.${key}.subtitle`)}</p>
                      <p className="text-sm text-muted-foreground">{t(`aljona.programs.${key}.description`)}</p>
                    </div>
                    <p className="text-sm font-semibold mb-3">{t(`aljona.programs.${key}.section_title`)}</p>
                    <ul className="space-y-3 mb-8 text-sm flex-grow">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <li key={num} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                          <span>{t(`aljona.programs.${key}.feature${num}`)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm italic text-muted-foreground mb-4">{t(`aljona.programs.${key}.quote`)}</p>
                    <Button 
                      size="lg" 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white mt-auto"
                      onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
                    >
                      {t(`aljona.programs.${key}.cta`)}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section - BOF */}
      <section className="py-24 bg-black text-white">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.testimonial.headline')}
            </h2>
          </motion.div>

          <motion.div 
            className="relative max-w-3xl mx-auto"
            {...fadeInUp}
          >
            <Card className="bg-neutral-900 border-neutral-800 p-8 md:p-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-6 text-yellow-400" />
              <p className="text-xl md:text-2xl italic leading-relaxed text-neutral-300 mb-8">
                "{t('aljona.testimonial.quote')}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <img 
                  src="/images/aljona/testimonial-author.png" 
                  alt={t('aljona.testimonial.author_name')}
                  className="w-16 h-16 rounded-full border-4 border-yellow-400"
                />
                <div>
                  <p className="font-bold text-lg text-white">{t('aljona.testimonial.author_name')}</p>
                  <p className="text-neutral-400">{t('aljona.testimonial.author_title')}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - BOF */}
      <section className="py-24 bg-yellow-500">
        <div className="container text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('aljona.cta.headline')}
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              {t('aljona.cta.subheadline')}
            </p>
            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-100 text-yellow-600 px-10 py-7 text-xl"
              onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
            >
              <Calendar className="w-6 h-6 mr-3" />
              {t('aljona.cta.button')}
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

