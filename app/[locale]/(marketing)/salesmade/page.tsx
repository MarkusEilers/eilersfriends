 "use client";
 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { ArrowRight, Calendar, CheckCircle2, Target, MessageSquare, TrendingDown, TrendingUp, Users, Zap, Brain, Heart, Lightbulb, Shield, Award, Mic, Eye, FileText, Crosshair, BarChart3, Sparkles, Clock, AlertTriangle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
 import { Slider } from '@/components/ui/slider';
 import { useTranslations, useLocale } from 'next-intl';
 
 export default function SalesMade() {
 const t = useTranslations();
 const locale = useLocale();
 
 // ROI Calculator State - realistic defaults
 const [salespeople, setSalespeople] = useState(5);
 const [dealValue, setDealValue] = useState(8000);
 const [meetingsPerMonth, setMeetingsPerMonth] = useState(3);
 
 // ROI Calculations - realistic model
 const currentConversion = 0.28;
 const improvedConversion = 0.54;
 const dealValueIncrease = 1.48;
 const improvedMeetings = Math.max(meetingsPerMonth, 15);
 
 const currentRevenue = salespeople * dealValue * currentConversion * meetingsPerMonth * 12;
 const improvedRevenue = salespeople * (dealValue * dealValueIncrease) * improvedConversion * improvedMeetings * 12;
 const missedRevenue = improvedRevenue - currentRevenue;
 
 const formatCurrency = (value: number) => {
 return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-US', {
 style: 'currency',
 currency: 'EUR',
 minimumFractionDigits: 0,
 maximumFractionDigits: 0,
 }).format(value);
 };
 
 const fadeInUp = {
 initial: { opacity: 0, y: 20 },
 whileInView: { opacity: 1, y: 0 },
 viewport: { once: true },
 transition: { duration: 0.6 }
 };
 
 const crisisStats = [
 {
 persona: t('sm.crisis.stat1.persona'),
 number: t('sm.crisis.stat1.number'),
 label: t('sm.crisis.stat1.label'),
 description: t('sm.crisis.stat1.description'),
 color: 'text-red-500',
 borderColor: 'border-red-500/20 hover:border-red-500/40',
 bgColor: 'from-red-500/[0.06]',
 },
 {
 persona: t('sm.crisis.stat2.persona'),
 number: t('sm.crisis.stat2.number'),
 label: t('sm.crisis.stat2.label'),
 description: t('sm.crisis.stat2.description'),
 color: 'text-amber-500',
 borderColor: 'border-amber-500/20 hover:border-amber-500/40',
 bgColor: 'from-amber-500/[0.06]',
 },
 {
 persona: t('sm.crisis.stat3.persona'),
 number: t('sm.crisis.stat3.number'),
 label: t('sm.crisis.stat3.label'),
 description: t('sm.crisis.stat3.description'),
 color: 'text-blue-500',
 borderColor: 'border-blue-500/20 hover:border-blue-500/40',
 bgColor: 'from-blue-500/[0.06]',
 },
 ];
 
 const symptoms = [
 { icon: TrendingDown, text: t('sm.symptoms.item1') },
 { icon: Users, text: t('sm.symptoms.item2') },
 { icon: BarChart3, text: t('sm.symptoms.item3') },
 { icon: AlertTriangle, text: t('sm.symptoms.item4') },
 ];
 
 const visionItems = [
 { icon: Shield, text: t('sm.vision.item1') },
 { icon: Target, text: t('sm.vision.item2') },
 { icon: Heart, text: t('sm.vision.item3') },
 { icon: Lightbulb, text: t('sm.vision.item4') },
 { icon: Sparkles, text: t('sm.vision.item5') },
 { icon: BarChart3, text: t('sm.vision.item6') },
 ];
 
 const measures = [
 { icon: Mic, text: t('sm.system.measure1') },
 { icon: Users, text: t('sm.system.measure2') },
 { icon: MessageSquare, text: t('sm.system.measure3') },
 { icon: Zap, text: t('sm.system.measure4') },
 { icon: Award, text: t('sm.system.measure5') },
 { icon: BarChart3, text: t('sm.system.measure6') },
 ];
 
 const results = [
 t('sm.results.item1'), t('sm.results.item2'), t('sm.results.item3'),
 t('sm.results.item4'), t('sm.results.item5'), t('sm.results.item6'),
 ];
 
 const tools = [
 { icon: Target, title: t('sm.tools.tool1.title'), description: t('sm.tools.tool1.description') },
 { icon: Zap, title: t('sm.tools.tool2.title'), description: t('sm.tools.tool2.description') },
 { icon: Brain, title: t('sm.tools.tool3.title'), description: t('sm.tools.tool3.description') },
 { icon: Shield, title: t('sm.tools.tool4.title'), description: t('sm.tools.tool4.description') },
 { icon: Heart, title: t('sm.tools.tool5.title'), description: t('sm.tools.tool5.description') },
 { icon: Lightbulb, title: t('sm.tools.tool6.title'), description: t('sm.tools.tool6.description') },
 { icon: Crosshair, title: t('sm.tools.tool7.title'), description: t('sm.tools.tool7.description') },
 { icon: Eye, title: t('sm.tools.tool8.title'), description: t('sm.tools.tool8.description') },
 { icon: FileText, title: t('sm.tools.tool9.title'), description: t('sm.tools.tool9.description') },
 ];
 
 const skills = [
 t('sm.system.skills.bedarfsanalyse'), t('sm.system.skills.einwandbehandlung'),
 t('sm.system.skills.closing'), t('sm.system.skills.empathie'),
 t('sm.system.skills.storytelling'), t('sm.system.skills.verhandlung'),
 ];
 
 const stats = [
 { number: t('sm.system.stat1.number'), label: t('sm.system.stat1.label') },
 { number: t('sm.system.stat2.number'), label: t('sm.system.stat2.label') },
 { number: t('sm.system.stat3.number'), label: t('sm.system.stat3.label') },
 { number: t('sm.system.stat4.number'), label: t('sm.system.stat4.label') },
 ];
 
 const faqs = [
 { q: t('sm.faq.q1'), a: t('sm.faq.a1') },
 { q: t('sm.faq.q2'), a: t('sm.faq.a2') },
 { q: t('sm.faq.q3'), a: t('sm.faq.a3') },
 { q: t('sm.faq.q4'), a: t('sm.faq.a4') },
 { q: t('sm.faq.q5'), a: t('sm.faq.a5') },
 ];
 
 return (
 <div className="min-h-screen bg-background">

 {/* Hero Section */}
 <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
 <div className="absolute inset-0 overflow-hidden">
 <motion.div
 className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl"
 animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
 transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
 />
 <motion.div
 className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl"
 animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
 transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
 />
 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
 </div>

 <div className="container relative z-10 py-16 lg:py-20">
 <div className="max-w-5xl mx-auto text-center">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
 <Sparkles className="w-4 h-4 text-blue-500" />
 <span className="text-sm font-medium text-blue-500">{t('sm.hero.badge')}</span>
 </motion.div>

 <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
 {t('sm.hero.headline1')}{' '}
 <span className="text-blue-500">{t('sm.hero.headline2')}</span>
 </motion.h1>

 <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
 className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
 {t('sm.hero.subheadline')}
 </motion.p>

 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
 className="flex flex-wrap justify-center gap-4 mb-10">
 <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg px-8 shadow-lg hover:shadow-xl transition-all"
 onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}>
 {t('sm.hero.cta.primary')}
 <ArrowRight className="w-5 h-5 ml-2" />
 </Button>
 <Button size="lg" variant="outline" className="font-bold text-lg px-8 border-2"
 onClick={() => document.getElementById('das-system')?.scrollIntoView({ behavior: 'smooth' })}>
 {t('sm.hero.cta.secondary')}
 </Button>
 </motion.div>

 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
 className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
 <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /><span>{t('sm.hero.trust1')}</span></div>
 <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /><span>{t('sm.hero.trust2')}</span></div>
 <div className="flex items-center gap-2"><Award className="w-4 h-4 text-blue-500" /><span>{t('sm.hero.trust3')}</span></div>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Crisis Section */}
 <section className="section-padding bg-secondary/30">
 <div className="container">
 <motion.div className="max-w-5xl mx-auto mb-12" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">{t('sm.crisis.headline')}</h2>
 <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t('sm.crisis.subheadline')}</p>

 <div className="grid md:grid-cols-3 gap-5 mb-12">
 {crisisStats.map((item, index) => (
 <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1, duration: 0.6 }}>
 <div className={`h-full rounded-2xl bg-gradient-to-br ${item.bgColor} to-transparent border ${item.borderColor} p-6 md:p-7 transition-all duration-300`}>
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">{item.persona}</div>
 <div className={`text-4xl md:text-5xl font-black ${item.color} mb-2`}>{item.number}</div>
 <div className="text-sm font-semibold text-foreground mb-2">{item.label}</div>
 <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>

 {/* Rules Changed */}
 <motion.div className="max-w-4xl mx-auto mb-12" {...fadeInUp}>
 <div className="rounded-2xl bg-card border border-border p-8 md:p-10">
 <h3 className="text-xl font-bold mb-4">{t('sm.rules.headline')}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t('sm.rules.text')}</p>
 <div className="grid md:grid-cols-2 gap-6">
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-16 text-center">
 <div className="text-3xl font-black text-blue-500">{t('sm.rules.stat1.number')}</div>
 <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">{t('sm.rules.stat1.source')}</div>
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground mb-1">{t('sm.rules.stat1.label')}</p>
 <p className="text-xs text-muted-foreground leading-relaxed">{t('sm.rules.stat1.text')}</p>
 </div>
 </div>
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-16 text-center">
 <div className="text-3xl font-black text-blue-500">{t('sm.rules.stat2.number')}</div>
 <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">{t('sm.rules.stat2.source')}</div>
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground mb-1">{t('sm.rules.stat2.label')}</p>
 <p className="text-xs text-muted-foreground leading-relaxed">{t('sm.rules.stat2.text')}</p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Symptoms */}
 <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
 <h3 className="text-lg font-semibold mb-4 text-center">{t('sm.symptoms.headline')}</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {symptoms.map((symptom, index) => (
 <div key={index} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-red-300 dark:hover:border-red-500/30 transition-colors">
 <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
 <symptom.icon className="w-4 h-4 text-red-400" />
 </div>
 <p className="text-xs text-muted-foreground leading-snug">{symptom.text}</p>
 </div>
 ))}
 </div>
 </motion.div>
 </div>
 </section>

 {/* Good News + Vision */}
 <section className="section-padding">
 <div className="container">
 <motion.div className="max-w-4xl mx-auto text-center mb-16" {...fadeInUp}>
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
 <CheckCircle2 className="w-4 h-4 text-green-500" />
 <span className="text-sm font-medium text-green-600 dark:text-green-400">{t('sm.goodnews.badge')}</span>
 </div>
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{t('sm.goodnews.headline')}</h2>
 <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
 {t('sm.goodnews.text')} <strong className="text-foreground">{t('sm.goodnews.highlight')}</strong>
 </p>
 </motion.div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
 {visionItems.map((item, index) => (
 <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.08, duration: 0.6 }}
 className="flex items-start gap-4 p-6 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/20 transition-colors">
 <item.icon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
 <p className="text-foreground leading-relaxed">{item.text}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Das System */}
 <section id="das-system" className="section-padding bg-secondary/30">
 <div className="container">
 <motion.div className="max-w-4xl mx-auto mb-16" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-center">{t('sm.system.headline')}</h2>
 <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center mb-4">{t('sm.system.subheadline')}</p>
 </motion.div>

 {/* Steps */}
 <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
 <motion.div {...fadeInUp}>
 <div className="relative h-full rounded-2xl bg-gradient-to-br from-blue-500/[0.08] via-blue-400/[0.03] to-transparent border border-blue-500/15 p-8 md:p-10 group hover:border-blue-500/30 transition-all duration-300">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
 <div className="relative">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
 <Target className="w-4 h-4 text-blue-500" />
 <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('sm.system.step1.badge')}</span>
 </div>
 <h3 className="text-2xl font-bold mb-3">{t('sm.system.step1.title')}</h3>
 <p className="text-muted-foreground leading-relaxed mb-6">
 {t('sm.system.step1.text')} <strong className="text-foreground">{t('sm.system.step1.highlight')}</strong> {t('sm.system.step1.textEnd')}
 </p>
 <div className="flex flex-wrap gap-1.5">
 {skills.map((skill) => (
 <span key={skill} className="text-[11px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">{skill}</span>
 ))}
 <span className="text-[11px] px-2.5 py-1 rounded-md bg-muted text-muted-foreground">{t('sm.system.skills.more')}</span>
 </div>
 </div>
 </div>
 </motion.div>

 <motion.div {...fadeInUp} transition={{ delay: 0.15, duration: 0.6 }}>
 <div className="relative h-full rounded-2xl bg-gradient-to-br from-green-500/[0.08] via-emerald-400/[0.03] to-transparent border border-green-500/15 p-8 md:p-10 group hover:border-green-500/30 transition-all duration-300">
 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
 <div className="relative">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-5">
 <Sparkles className="w-4 h-4 text-green-500" />
 <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">{t('sm.system.step2.badge')}</span>
 </div>
 <h3 className="text-2xl font-bold mb-3">{t('sm.system.step2.title')}</h3>
 <p className="text-muted-foreground leading-relaxed mb-6">
 {t('sm.system.step2.text')} <strong className="text-foreground">{t('sm.system.step2.highlight')}</strong> {t('sm.system.step2.textEnd')}
 </p>
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: t('sm.system.step2.ai'), color: 'bg-green-500' },
 { label: t('sm.system.step2.levels'), color: 'bg-blue-500' },
 { label: t('sm.system.step2.realtime'), color: 'bg-amber-500' },
 ].map((item) => (
 <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
 <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
 <span>{item.label}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </motion.div>
 </div>

 {/* Stats */}
 <motion.div className="max-w-4xl mx-auto mb-12" {...fadeInUp}>
 <div className="grid grid-cols-4 gap-4">
 {stats.map((stat, index) => (
 <div key={index} className="text-center p-4">
 <div className="text-3xl font-bold mb-0.5 text-blue-500">{stat.number}</div>
 <div className="text-xs text-muted-foreground">{stat.label}</div>
 </div>
 ))}
 </div>
 </motion.div>

 {/* Measures */}
 <motion.div className="max-w-5xl mx-auto mb-16" {...fadeInUp}>
 <p className="text-sm font-medium text-muted-foreground text-center mb-6 uppercase tracking-wider">{t('sm.system.measures')}</p>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {measures.map((feature, index) => (
 <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
 <feature.icon className="w-4 h-4 text-blue-500/70 flex-shrink-0" />
 <span className="text-xs text-muted-foreground leading-snug">{feature.text}</span>
 </div>
 ))}
 </div>
 </motion.div>

 {/* Results */}
 <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
 <h3 className="text-2xl font-bold mb-8 text-center">{t('sm.results.headline')}</h3>
 <div className="grid md:grid-cols-2 gap-4">
 {results.map((result, index) => (
 <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
 <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
 <p className="text-sm leading-relaxed">{result}</p>
 </div>
 ))}
 </div>
 </motion.div>
 </div>
 </section>

 {/* Tools */}
 <section className="section-padding">
 <div className="container">
 <motion.div className="max-w-4xl mx-auto text-center mb-16" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{t('sm.tools.headline')}</h2>
 <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{t('sm.tools.subheadline')}</p>
 </motion.div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
 {tools.map((tool, index) => (
 <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.06, duration: 0.6 }}>
 <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all">
 <CardContent className="p-6">
 <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
 <tool.icon className="w-6 h-6 text-blue-500" />
 </div>
 <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
 </CardContent>
 </Card>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Comparison: Zwei Wege */}
 <section className="section-padding bg-secondary/30">
 <div className="container">
 <motion.div className="max-w-4xl mx-auto text-center mb-16" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{t('sm.comparison.headline')}</h2>
 </motion.div>

 <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
 <motion.div {...fadeInUp}>
 <Card className="h-full border-0 shadow-md">
 <CardContent className="p-8">
 <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
 <Clock className="w-6 h-6 text-red-500" />
 </div>
 <h3 className="text-2xl font-bold mb-4">{t('sm.comparison.hard.title')}</h3>
 <p className="text-muted-foreground leading-relaxed">
 {t('sm.comparison.hard.text')} <strong className="text-foreground">{t('sm.comparison.hard.highlight')}</strong>{t('sm.comparison.hard.textEnd')}
 </p>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div {...fadeInUp} transition={{ delay: 0.1, duration: 0.6 }}>
 <Card className="h-full border-2 border-blue-500/30 shadow-md">
 <CardContent className="p-8">
 <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
 <Zap className="w-6 h-6 text-blue-500" />
 </div>
 <h3 className="text-2xl font-bold mb-4">{t('sm.comparison.easy.title')}</h3>
 <p className="text-muted-foreground leading-relaxed">
 {t('sm.comparison.easy.text')} <strong className="text-foreground">{t('sm.comparison.easy.highlight')}</strong> {t('sm.comparison.easy.textEnd')}
 </p>
 </CardContent>
 </Card>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Platinum */}
 <section className="section-padding">
 <div className="container">
 <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
 <div className="relative rounded-2xl overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
 
 <div className="relative p-8 md:p-12">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
 <Award className="w-7 h-7 text-white" />
 </div>
 <div>
 <h2 className="text-2xl md:text-3xl font-bold text-white">{t('sm.platinum.title')}</h2>
 <div className="inline-flex items-center gap-1.5 mt-1">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
 <span className="text-sm text-blue-200">{t('sm.platinum.badge')}</span>
 </div>
 </div>
 </div>

 <div className="grid md:grid-cols-2 gap-6">
 <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-6 border border-white/10">
 <h3 className="font-semibold text-white/90 text-sm uppercase tracking-wider mb-4">{t('sm.platinum.services.headline')}</h3>
 <div className="space-y-4">
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-blue-100/80 leading-relaxed">{t('sm.platinum.services.item1')}</p>
 </div>
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-blue-100/80 leading-relaxed">{t('sm.platinum.services.item2')}</p>
 </div>
 </div>
 </div>
 <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-6 border border-white/10">
 <h3 className="font-semibold text-white/90 text-sm uppercase tracking-wider mb-4">{t('sm.platinum.benefits.headline')}</h3>
 <div className="space-y-4">
 <div className="flex items-start gap-3">
 <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-blue-100/80 leading-relaxed">{t('sm.platinum.benefits.item1')}</p>
 </div>
 <div className="flex items-start gap-3">
 <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-blue-100/80 leading-relaxed">{t('sm.platinum.benefits.item2')}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 </section>

 {/* ROI Calculator */}
 <section id="roi-rechner" className="section-padding bg-secondary/30">
 <div className="container">
 <motion.div className="max-w-3xl mx-auto text-center mb-12" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('sm.roi.headline')}</h2>
 <p className="text-lg text-muted-foreground leading-relaxed">{t('sm.roi.subheadline')}</p>
 </motion.div>

 <motion.div className="max-w-3xl mx-auto" {...fadeInUp}>
 <Card className="border-0 shadow-md">
 <CardContent className="p-8 md:p-10">
 <div className="space-y-8">
 <div>
 <div className="flex justify-between mb-3">
 <label className="text-sm font-semibold flex items-center gap-2">
 <Users className="w-4 h-4 text-blue-500" />{t('sm.roi.salespeople')}
 </label>
 <span className="text-lg font-bold text-blue-500">{salespeople}</span>
 </div>
 <Slider value={[salespeople]} onValueChange={(value) => setSalespeople(value[0])} min={1} max={50} step={1} className="w-full" />
 </div>

 <div>
 <div className="flex justify-between mb-3">
 <label className="text-sm font-semibold flex items-center gap-2">
 <Target className="w-4 h-4 text-blue-500" />{t('sm.roi.dealvalue')}
 </label>
 <span className="text-lg font-bold text-blue-500">{formatCurrency(dealValue)}</span>
 </div>
 <Slider value={[dealValue]} onValueChange={(value) => setDealValue(value[0])} min={1000} max={100000} step={1000} className="w-full" />
 </div>

 <div>
 <div className="flex justify-between mb-3">
 <label className="text-sm font-semibold flex items-center gap-2">
 <Calendar className="w-4 h-4 text-blue-500" />{t('sm.roi.meetings')}
 </label>
 <span className="text-lg font-bold text-blue-500">{meetingsPerMonth}</span>
 </div>
 <Slider value={[meetingsPerMonth]} onValueChange={(value) => setMeetingsPerMonth(value[0])} min={1} max={20} step={1} className="w-full" />
 </div>

 <div className="pt-6 border-t border-border">
 <p className="text-muted-foreground text-sm mb-3">{t('sm.roi.explanation')}</p>
 <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-3">{formatCurrency(missedRevenue)}</div>
 <p className="text-sm text-muted-foreground">{t('sm.roi.footnote')}</p>
 </div>
 </div>
 </CardContent>
 </Card>

 <div className="text-center mt-8">
 <p className="text-sm text-muted-foreground mb-4">{t('sm.roi.cta.text')}</p>
 <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
 onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}>
 {t('sm.roi.cta.button')}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </motion.div>
 </div>
 </section>

 {/* FAQ */}
 <section id="faq" className="section-padding">
 <div className="container max-w-4xl">
 <motion.div className="text-center mb-12" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl font-bold">{t('sm.faq.headline')}</h2>
 </motion.div>

 <motion.div {...fadeInUp}>
 <Accordion type="single" collapsible className="space-y-3">
 {faqs.map((faq, index) => (
 <AccordionItem key={index} value={`item-${index + 1}`} className="border border-border rounded-xl px-6 bg-card">
 <AccordionTrigger className="text-base font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
 <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
 </motion.div>
 </div>
 </section>

 {/* Final CTA */}
 <section className="section-padding relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10" />
 <div className="container relative">
 <motion.div className="max-w-4xl mx-auto text-center" {...fadeInUp}>
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{t('sm.finalcta.headline')}</h2>
 <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">{t('sm.finalcta.text')}</p>
 <p className="text-lg font-semibold mb-10">{t('sm.finalcta.tagline')}</p>

 <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg px-10 py-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
 onClick={() => window.open('https://calendly.com/markuseilers/kennenlernen', '_blank')}>
 <Calendar className="w-5 h-5 mr-2" />
 {t('sm.finalcta.button')}
 </Button>

 <p className="text-sm mt-6 text-muted-foreground">{t('sm.finalcta.footnote')}</p>
 </motion.div>
 </div>
 </section>
 </div>
 );
 }
