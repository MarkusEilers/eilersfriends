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
  Mic,
  Brain,
  Target
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

      {/* Solution Section - Liquid Leadership Ansatz (from Original) */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.framework.headline')}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-400">
                {t('aljona.framework.headline_highlight')}
              </span>{" "}
              {t('aljona.framework.headline_end')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('aljona.framework.subheadline')}
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
                  icon: Brain,
                  title: t('aljona.framework.item1.title'),
                  description: t('aljona.framework.item1.description')
                },
                {
                  icon: MessageCircle,
                  title: t('aljona.framework.item2.title'),
                  description: t('aljona.framework.item2.description')
                },
                {
                  icon: Shield,
                  title: t('aljona.framework.item3.title'),
                  description: t('aljona.framework.item3.description')
                },
                {
                  icon: Fingerprint,
                  title: t('aljona.framework.item4.title'),
                  description: t('aljona.framework.item4.description')
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

              {/* Stats from Original */}
              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">38%</div>
                  <div className="text-xs text-muted-foreground">mehr Produktivität</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">90%+</div>
                  <div className="text-xs text-muted-foreground">Team-Retention</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">0</div>
                  <div className="text-xs text-muted-foreground">Burnout-Fälle</div>
                </div>
              </div>
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

      {/* Keynote Speaker Section - from Original */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div 
            className="max-w-4xl mx-auto"
            {...fadeInUp}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('aljona.speaker.headline')}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-400">
                    {t('aljona.speaker.headline_highlight')}
                  </span>{" "}
                  {t('aljona.speaker.headline_end')}
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  {t('aljona.speaker.subheadline')}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  {t('aljona.speaker.credentials')}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Button 
                    size="lg" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('aljona.speaker.cta.primary')}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2"
                    onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('aljona.speaker.cta.secondary')}
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl p-8">
                <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-6">
                  {t('aljona.speaker.topics_title')}
                </p>
                <div className="space-y-4">
                  {[
                    t('aljona.speaker.topic1'),
                    t('aljona.speaker.topic2'),
                    t('aljona.speaker.topic3'),
                  ].map((topic, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Mic className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-foreground font-medium">{topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - 3 Testimonials from Original */}
      <section className="py-24 bg-black text-white">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('aljona.testimonials.headline')}{" "}
              <span className="text-yellow-400">{t('aljona.testimonials.headline_highlight')}</span>{" "}
              {t('aljona.testimonials.headline_end')}
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            {...staggerContainer}
          >
            {[
              {
                quote: t('aljona.testimonial1.quote'),
                author: t('aljona.testimonial1.author'),
                role: t('aljona.testimonial1.role'),
              },
              {
                quote: t('aljona.testimonial2.quote'),
                author: t('aljona.testimonial2.author'),
                role: t('aljona.testimonial2.role'),
              },
              {
                quote: t('aljona.testimonial3.quote'),
                author: t('aljona.testimonial3.author'),
                role: t('aljona.testimonial3.role'),
              },
            ].map((item, index) => (
              <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1, duration: 0.6 }}>
                <Card className="h-full bg-neutral-900 border-neutral-800">
                  <CardContent className="p-8">
                    <MessageCircle className="w-8 h-8 mb-4 text-yellow-400" />
                    <p className="text-lg italic leading-relaxed text-neutral-300 mb-6">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div>
                      <p className="font-bold text-white">{item.author}</p>
                      <p className="text-sm text-neutral-400">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - BOF with Bullets and Trust Items from Original */}
      <section className="py-24 bg-yellow-500">
        <div className="container text-center">
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('aljona.cta.headline')}
            </h2>
            <p className="text-xl text-white/80 mb-10">
              {t('aljona.cta.subheadline')}
            </p>

            {/* Bullet Points */}
            <div className="flex flex-col items-center gap-4 mb-10">
              {[
                t('aljona.cta.benefit1'),
                t('aljona.cta.benefit2'),
                t('aljona.cta.benefit3'),
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-100 text-yellow-600 px-10 py-7 text-xl mb-8"
              onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}
            >
              <Calendar className="w-6 h-6 mr-3" />
              {t('aljona.cta.button')}
            </Button>

            {/* Trust Items */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{t('aljona.cta.trust1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{t('aljona.cta.trust2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{t('aljona.cta.trust3')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
