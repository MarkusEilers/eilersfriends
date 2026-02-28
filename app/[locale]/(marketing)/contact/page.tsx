
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MapPin, Send, Clock, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations, useLocale } from 'next-intl';

export default function Contact() {
  const t = useTranslations('Contact');
  const locale = useLocale();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // TODO: Implement API route for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // TODO: Replace with actual API call to /api/contact
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.message || t('form.submitError'));
      }
    } catch (error) {
      setSubmitError(t('form.submitError'));
    }

    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-medium mb-6">
              {t('title')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('subtitle')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('description')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
            {/* Contact Form - Now First (Left/Top) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-card rounded-2xl p-8 border border-border">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#0096FF]/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-[#0096FF]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{t('success.title')}</h3>
                    <p className="text-muted-foreground mb-8">{t('success.message')}</p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      {t('success.another')}
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('form.name')}</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('form.email')}</label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t('form.company')}</label>
                      <Input
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t('form.subject')}</label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t('form.message')}</label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="rounded-xl resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                        {submitError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full btn-primary rounded-xl py-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t('form.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {t('form.submit')}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Sidebar - Strategy Call & Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Strategy Call CTA - Now Second */}
              <div className="bg-gradient-to-br from-brand to-brand/80 rounded-2xl p-8 text-white">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {t('strategy.title')}
                </h3>
                <p className="text-white/80 mb-6">
                  {t('strategy.description')}
                </p>
                <Link href={`/${locale}/booking`} passHref>
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full bg-white text-brand hover:bg-white/90 rounded-xl"
                  >
                    <span>{t('strategy.button')}</span>
                  </Button>
                </Link>
              </div>

              {/* Contact Info - Now First */}
              <div className="bg-card rounded-2xl p-8 border border-border">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{t('info.emailTitle')}</h4>
                      <a href={`mailto:${t('contact.email')}`} className="text-muted-foreground hover:text-brand transition-colors">
                        {t('contact.email')}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{t('info.addressTitle')}</h4>
                      <p className="text-muted-foreground">{t('contact.address')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{t('info.hoursTitle')}</h4>
                      <p className="text-muted-foreground">{t('contact.hours')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
