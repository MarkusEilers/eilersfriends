/**
 * Welsh-Style Program-LP-Bauplan
 *
 * Modelliert nach Justin Welshs "Creator MBA" (learn.justinwelsh.me/creator).
 * 15 Sektionen in der bewährten Reihenfolge mit Content-Placeholdern.
 *
 * Verwendung: `createLandingPageFromTemplate('program-welsh', { … overrides … })`
 * legt eine neue Landing Page in der DB an und befüllt alle Sektionen mit
 * den Defaults. Inhalte können danach im Admin-Editor pro Sektion editiert
 * werden — alle als JSON in landingPageSections.content.
 */

export type SectionTypeKey =
  | 'hero'
  | 'video'
  | 'social_proof'
  | 'problem'
  | 'origin_story'
  | 'solution'
  | 'features'
  | 'how_it_works'
  | 'curriculum'
  | 'bonus_deliverables'
  | 'fit_check'
  | 'testimonials'
  | 'tweet_wall'
  | 'framework_steps'
  | 'lead_magnet'
  | 'offer'
  | 'pricing_card'
  | 'risk_reversal'
  | 'faq'
  | 'email_capture'
  | 'cta'
  | 'coach_bio'
  | 'spacer'

export interface TemplateSection {
  type: SectionTypeKey
  content: Record<string, unknown>
}

export interface LpTemplate {
  key: string
  name: string
  description: string
  accentColor: string
  defaultTitle: string
  defaultSlug: string
  defaultMetaDescription: string
  sections: TemplateSection[]
}

export const programWelshTemplate: LpTemplate = {
  key: 'program-welsh',
  name: 'Programm-LP (Welsh-Style)',
  description:
    'Modelliert nach Justin Welshs Creator MBA. 15 Sektionen für ein Self-Paced-Programm mit Curriculum, Bonus-Deliverables, Fit-Check und Single-Tier-Pricing.',
  accentColor: '#1A5FD4',
  defaultTitle: '[Programm-Name]',
  defaultSlug: 'neues-programm',
  defaultMetaDescription:
    'Kurzer SEO-Description-Satz mit dem Hauptversprechen des Programms.',
  sections: [
    // 1. HERO — Big headline, single CTA, optional supporting line
    {
      type: 'hero',
      content: {
        eyebrow: 'PROGRAMM · KOHORTE [Datum]',
        headline: 'Baue [Outcome] in [Zeitrahmen].',
        subheadline:
          '[Programm-Name] liefert den vollständigen Bauplan, um [Hauptversprechen]. Für [Zielgruppe], die [konkrete Veränderung] erreichen wollen.',
        ctaLabel: 'Jetzt anschauen',
        ctaHref: '#pricing',
        secondaryCtaLabel: 'Was du lernst',
        secondaryCtaHref: '#curriculum',
      },
    },

    // 2. ORIGIN STORY — Long-form narrative problem-to-solution
    {
      type: 'origin_story',
      content: {
        eyebrow: 'Die Geschichte',
        headline: 'Es war einmal …',
        paragraphs: [
          'Früher hattest du einen klar abgesteckten Job. Stunden gegen Geld. Kalender gegen Wochenende. Deine Fähigkeiten in einer Box, deine Ambitionen in einem Jahresgespräch.',
          'Heute sieht es anders aus. Die gleichen Fähigkeiten, gepaart mit den richtigen Hebeln, werden zu einem profitablen Geschäft. Doch viele scheitern auf dem Weg — verloren in einem Wirrwarr aus Tools, Taktiken und Hacks.',
          'Genau hier setzt [Programm-Name] an: ein zusammenhängender Bauplan, statt fragmentierter YouTube-Schnipsel.',
        ],
        pullquote: '[Optionales Pullquote, das den Punkt verdichtet.]',
      },
    },

    // 3. WHAT YOU'LL LEARN — promise overview (uses 'features' renderer)
    {
      type: 'features',
      content: {
        eyebrow: 'Was du lernst',
        headline:
          'Alles, was du brauchst, um [Outcome] zu erreichen.',
        subheadline:
          '[Programm-Name] ist ein vollständiges System — keine Theorie-Sammlung, kein Kurs-Mosaik. Praxiserprobte Frameworks, die du sofort anwenden kannst.',
        items: [
          { title: 'Schritt 1: [Name]', description: '[Kurzbeschreibung]' },
          { title: 'Schritt 2: [Name]', description: '[Kurzbeschreibung]' },
          { title: 'Schritt 3: [Name]', description: '[Kurzbeschreibung]' },
          { title: 'Schritt 4: [Name]', description: '[Kurzbeschreibung]' },
        ],
      },
    },

    // 4. SOCIAL PROOF — big-name testimonials / logos
    {
      type: 'social_proof',
      content: {
        eyebrow: 'Was Brancheninsider sagen',
        headline:
          'Was [Branche]-Insider über [Programm-Name] sagen',
        items: [
          {
            quote:
              '[Aussagekräftiges Zitat von einem bekannten Namen aus der Branche.]',
            name: '[Vor- + Nachname]',
            role: '[Position] @ [Firma]',
          },
          {
            quote: '[Zitat #2 — anderer Aspekt]',
            name: '[Name]',
            role: '[Rolle]',
          },
          {
            quote: '[Zitat #3]',
            name: '[Name]',
            role: '[Rolle]',
          },
        ],
      },
    },

    // 5. CURRICULUM — chapter / module breakdown
    {
      type: 'curriculum',
      content: {
        eyebrow: 'Was drin ist',
        headline: 'Alle Kapitel im Detail',
        subheadline:
          '[N] Kapitel · [M] Lessons · komplett selbstgesteuert.',
        modules: [
          {
            title: '01. [Kapitel-Name]',
            description: '[Was lernst du in diesem Kapitel? 2-3 Sätze.]',
            lessons: 8,
          },
          { title: '02. [Kapitel-Name]', description: '[Beschreibung]', lessons: 7 },
          { title: '03. [Kapitel-Name]', description: '[Beschreibung]', lessons: 9 },
          { title: '04. [Kapitel-Name]', description: '[Beschreibung]', lessons: 6 },
          { title: '05. [Kapitel-Name]', description: '[Beschreibung]', lessons: 8 },
        ],
      },
    },

    // 6. BONUS DELIVERABLES — More than just theory
    {
      type: 'bonus_deliverables',
      content: {
        eyebrow: 'Mehr als nur Theorie',
        headline: '[Programm-Name] enthält mehr als nur Videos',
        subheadline:
          'Ich habe [Programm-Name] mit Bonus-Materialien aufgebaut, damit du wirklich umsetzt — nicht nur konsumierst.',
        items: [
          {
            badge: 'Tool',
            title: '[Tool-Name, z.B. Notion-Workstation]',
            description:
              'Templates, Vorlagen und Frameworks für die direkte Anwendung im Tagesgeschäft.',
          },
          {
            badge: 'Bonus',
            title: '[Bonus-Mini-Kurs-Name]',
            description:
              'Wenn du komplett neu bist: ein zusätzlicher Mini-Kurs, der dich auf den Stand bringt.',
          },
          {
            badge: 'Update',
            title: 'Lifetime Updates',
            description:
              'Jede neue Lesson, jedes neue Tool — du bekommst alles automatisch und kostenfrei.',
          },
        ],
      },
    },

    // 7. FIT CHECK — good fit / not good fit
    {
      type: 'fit_check',
      content: {
        eyebrow: 'Passt das zu dir?',
        headline: 'Nicht jede:r ist die richtige Person für [Programm-Name].',
        goodFitTitle: 'Du bist genau richtig hier, wenn …',
        goodFit: [
          'Du verstehst, dass dieses Programm ein Werkzeug ist — und du es nutzen musst.',
          'Du bist bereit, deine bisherigen Annahmen zu hinterfragen oder zu pivotieren.',
          'Du weißt: Geduld + tägliches Dranbleiben gehört zur Wahrheit dazu.',
          'Du übernimmst Verantwortung statt Ausreden zu suchen.',
          'Du bist offen, Geld in deine eigene Weiterbildung zu investieren.',
        ],
        notGoodFitTitle: 'Eher nicht für dich, wenn …',
        notGoodFit: [
          'Du suchst eine Sofort-Lösung ohne Eigenarbeit.',
          'Du erwartest, dass jemand das Tun für dich übernimmt.',
          'Du willst nur konsumieren und nichts umsetzen.',
          'Du bist nicht bereit, in [N] Wochen / Monaten dabei zu bleiben.',
        ],
      },
    },

    // 8. STUDENT TESTIMONIALS — 5-star reviews from real users
    {
      type: 'testimonials',
      content: {
        eyebrow: 'Was Teilnehmer:innen sagen',
        headline: 'Stimmen aus der Community',
        items: [
          {
            quote:
              '[Konkretes Vorher/Nachher-Zitat — am besten mit Zahl oder spezifischem Outcome.]',
            name: '[Name]',
            role: '[Rolle/Branche]',
            rating: 5,
          },
          {
            quote: '[Zweites Zitat — anderer Aspekt der Transformation.]',
            name: '[Name]',
            role: '[Rolle]',
            rating: 5,
          },
          {
            quote: '[Drittes Zitat]',
            name: '[Name]',
            role: '[Rolle]',
            rating: 5,
          },
        ],
      },
    },

    // 9. PRICING CARD — single price point, all-inclusive
    {
      type: 'pricing_card',
      content: {
        eyebrow: 'Bereit?',
        headline: 'Komm zu [Programm-Name]',
        badge: 'Soft-Launch · Limitierte Plätze',
        title: '[Programm-Name]',
        subtitle: '[Optionaler Untertitel — z.B. "Vollständiger Zugang"]',
        price: '€[Preis]',
        priceLabel: 'einmalig · netto',
        includes: [
          '[N] Kapitel mit insgesamt [M] Lessons',
          'Bonus: [Bonus-Material 1]',
          'Bonus: [Bonus-Material 2]',
          'Bonus: [Bonus-Material 3]',
          'Lifetime Updates',
          'Lifetime Access',
        ],
        ctaLabel: 'Jetzt bewerben',
        ctaHref: '/kontakt',
        fineprint:
          'Konditionen werden im Bewerbungsgespräch transparent gemacht.',
      },
    },

    // 10. RISK REVERSAL — guarantee or no-refund explanation
    {
      type: 'risk_reversal',
      content: {
        eyebrow: 'Garantie',
        headline: '[N]-Tage 100 % Geld-zurück-Garantie',
        paragraphs: [
          'Wenn du nach [N] Tagen keine messbaren Verbesserungen in deinen [KPI/Bereich] siehst, erstatten wir die volle Investition zurück. Keine Fragen gestellt.',
          '[Optionaler zweiter Absatz: Vertrauensaufbau, Hinweis auf Reputation, Erwartungsmanagement.]',
        ],
      },
    },

    // 11. INSTRUCTOR — Coach bio
    {
      type: 'coach_bio',
      content: {
        eyebrow: 'Wer dahinter steht',
        name: '[Coach-Name]',
        role: '[Position / Disziplin]',
        photoUrl: '/markus-photo.jpg',
        bio: '[2-3 Absätze: Hintergrund, was hat er/sie gebaut, warum dieses Programm. Persönlich + glaubwürdig statt resume-style.]',
        socials: {
          linkedin: 'https://linkedin.com/in/...',
          youtube: 'https://youtube.com/@...',
        },
      },
    },

    // 12. FAQ
    {
      type: 'faq',
      content: {
        headline: 'Häufige Fragen',
        items: [
          {
            q: 'Für wen ist [Programm-Name] geeignet?',
            a: '[Antwort — wer ist die Zielgruppe konkret?]',
          },
          {
            q: 'Wie viel Zeit muss ich investieren?',
            a: '[Antwort — Stunden pro Woche, Gesamtdauer.]',
          },
          {
            q: 'Was passiert, wenn ich keine Ergebnisse sehe?',
            a: '[Antwort — Garantie-Bedingungen.]',
          },
          {
            q: 'Bekomme ich Zugang zu Updates?',
            a: '[Antwort — Lifetime / begrenzt?]',
          },
          {
            q: 'Wie unterscheidet sich [Programm-Name] von anderen Angeboten?',
            a: '[Antwort — was ist die Differenzierung?]',
          },
        ],
      },
    },

    // 13. FINAL CTA
    {
      type: 'cta',
      content: {
        headline: 'Baue [Outcome] in [Zeitrahmen].',
        body:
          'Letzte Chance, vor dem nächsten [Cohort/Preisstufe/Stichtag] dabei zu sein.',
        ctaLabel: 'Jetzt anschauen',
        ctaHref: '#pricing',
      },
    },
  ],
}

/**
 * Registry — wenn weitere Templates dazukommen (Coaching, Event, Mastermind),
 * hier registrieren und Admin kann zwischen Templates wählen.
 */
export const lpTemplates: Record<string, LpTemplate> = {
  [programWelshTemplate.key]: programWelshTemplate,
}

/**
 * Newsletter-Subscribe-Template (Welsh-Style)
 * Modelliert nach justinwelsh.me/subscribe — schlanke 5-Sektion-Page,
 * fokussiert auf Email-Capture, mit heavy Social-Proof (Tweet-Wall).
 */
export const newsletterWelshTemplate: LpTemplate = {
  key: 'newsletter-welsh',
  name: 'Newsletter-Subscribe (Welsh-Style)',
  description:
    'Modelliert nach Justin Welshs Saturday-Solopreneur-Subscribe-Page. 5 Sektionen, fokussiert auf Email-Capture, Tweet-Wall als Social-Proof-Wand.',
  accentColor: '#F05A1A',
  defaultTitle: '[Newsletter-Name]',
  defaultSlug: 'newsletter-subscribe',
  defaultMetaDescription:
    'Abonniere [Newsletter-Name] und bekomme [Frequenz] [Format] zu [Thema] direkt in dein Postfach.',
  sections: [
    // 1. HERO — Headline + immediate email form + trust line
    {
      type: 'hero',
      content: {
        headline:
          'Eine [Frequenz]-Mail, die dich [Outcome] verstehen lässt.',
        subheadline:
          'Abonniere von [N]+ Leser:innen, die ihre Woche mit einem [Min]-Minuten-Essay zu [Thema] starten.',
        showEmailForm: true,
        ctaLabel: 'Jetzt abonnieren',
        finePrint:
          'Kein Spam. Kein Verkauf deiner Daten. Abmeldung mit einem Klick.',
      },
    },

    // 2. FEATURED TESTIMONIALS — 2-3 prominent quotes from notable people
    {
      type: 'testimonials',
      content: {
        eyebrow: 'Was Leser sagen',
        items: [
          {
            quote:
              '[Konkretes, prominent platziertes Zitat einer bekannten Person.]',
            name: '[Vor- + Nachname]',
            role: '[Position] @ [Firma]',
          },
          {
            quote:
              '[Zweites Zitat — anderer Aspekt, z.B. praktischer Nutzen.]',
            name: '[Name]',
            role: '[Rolle]',
          },
        ],
      },
    },

    // 3. TWEET WALL — Social proof carousel (NEW)
    {
      type: 'tweet_wall',
      content: {
        eyebrow: 'Aus der Community',
        headline: 'Was Leser im Netz teilen',
        subheadline:
          'Echte Reaktionen aus LinkedIn, X & Co — keine Cherry-Picking-Reviews.',
        tweets: [
          {
            handle: '@nutzername1',
            name: 'Vorname Nachname',
            body: '[Kurzer Tweet, der den Newsletter empfiehlt — 1-3 Sätze, gerne mit Aufzählung.]',
            date: 'X. Monat YYYY',
          },
          {
            handle: '@nutzername2',
            name: 'Vorname Nachname',
            body: '[Zweiter Tweet — anderer Tonfall, anderes Argument.]',
            date: 'X. Monat YYYY',
          },
          {
            handle: '@nutzername3',
            name: 'Vorname Nachname',
            body: '[Dritter Tweet]',
            date: 'X. Monat YYYY',
          },
          {
            handle: '@nutzername4',
            name: 'Vorname Nachname',
            body: '[Vierter Tweet]',
            date: 'X. Monat YYYY',
          },
          {
            handle: '@nutzername5',
            name: 'Vorname Nachname',
            body: '[Fünfter Tweet]',
            date: 'X. Monat YYYY',
          },
          {
            handle: '@nutzername6',
            name: 'Vorname Nachname',
            body: '[Sechster Tweet]',
            date: 'X. Monat YYYY',
          },
        ],
      },
    },

    // 4. PROMISE / WHY SUBSCRIBE — what you'll get
    {
      type: 'solution',
      content: {
        eyebrow: 'Worum es geht',
        headline:
          '[Ein-Satz-Versprechen, das auf Freedom / Outcome zielt.]',
        subheadline:
          '[Optional: 1-2 Sätze, die das Versprechen vertiefen.]',
        items: [
          {
            title: '[Vorteil 1]',
            description: '[Konkret + spezifisch — kein Marketing-Schwafel.]',
          },
          { title: '[Vorteil 2]', description: '[Beschreibung]' },
          { title: '[Vorteil 3]', description: '[Beschreibung]' },
        ],
      },
    },

    // 5. EMAIL CAPTURE — final form (already exists as standalone block)
    {
      type: 'email_capture',
      content: {
        headline: 'Abonniere und leg los.',
        subtext:
          'Schließ dich [N]+ Leser:innen an, die ihre Woche mit einem [Min]-Minuten-Essay zu [Thema] starten. Ich werde nie spammen oder deine Daten verkaufen. Punkt.',
      },
    },
  ],
}

// Register the new template
lpTemplates[newsletterWelshTemplate.key] = newsletterWelshTemplate

/**
 * Framework / HVCO Lead-Magnet Template
 * Für jede einzelne Methode/Tool/Bauplan (z.B. Beef Radar, Elevator Pitch 2.0).
 * Email-gated: Inhalt sichtbar als Teaser, Download/Workbook nach Email-Capture.
 * Triple-purpose: 1) Sales-Frameworks  2) Mental Models  3) Mini-Kurse / Schritt-für-Schritt-Baupläne.
 */
export const frameworkLeadMagnetTemplate: LpTemplate = {
  key: 'framework-leadmagnet',
  name: 'Framework / HVCO (Lead-Magnet)',
  description:
    'Wiederverwendbare Struktur für jedes Framework: Hero mit Promise, Problem-Frame, Schritte, Lead-Magnet (Email-Capture für PDF-Download), Über-den-Autor, FAQ.',
  accentColor: '#1A5FD4',
  defaultTitle: '[Framework-Name]',
  defaultSlug: 'neues-framework',
  defaultMetaDescription:
    '[Framework-Name] — der praxiserprobte Bauplan für [konkretes Outcome]. Kostenlos als PDF herunterladen.',
  sections: [

    // 1. HERO — Promise + Direct Lead-Magnet Capture
    {
      type: 'hero',
      content: {
        eyebrow: 'KOSTENLOS · HOL DIR DEN BAUPLAN',
        headline: '[Framework-Name]: Der [N]-Schritte-Bauplan für [Outcome].',
        subheadline:
          'Kein Theorie-Wirrwarr. Kein Marketing-Geschwurbel. Ein klares Framework, das du in [Zeitrahmen] anwenden kannst — getestet mit [N]+ B2B-Teams.',
        ctaLabel: 'Zum Bauplan',
        ctaHref: '#download',
        showEmailForm: false,
      },
    },

    // 2. SOCIAL PROOF — wer nutzt es schon
    {
      type: 'social_proof',
      content: {
        eyebrow: 'Im Einsatz bei',
        headline: 'Genutzt von [N]+ Founder:innen und Sales-Teams',
        items: [
          {
            quote: '[Konkreter ROI-Satz: vorher X, nachher Y, in Z Wochen.]',
            name: '[Name]',
            role: '[Rolle] @ [Firma]',
          },
          {
            quote: '[Zweites Zitat — anderer Aspekt der Wirkung.]',
            name: '[Name]',
            role: '[Rolle]',
          },
        ],
      },
    },

    // 3. PROBLEM — was das Framework löst
    {
      type: 'problem',
      content: {
        eyebrow: 'Warum dieses Framework',
        headline: '[Konkrete Pain-Frage in Du-Form?]',
        items: [
          { title: '[Symptom 1]', description: '[Wie es sich im Alltag zeigt.]' },
          { title: '[Symptom 2]', description: '[Konkrete Konsequenz.]' },
          { title: '[Symptom 3]', description: '[Was es kostet.]' },
        ],
      },
    },

    // 4. FRAMEWORK STEPS — der Bauplan
    {
      type: 'framework_steps',
      content: {
        eyebrow: 'Der Bauplan',
        headline: 'Das [Framework-Name]-Framework in [N] Schritten',
        subheadline:
          'Jeder Schritt ist konkret + sofort umsetzbar. Beispiele aus echten B2B-Cases.',
        steps: [
          {
            title: '[Schritt 1: Aktion]',
            description: '[Was du tust und warum es zuerst kommt.]',
            example: '[Konkretes Beispiel — z.B. Email-Subject, Pitch-Satz, Frage etc.]',
            tip: '[Was 90% falsch machen.]',
          },
          {
            title: '[Schritt 2: Aktion]',
            description: '[Beschreibung]',
            example: '[Beispiel]',
          },
          {
            title: '[Schritt 3: Aktion]',
            description: '[Beschreibung]',
            example: '[Beispiel]',
          },
          {
            title: '[Schritt 4: Aktion]',
            description: '[Beschreibung]',
            tip: '[Warnung oder Insider-Tipp.]',
          },
          {
            title: '[Schritt 5: Aktion]',
            description: '[Beschreibung]',
            example: '[Beispiel]',
          },
        ],
      },
    },

    // 5. LEAD MAGNET — Email-Capture für PDF
    {
      type: 'lead_magnet',
      content: {
        eyebrow: 'Hol dir den vollständigen Bauplan',
        headline: '[Framework-Name] · PDF + Workbook',
        subheadline:
          'Trag deine Email ein und bekomm den Bauplan als PDF mit Workbook + Beispielen direkt in deine Inbox.',
        format: 'PDF',
        size: '~1.2 MB',
        benefits: [
          '[N]-seitiges PDF mit allen Schritten ausführlich erklärt',
          'Workbook mit Übungen und Vorlagen zum Ausfüllen',
          'Reale B2B-Beispiele aus [Branche]',
          'Bonus: [Z.B. Email-Skripte / Pitch-Deck-Template / Audit-Checkliste]',
        ],
        ctaLabel: 'Jetzt kostenlos holen',
        privacyNote:
          'Kein Spam. Du bekommst den Bauplan + 1× pro Woche unseren Newsletter mit Updates. Abmeldung mit einem Klick.',
      },
    },

    // 6. AUTHOR / COACH BIO — wer dahinter steht
    {
      type: 'coach_bio',
      content: {
        eyebrow: 'Wer das aufgeschrieben hat',
        name: 'Markus Eilers',
        role: 'Revenue Systems · B2B-Vertrieb · TEDx Speaker',
        photoUrl: '/markus-photo.jpg',
        bio:
          'Markus baut seit 25+ Jahren B2B-Vertriebsorganisationen — von Start-ups bis Konzerne. Aus 500+ begleiteten Gründer:innen und €50M+ aktiviertem Umsatz ist die SalesMade-Methodik entstanden. Dieses Framework ist ein extrahierter Baustein daraus.',
        socials: {
          linkedin: 'https://linkedin.com/in/markuseilers',
          youtube: 'https://youtube.com/@markuseilers',
        },
      },
    },

    // 7. FAQ
    {
      type: 'faq',
      content: {
        headline: 'Häufige Fragen',
        items: [
          {
            q: 'Ist dieses Framework wirklich kostenlos?',
            a: 'Ja, 100 %. Im Austausch für deine Email bekommst du den Bauplan + unseren wöchentlichen Newsletter. Abmeldung jederzeit mit einem Klick.',
          },
          {
            q: 'Für wen ist [Framework-Name] geeignet?',
            a: '[Konkrete Zielgruppe — Rolle, Firmen-Größe, Reife-Grad.]',
          },
          {
            q: 'Wie lange dauert die Umsetzung?',
            a: '[Konkrete Zeitschätzung — in Stunden/Tagen/Wochen.]',
          },
          {
            q: 'Was unterscheidet dieses Framework von anderen Methoden?',
            a: '[Differenzierung — was ist hier anders/besser/spezifischer?]',
          },
        ],
      },
    },

    // 8. FINAL CTA — second chance to convert
    {
      type: 'cta',
      content: {
        headline: 'Bereit für den Bauplan?',
        body:
          '[Kurzer letzter Push — z.B. "Spar dir die Trial-and-Error-Phase. Setz das Framework in der nächsten Discovery-Woche ein."]',
        ctaLabel: 'Jetzt holen',
        ctaHref: '#download',
      },
    },
  ],
}

// Register
lpTemplates[frameworkLeadMagnetTemplate.key] = frameworkLeadMagnetTemplate
