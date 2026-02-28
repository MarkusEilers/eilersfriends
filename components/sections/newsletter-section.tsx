"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, AlertCircle, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

export default function NewsletterSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // TODO: Replace with API route mutation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !email) return;
    
    setStatus('submitting');
    setErrorMessage('');

    // TODO: API call logic here
    console.log("Submitting:", { name, email, agreed });
    // Mock success after 2 seconds
    setTimeout(() => {
        setStatus('pending');
    }, 2000);
  };

  const resetForm = () => {
    setStatus('idle');
    setName('');
    setEmail('');
    setAgreed(false);
    setErrorMessage('');
  };

  return (
    <section id="newsletter" className="py-20 bg-brand">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-white/80 text-sm font-medium mb-4 block">
              {t('newsletter.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              {t('newsletter.headline')}
            </h2>
            <p className="text-white/80 text-lg">
              {t('newsletter.description')}
            </p>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Pending Confirmation State */}
            {status === 'pending' && (
              <div className="bg-white rounded-2xl p-8 md:p-10 text-center">
                <div className="w-16 h-16 bg-[#0096FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck className="w-8 h-8 text-[#0096FF]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {locale === 'de' ? 'Fast geschafft!' : 'Almost there!'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {locale === 'de' 
                    ? 'Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link in der E-Mail, um deine Anmeldung abzuschließen.'
                    : 'We have sent you a confirmation email. Please click the link in the email to complete your subscription.'}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {locale === 'de' 
                    ? 'Überprüfe auch deinen Spam-Ordner, falls du die E-Mail nicht findest.'
                    : 'Check your spam folder if you don\'t see the email.'}
                </p>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="rounded-full"
                >
                  {locale === 'de' ? 'Andere E-Mail verwenden' : 'Use different email'}
                </Button>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="bg-white rounded-2xl p-8 md:p-10 text-center">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('newsletter.success.title')}
                </h3>
                <p className="text-gray-600">
                  {t('newsletter.success.message')}
                </p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="bg-white rounded-2xl p-8 md:p-10 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {locale === 'de' ? 'Fehler bei der Anmeldung' : 'Subscription Error'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {errorMessage}
                </p>
                <Button
                  onClick={resetForm}
                  className="btn-primary rounded-full"
                >
                  {locale === 'de' ? 'Erneut versuchen' : 'Try again'}
                </Button>
              </div>
            )}

            {/* Form State */}
            {(status === 'idle' || status === 'submitting') && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 md:p-10 shadow-xl">
                <div className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <Input
                      type="text"
                      placeholder={t('newsletter.placeholder.name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-14 px-5 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:border-brand focus:ring-brand"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <Input
                      type="email"
                      placeholder={t('newsletter.placeholder.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 px-5 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:border-brand focus:ring-brand"
                      required
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="privacy"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      className="mt-1 border-gray-300 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                    />
                    <label 
                      htmlFor="privacy" 
                      className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                    >
                      {t('newsletter.privacy')}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!agreed || !email || status === 'submitting'}
                    className="w-full h-14 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {status === 'submitting' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('newsletter.submitting')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <span>{t('newsletter.button')}</span>
                      </div>
                    )}
                  </Button>

                  {/* Double Opt-In Info */}
                  <p className="text-xs text-gray-500 text-center">
                    {locale === 'de' 
                      ? 'Du erhältst eine Bestätigungs-E-Mail zur Verifizierung deiner Anmeldung.'
                      : 'You will receive a confirmation email to verify your subscription.'}
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

