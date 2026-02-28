"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

// Cookie name for storing consent
const CONSENT_COOKIE_NAME = 'ef_cookie_consent';
const CONSENT_COOKIE_DAYS = 365;

// Generate a unique visitor ID
function generateVisitorId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get or create visitor ID from localStorage
function getVisitorId(): string {
  const stored = localStorage.getItem('ef_visitor_id');
  if (stored) return stored;
  
  const newId = generateVisitorId();
  localStorage.setItem('ef_visitor_id', newId);
  return newId;
}

// Cookie helper functions
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Consent data structure stored in cookie
interface ConsentData {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export default function CookieBanner() {
  const t = useTranslations();
  const locale = useLocale();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMiniBanner, setShowMiniBanner] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  
  // Consent states
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  // TODO: Replace with API route
  // const saveConsentMutation = trpc.cookieConsent.save.useMutation();

  useEffect(() => {
    const id = getVisitorId();
    setVisitorId(id);
    
    const consentCookie = getCookie(CONSENT_COOKIE_NAME);
    if (consentCookie) {
      try {
        const consent: ConsentData = JSON.parse(consentCookie);
        setAnalyticsConsent(consent.analytics);
        setMarketingConsent(consent.marketing);
        setShowBanner(false);
        setShowMiniBanner(true);
      } catch {
        setShowBanner(true);
        setShowMiniBanner(false);
      }
    } else {
      setShowBanner(true);
      setShowMiniBanner(false);
    }
  }, []);

  const handleAcceptAll = async () => {
    setAnalyticsConsent(true);
    setMarketingConsent(true);
    await saveConsent(true, true);
    setShowBanner(false);
    setShowSettings(false);
    setShowMiniBanner(true);
  };

  const handleAcceptEssential = async () => {
    setAnalyticsConsent(false);
    setMarketingConsent(false);
    await saveConsent(false, false);
    setShowBanner(false);
    setShowSettings(false);
    setShowMiniBanner(true);
  };

  const handleSaveSettings = async () => {
    await saveConsent(analyticsConsent, marketingConsent);
    setShowBanner(false);
    setShowSettings(false);
    setShowMiniBanner(true);
  };

  const handleOptOut = async () => {
    setAnalyticsConsent(false);
    setMarketingConsent(false);
    await saveConsent(false, false);
    setShowBanner(false);
    setShowSettings(false);
    setShowMiniBanner(true);
  };

  const saveConsent = async (analytics: boolean, marketing: boolean) => {
    const consentData: ConsentData = {
      essential: true,
      analytics,
      marketing,
      timestamp: Date.now(),
    };
    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(consentData), CONSENT_COOKIE_DAYS);
    
    // TODO: Replace with API route
    /*
    try {
      await saveConsentMutation.mutateAsync({
        visitorId,
        essentialConsent: true,
        analyticsConsent: analytics,
        marketingConsent: marketing,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
    */
  };

  const openCookieSettings = () => {
    setShowSettings(true);
    setShowBanner(true);
    setShowMiniBanner(false);
  };

  useEffect(() => {
    (window as any).openCookieSettings = openCookieSettings;
    return () => {
      delete (window as any).openCookieSettings;
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {showMiniBanner && !showBanner && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 z-[99]"
          >
            <Button
              onClick={openCookieSettings}
              variant="outline"
              size="sm"
              className="rounded-full bg-card shadow-lg border-border hover:bg-secondary group"
            >
              <Cookie className="w-4 h-4 mr-2 text-brand group-hover:rotate-12 transition-transform" />
              <span className="text-xs">
                {locale === 'de' ? 'Cookie-Einstellungen' : 'Cookie Settings'}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBanner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => {
                const consentCookie = getCookie(CONSENT_COOKIE_NAME);
                if (consentCookie) {
                  setShowBanner(false);
                  setShowSettings(false);
                  setShowMiniBanner(true);
                }
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] p-4 md:p-6"
            >
              <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="p-6 pb-4 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                        <Cookie className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          {locale === 'de' ? 'Cookie-Einstellungen' : 'Cookie Settings'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {locale === 'de' 
                            ? 'Wir respektieren Ihre Privatsphäre' 
                            : 'We respect your privacy'}
                        </p>
                      </div>
                    </div>
                    {getCookie(CONSENT_COOKIE_NAME) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowBanner(false);
                          setShowSettings(false);
                          setShowMiniBanner(true);
                        }}
                        className="rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {!showSettings ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {locale === 'de' 
                          ? 'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Einige Cookies sind notwendig für den Betrieb der Website, während andere uns helfen, die Website zu analysieren und zu verbessern.'
                          : 'We use cookies to enhance your experience on our website. Some cookies are necessary for the website to function, while others help us analyze and improve the site.'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'de' 
                          ? 'Weitere Informationen finden Sie in unserer '
                          : 'For more information, please see our '}
                        <Link href={`/${locale}/datenschutz`} className="text-brand hover:underline">
                          {locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
                        </Link>.
                      </p>
                      
                      {getCookie(CONSENT_COOKIE_NAME) && (
                        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            {locale === 'de' ? 'Aktueller Status: Sie haben der Verwendung von Analyse- und Marketing-Cookies zugestimmt. Sie können Ihre Einstellungen jederzeit ändern.' : 'Current status: You have consented to the use of analytics and marketing cookies. You can change your settings at any time.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Essenzielle Cookies</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {locale === 'de' ? 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.' : 'These cookies are essential for the basic functions of the website and cannot be disabled.'}
                          </p>
                        </div>
                        <Switch checked disabled className="ml-auto" />
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-lg border border-transparent hover:border-border transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Analyse-Cookies</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {locale === 'de' ? 'Diese Cookies helfen uns, die Nutzung der Website zu analysieren, um die Leistung zu verbessern.' : 'These cookies help us analyze website usage to improve performance.'}
                          </p>
                        </div>
                        <Switch checked={analyticsConsent} onCheckedChange={setAnalyticsConsent} className="ml-auto" />
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-lg border border-transparent hover:border-border transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Marketing-Cookies</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {locale === 'de' ? 'Diese Cookies werden verwendet, um Ihnen relevante Werbung auf anderen Plattformen anzuzeigen.' : 'These cookies are used to show you relevant advertising on other platforms.'}
                          </p>
                        </div>
                        <Switch checked={marketingConsent} onCheckedChange={setMarketingConsent} className="ml-auto" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-secondary/30 border-t border-border">
                  {!showSettings ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button onClick={handleAcceptAll} className="w-full sm:w-auto flex-1">Alle akzeptieren</Button>
                      <Button onClick={handleAcceptEssential} variant="secondary" className="w-full sm:w-auto flex-1">Nur essenzielle</Button>
                      <Button onClick={() => setShowSettings(true)} variant="ghost" className="w-full sm:w-auto text-xs">Einstellungen</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button onClick={handleSaveSettings} className="w-full sm:w-auto flex-1">Einstellungen speichern</Button>
                      <Button onClick={handleAcceptAll} variant="secondary" className="w-full sm:w-auto flex-1">Alle akzeptieren</Button>
                      {getCookie(CONSENT_COOKIE_NAME) && (
                        <Button onClick={handleOptOut} variant="destructive" className="w-full sm:w-auto text-xs">Opt-Out</Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

