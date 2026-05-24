'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
}

interface FrameworkSeed {
  slug: string
  title: string
  metaDescription: string
  topic: 'revenue' | 'leadership'
  status: 'draft' | 'published'
  /** Internal admin note, shown only in admin views */
  internalNote?: string
  sections: { type: string; content: Record<string, unknown> }[]
}

const ACCENT_BY_TOPIC = {
  revenue: '#1A5FD4',
  leadership: '#EB0028',
}

/** Smart default coach bio used across frameworks. */
const MARKUS_BIO = {
  type: 'coach_bio',
  content: {
    eyebrow: 'Wer das aufgeschrieben hat',
    name: 'Markus Eilers',
    role: 'Revenue Systems · B2B-Vertrieb · TEDx Speaker',
    photoUrl: '/markus-photo.jpg',
    bio: 'Markus baut seit 25+ Jahren B2B-Vertriebsorganisationen — von Start-ups bis Konzerne. Aus 500+ begleiteten Gründer:innen ist die SalesMade-Methodik entstanden. Dieses Framework ist ein extrahierter Baustein daraus.',
    socials: {
      linkedin: 'https://linkedin.com/in/markuseilers',
      youtube: 'https://youtube.com/@markuseilers',
    },
  },
} as const

const FRAMEWORKS: FrameworkSeed[] = [
  // ─── 1. Hailiom / Ghosttenberg ──────────────────────────────────────────
  {
    slug: 'hailiom',
    title: 'Hailiom — 9-Step AI Content Foundation & Explosion',
    metaDescription:
      'Der vortrainierte 9-Schritte-Prozess, der 87 % deiner Content-Marketing-Arbeit eliminiert und endlich qualifizierte Leads liefert. Kostenlos als Bauplan.',
    topic: 'revenue',
    status: 'draft',
    internalNote:
      'Nach Launch unter LinkedIn-Posts: Alumni des Social-Media-Rockstar-Trainings taggen für Reichweite + Social Proof.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · AI CONTENT FOUNDATION',
          headline: 'Hailiom: 87 % weniger Content-Aufwand. Endlich qualifizierte Leads.',
          subheadline:
            'Der vortrainierte 9-Schritte-Prozess für eine Content-Foundation, die sich von selbst skaliert — und dir endlich den Return liefert, den du dir von Content-Marketing immer erhofft hast.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Kennst du das?',
          headline: 'Content-Marketing kostet viel — und liefert wenig.',
          items: [
            { title: 'Hamster-Rad', description: 'Wöchentlich neue Posts, Ideen aus dem Nichts, kein System hinter dem Output.' },
            { title: 'Keine Leads', description: 'Likes ja, qualifizierte Anfragen nein. Content wird zur Budget-Verbrennung.' },
            { title: 'Tool-Wirrwarr', description: 'AI-Tools, ChatGPT-Custom-GPTs, Templates — viel Werkzeug, wenig System, kein Outcome.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Der Bauplan',
          headline: 'In 9 Schritten zur AI-Content-Foundation',
          subheadline:
            'Jeder Schritt ist konkret + sofort umsetzbar. Mit GPT-Engines, die wir für dich vortrainiert haben.',
          steps: [
            { title: 'Audience-Codex', description: '[Wer ist die Zielgruppe — eng + spezifisch?]', tip: '[Welcher Pain wird ignoriert?]' },
            { title: 'Voice-Profil', description: '[Wie klingst du? Tonalität, Lieblingswörter, No-gos.]' },
            { title: 'Pillar-Themen (5 max)', description: '[Welche 5 Themen schlägst du immer wieder?]' },
            { title: 'Idea-Engine', description: '[Wie kommen aus Pillars täglich Post-Ideen?]', example: '[Beispiel: Custom-GPT der aus Newslettern Posts ableitet.]' },
            { title: 'Content-Atomization', description: '[1 Long-form → 10 Atome. Wie?]' },
            { title: 'Format-Stack', description: '[Welche Formate (Hook + Karusell + Quote + …) ?]' },
            { title: 'AI-Drafting-Loop', description: '[Wie iteriere ich mit AI ohne klingen wie AI?]', tip: '[Voice-Profil als System-Prompt nutzen.]' },
            { title: 'Distribution-Cadence', description: '[Wann + wo + wie oft posten?]' },
            { title: 'Lead-Funnel-Anschluss', description: '[Wie wird aus Aufmerksamkeit ein Lead?]', example: '[CTA-Kalender mit konkreten Zielen pro Woche.]' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir den vollständigen Bauplan',
          headline: 'Hailiom 9-Step Bauplan + GPT-Engines',
          subheadline:
            'Trag deine Email ein, bekomm den 9-Schritte-Bauplan als PDF + Zugang zu unseren vortrainierten Custom-GPTs.',
          format: 'PDF + GPT-Engines',
          size: '~3 MB',
          benefits: [
            'PDF mit allen 9 Schritten ausführlich + Beispielen',
            'Zugang zu 4 vortrainierten Custom-GPTs (Idea-Engine, Voice-Profile, Atomization, Drafting-Loop)',
            'Voice-Profil-Worksheet zum Ausfüllen',
            'Bonus: Wöchentliche Distribution-Checkliste',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. Du bekommst den Bauplan + 1× pro Woche unseren Newsletter mit Updates. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Brauche ich Vorerfahrung mit AI-Tools?', a: 'Nein. Die GPT-Engines sind so vorbereitet, dass du sie nur ansteuern musst — das Tuning ist erledigt.' },
            { q: 'Funktioniert das auch ohne ChatGPT-Plus?', a: 'Die GPT-Engines brauchen ChatGPT-Plus oder Claude-Pro. Eine kostenlose Alternative ist Mistral oder Gemini — funktioniert, mit etwas weniger Komfort.' },
            { q: 'Wie lange dauert die Umsetzung?', a: 'Erste Foundation steht in 4–6 Stunden. Vollständige 9 Schritte über 2 Wochen mit täglich 30–60 Min.' },
            { q: 'Für wen ist das nicht?', a: 'Wenn du Content nur als Spielwiese siehst und keine Leads daraus erwartest, ist das System overkill. Wir bauen für ROI.' },
          ],
        },
      },
      {
        type: 'cta',
        content: {
          headline: 'Bereit für 87 % weniger Content-Aufwand?',
          body: 'Setz das System einmal auf — danach dreht es sich von selbst.',
          ctaLabel: 'Jetzt holen',
          ctaHref: '#download',
        },
      },
    ],
  },

  // ─── 2. Unwiderstehliche B2B-Angebote — Bauplan (Markus-Voice, 8 Schritte) ───
  {
    slug: 'b2b-angebote',
    title: 'Der Bauplan für unwiderstehliche B2B-Angebote',
    metaDescription:
      '5× überzeugender. 37 % zufriedenere Kunden. 58 % profitabler. Der komplette Bauplan für B2B-Angebote in 8 einfachen Schritten — inkl. PDF, 12-Min-Video und AI-Wizard.',
    topic: 'revenue',
    status: 'published',
    internalNote: 'Re-Launch mit Markus-Voice-Schritten (Beef-Radar, Doppelschmerz, Sichtbarer Pfad, Phasen-Währung, Beweis-Stapel, Booster, Wort-Garantie, Die letzten 20 %). Quelle: 00_Discovery + 01_Backbone v0.3 + 8 Schritt-Anatomien (24.5.2026).',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'SALESMADE · PILLAR-ASSET',
          headline: 'Der geheime Bauplan für unwiderstehliche B2B-Angebote.',
          subheadline:
            'So einfach macht Dein Growth Team jedes B2B-Angebot unwiderstehlich. In 8 einfachen Schritten.',
          ctaLabel: 'Sichere dir den Bauplan',
          ctaHref: '#download',
          showEmailForm: false,
        },
      },
      {
        type: 'social_proof',
        content: {
          eyebrow: 'CUSTOMER-AVG ÜBER BAUPLAN-ANWENDUNGEN',
          headline: '5× überzeugender. 37 % zufriedenere Kunden. 58 % profitabler.',
          subheadline:
            'Drei Zahlen, die unsere Klienten nach dem Bauplan ihren Vorständen zeigen. Acht Schritte zwischen einem Angebot, das diskutiert wird — und einem, das übernommen wird.',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'WAS NACH DEM BAUPLAN NORMAL IST',
          headline: 'Und heute noch wie Sci-Fi klingt.',
          items: [
            { title: 'Keine Rabatte vergeben', description: 'Nicht weil du stur bist — weil dein Angebot keinen mehr nötig hat.' },
            { title: 'Keine Deals mehr, die slippen', description: 'Pfad steht. Phase 2 hat eine Währung. Slip ist weg.' },
            { title: 'Kundengewinn ohne technische Fragen', description: 'Du sprichst die echten Schmerzen an — nicht das Feature.' },
            { title: 'Keine Besuche aus reiner Hoffnung', description: 'Es gibt einen Plan, kein Wunsch-Denken.' },
            { title: '5 Kunden in einer Woche', description: 'Kein Hustle. Ein Angebot, das jeder Stakeholder in 3 Min versteht.' },
            { title: '200 % der Ziele — nicht weil mehr gearbeitet', description: 'Phasen-Währung statt Arbeits-Tagebuch.' },
            { title: 'Verkaufen ohne hinterherzujagen', description: 'Wenn dein Angebot Substanz hat, trägt es sich selbst.' },
            { title: 'Kunden, die ihre Worte halten', description: 'Wort-Garantie aus deinem Lieferversprechen — nicht aus dem Marketing-Lehrbuch.' },
            { title: 'Stabil über 6-stellig verdienen', description: 'Beweise machen Preise verteidigbar. Verteidigbare Preise halten stabil.' },
          ],
        },
      },
      {
        type: 'origin_story',
        content: {
          eyebrow: 'WIE DER BAUPLAN ENTSTANDEN IST',
          headline: 'Vom 14-Features-Pitch zum Bauplan.',
          paragraphs: [
            'In den ersten zehn Jahren in seinem Systemhaus hat Markus Angebote mit vierzehn Features geschrieben. Jedes Feature war stolz erkämpft, jedes hatte seinen Platz. Bis ein Kunde, mit dem er gerade unterschrieb, ihm am Tisch sagte: „Markus, jetzt mal ehrlich — was bedeutet das alles für meine Firma? Konkret?"',
            'Er konnte es nicht in einem Satz sagen.',
            'Das war der Tag, an dem das Beef-Radar entstanden ist. Die Regel ist seitdem: Wenn ich bei einem Baustein nicht in einem Satz sagen kann, was er beim Kunden auslöst, gehört er entweder neu gedacht — oder raus.',
            'Daraus wurde über die letzten Jahre ein 8-Schritte-Bauplan, der heute von 500+ Gründer:innen genutzt wird. Hormozi-Stack plus drei Layer, die im $100M-Offers-Buch nicht systematisch sind: Sichtbarer Pfad, Phasen-Währung, Doppelschmerz mit Zukunfts-Ebene.',
          ],
        },
      },
      {
        type: 'features',
        content: {
          eyebrow: 'DREI MARKUS-LAYER',
          headline: 'Was am Bauplan neu ist vs. Hormozi.',
          subheadline: 'Hormozi macht den Value-Stack. Markus macht den Stack messbar — und gibt ihm einen Pfad und einen Zukunfts-Layer.',
          items: [
            {
              title: 'Sichtbarer Pfad',
              description: 'Bulletproof Delivery Plan als visualisierbare Methodik. 3-5 benannte Phasen, jede mit Input/Output/Dauer. Aus „Sie kommen vorbei, machen Magie" wird ein Glashaus, das der Kunde im Vorstand verteidigen kann.',
            },
            {
              title: 'Phasen-Währung',
              description: 'Pro Phase eine messbare Verschiebung — mit Drei-Punkt-Korridor (Pessimist / Realist / Optimist) und Mess-Zeitpunkt. Pricing wird gegen Realist verteidigt. Garantie wird gegen Pessimist geschrieben. Optimist ist Up-Side, nicht Versprechen.',
            },
            {
              title: 'Doppelschmerz Heute & Morgen',
              description: 'Probleme heute UND morgen. Heute-gelöst macht relevant. Morgen-vorausgesehen macht strategisch. Strategische Angebote verkaufen sich teurer — und länger. Du verkaufst nicht einmal — du baust eine Strecke.',
            },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'DER BAUPLAN',
          headline: 'Das 8-Schritte-Framework',
          subheadline:
            'Hormozi-Stack plus drei Markus-Layer: Sichtbarer Pfad, Phasen-Währung, Doppelschmerz. Jeder Schritt eine Voice. Jede Voice ein Werkzeug, das hängenbleibt.',
          steps: [
            {
              title: 'Beef-Radar · Inhalte → Value → Impact',
              description: 'Wir gehen die Top-Bausteine deines Angebots durch — pro Baustein: direkter Effekt, Wellen-Effekt, messbarer Impact. Am Ende eine Karte mit fünf Zeilen. Dein Kunde kann sie lesen, ohne dass jemand danebensteht.',
              example: 'Statt „professionelle Betreuung" steht „-45 Min Dokumentationszeit pro Behandlertag (Customer-Avg)". Aus Feature wird Effekt — und Effekt verkauft.',
              tip: 'Wenn du den Effekt nicht in einem Satz sagen kannst, gehört der Baustein neu gedacht oder raus. Kürzere Angebote werden öfter unterschrieben.',
            },
            {
              title: 'Doppelschmerz · Heute & Morgen',
              description: 'Welche Probleme löst dein Angebot heute schon — und welche kommen in 12 bis 24 Monaten so sicher, dass du sie gleich mitlösen kannst? Beide kommen auf eine Seite. Heute-gelöst macht relevant. Morgen-vorausgesehen macht strategisch.',
              example: '„Heute löst Sonia 45 Min Dokumentationszeit. Morgen verhindert sie, dass deine Praxis von der BEMA-Verschärfung 2027 überrascht wird — alle Behandlungen sind ab Tag 1 strukturiert dokumentiert."',
              tip: 'Wenn dein Angebot nur das Heute löst, ist es ein Pflaster. Wenn es beide adressiert, ist es eine Strecke. Strecken haben einen anderen Preis als Pflaster.',
            },
            {
              title: 'Sichtbarer Pfad · Bulletproof Delivery Plan',
              description: 'Wir machen sichtbar, wie dein Angebot wirkt — als Sequenz von 3 bis 5 benannten Phasen. Sobald dein Kunde den Weg sehen kann, schrumpft die Entscheidung. Er schaut nicht mehr auf den Berg, sondern auf den ersten Schritt.',
              example: '„Aufräumen · Aufstellen · Abliefern" (3 Phasen, 12 Wochen). Drei Wörter, gleiche Grammatik, gleiche Silbenanzahl — Pfad hängt.',
              tip: 'Ohne Pfad muss dein Kunde dir vertrauen. Mit Pfad muss er nur den Plan vorlegen — und der Plan überzeugt weiter, wenn du nicht im Raum bist.',
            },
            {
              title: 'Phasen-Währung · Currencies pro Phase',
              description: 'Pro Phase eine Hauptwährung mit Baseline, Drei-Punkt-Korridor (Pessimist/Realist/Optimist), Mess-Zeitpunkt. Aus „wir helfen Ihnen" wird „in Phase 2 verschieben wir die Annahmequote um 12 Punkte".',
              example: 'Phase 2 Aufstellen (Wo 4-8) · Hauptwährung: Annahmequote · Baseline 28 % · Realist +15 Pkt · Mess Wo 8 Review.',
              tip: 'Pricing wird gegen Realist verteidigt. Garantie wird gegen Pessimist geschrieben. Optimist ist Up-Side, nicht Versprechen.',
            },
            {
              title: 'Beweis-Stapel · ROI-Hypothesen oder Beweise',
              description: '3 bis 7 Beweise nach Klassen: Named Customer (Klasse A), Customer-Avg (B), Hypothese mit Methodik (C), Branchen-Benchmark (D), Testimonial-Quote (E). Mindestens 2 aus A oder B im Top-3. „Spart bis zu 22.500 €/Jahr" ist keine Marketing-Lautstärke — es ist die Spur, die dein Kunde zur Vorstandstür mitnimmt.',
              example: 'GMG (Druckindustrie): 22.500 €/Jahr eingespart. NFON: +24 % Profit. ionder: +28 % Produktivität, 12 Min/Meeting. Belegt, dokumentiert, datiert.',
              tip: 'Eine Hypothese ohne Methodik ist eine Marketing-Floskel mit Zahl. Eine Hypothese mit Methodik („3 FTE × 4h/Wo × 47 Wo × 90 €/h = 50.760 €") wird im Vorstand übernommen.',
            },
            {
              title: 'Booster · Adjacent Pain, mit Anker',
              description: '1 bis 3 Booster, die ein angrenzendes Problem lösen, das der Kunde nicht im Pitch hatte. Echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts. Bonus ist nicht „mehr für gleichen Preis" — Bonus ist „zweites Problem gelöst, mit €-Anker und Margin-Schutz".',
              example: 'Discovery-Call-Scorecard im Wert von 1.997 € · echter Aufwand 0 € (einmal gebaut). Margin-Schutz 0 %. Aktiviert im Pitch.',
              tip: 'Wenn jemand „geht da nicht was am Preis?" fragt, antwortest du nicht mit %, sondern mit „Wir machen Y mit drauf — den Wert dazu kannst du in der Tabelle sehen."',
            },
            {
              title: 'Wort-Garantie · Verteidigbare Garantie',
              description: 'Eine Garantie, die du beim Espresso aussprechen kannst, weil dein Lieferversprechen sie trägt. Typ + Trigger-Bedingung + Konsequenz + Liefer-Anker (Phase aus Schritt 3 + Währung aus Schritt 4) + Espresso-Test bestanden.',
              example: '„Wenn dein Team nach 12 Wochen die ersten 5 Pitches nicht mit dem neuen Bauplan durchgeführt hat — 8 Wochen Office-Hours kostenfrei dran." Konkret. Datiert. An Phase und Währung gebunden.',
              tip: '„100 % Zufriedenheits-Garantie" ist ein Marketing-Schwur. Eine Wort-Garantie ist ein Verkäufer-Versprechen. Der Unterschied schlägt sich in der Pricing-Power nieder.',
            },
            {
              title: 'Die letzten 20 % · Name + Headline + CTA',
              description: 'Cooler Name, geniale Headline, klarer CTA — drei Mikro-Entscheidungen, die das Angebot lesbar machen oder verkleben. Zum Schluss, nicht am Anfang. Weil sie aus den ersten sieben Schritten gespeist werden — nicht aus dem Marketing-Lehrbuch.',
              example: '„Der Wachstumsmotor für den Maschinenbau" — Stil „[Substantiv] für [Branche]". Im Slack-Chat teilbar, im Espresso aussprechbar, in 3 Sekunden einsortierbar.',
              tip: 'Espresso-Test (Slack, Espresso, Google, Domain, 3-Jahre) muss mindestens 4/5 bestehen. Sonst weiter iterieren — Naming ist Ringen, kein Genie-Blitz.',
            },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'HOL DIR DEN BAUPLAN',
          headline: 'Der 8-Schritte-Bauplan · PDF + 12-Min-Video + AI-Wizard',
          subheadline:
            'Email eintragen, sofort runterladen, sofort starten. Acht Schritte. Vier Stunden. Ein unwiderstehliches Angebot.',
          format: 'PDF + Video + Web-App',
          size: '~6 MB · sofort verfügbar',
          benefits: [
            '24-seitiges PDF mit allen 8 Schritten + Templates + Frame-Strukturen',
            '12-Min Walkthrough mit Markus — jeder Schritt mit Live-Case (Eilers+Friends · HubSpot · Sonia.so)',
            'AI-Wizard: dein Begleiter durch alle 8 Schritte, generiert dein Angebot am Ende',
            'Roadmap-Generator: dein Sichtbarer Pfad als visuelle SVG (verzahnt mit bulletproof-delivery-builder)',
          ],
          ctaLabel: 'Jetzt holen — sofort verfügbar',
          privacyNote: 'Kein Spam. Donnerstag-Newsletter mit Coaching-Lehren der Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'tweet_wall',
        content: {
          eyebrow: 'CUSTOMER-STIMMEN',
          headline: 'Was Kunden nach dem Bauplan sagen.',
          quotes: [
            {
              text: 'Sie verkaufen sich Ihr Zeug hier ja selbst.',
              author: 'Mid-Market-Käufer nach Sichtung des Bauplan-Angebots',
              context: 'B2B-DACH, 2022',
            },
            {
              text: 'Das nehme ich heute Abend mit zu meinem CFO.',
              author: 'VP Customer Success eines SaaS-Mid-Market',
              context: '6 Wochen Sales-Cycle statt 14, 2024',
            },
            {
              text: 'Bei 200 MA sind das 2 Mio €/Jahr — selbst im Pessimist-Korridor noch 800k.',
              author: 'CFO einer Industrie-Holding',
              context: 'five9s-Case, IT-Security, 10.000 €/MA/Jahr-Beweis',
            },
            {
              text: 'Wir konnten unsere Annahmequote von 28 % auf 53 % heben — in 12 Wochen.',
              author: 'Sales-Lead eines DACH-Mittelständlers',
              context: 'Arman-Customer-Case, Jahr 1',
            },
          ],
        },
      },
      {
        type: 'risk_reversal',
        content: {
          eyebrow: 'UNSERE GARANTIE',
          headline: 'Whatever it takes.',
          body: 'Auf das PDF gilt: 30-Tage-Refund-Window, voller Refund, ohne Begründung. Auf den Wizard: erste 5 Tage testen, Cancel ohne Begründung. Auf die Academy (1.997 €): Wenn dein Team nach 12 Wochen die ersten 5 Pitches nicht mit dem Bauplan durchgeführt hat, läuft die Office-Hours-Begleitung 8 Wochen länger kostenfrei. Wir praktizieren, was wir predigen — Wort-Garantie ist Schritt 7.',
        },
      },
      {
        type: 'faq',
        content: {
          eyebrow: 'HÄUFIGE FRAGEN',
          headline: 'Was du wissen willst, bevor du startest.',
          items: [
            {
              q: 'Funktioniert das auch ohne Markus?',
              a: 'Ja. Genau das ist der Punkt. Der Bauplan ist Methodik, nicht Magie. Sobald dein Growth Team ihn einmal durchläuft, kann es ihn das zweite Mal alleine. Wenn ein Angebot später wirklich verklemmt: prüfe es mit drei Fragen — Beef-Radar? Phasen-Währung? Beweis-Stapel?',
            },
            {
              q: 'Wie lange dauert es, ein Angebot durchzubauen?',
              a: 'Erstes Angebot mit dem Wizard: 3-4 Stunden konzentriert. Zweites: 90 Min. Drittes: 45 Min. Du machst nicht weniger Substanzarbeit — du machst sie schneller, weil du den Pfad schon kennst.',
            },
            {
              q: 'Wir sind kein Mid-Market-DACH — passt das trotzdem?',
              a: 'Wenn du im B2B verkaufst, dein Sales-Cycle länger als ein Tag dauert, dein Angebot mehr als ein SKU ist — ja. Die Beispiele sind aus DACH (Maschinenbau, IT, SaaS-Mid-Market). Die Mechanik ist branchenneutral.',
            },
            {
              q: '„Unwiderstehlich" — ist das nicht Marketing-Übertreibung?',
              a: 'Wir messen es nicht mit „Begeisterung". Wir messen mit Annahmequote (28 % → 53 %), Sales-Cycle (unter 3 Monaten), 5× wahrgenommener Überzeugungskraft, 58 % höhere Profitabilität. Unwiderstehlich heißt: Die richtigen sagen schneller Ja, die falschen früher Nein.',
            },
            {
              q: 'Wir haben schon Hormozi gelesen — was ist hier neu?',
              a: 'Drei Layer, die im $100M-Offers-Buch nicht systematisch sind: (1) Sichtbarer Pfad als visualisierbare Methodik. (2) Phasen-Währung pro Phase, nicht nur ROI am Ende. (3) Doppelschmerz mit Zukunfts-Layer. Plus: DACH-Mittelstand kalibriert, nicht US-Coaching-Markt.',
            },
            {
              q: 'Wo ist die Garantie?',
              a: 'In Schritt 7. Ironisch, oder? Auf das PDF: 30-Tage-Refund-Window ohne Begründung. Auf den Wizard: erste 5 Tage testen, Cancel ohne Begründung. Praktiziere, was du predigst.',
            },
            {
              q: 'Funktioniert der AI-Begleiter, wenn ich kein KI-Profi bin?',
              a: 'Genau dafür ist er gebaut. Der Wizard stellt dir keine technischen Fragen — er stellt die richtigen Fragen, die ich im Coaching auch stelle. Wenn du eine Floskel tippst, hält er dich an. Wenn du substanziell antwortest, gibt er dir das nächste Kompliment und Punkte.',
            },
            {
              q: 'Was passiert, wenn ich nach Schritt 4 hängen bleibe?',
              a: 'Pause-und-Resume (Wizard speichert), Beispiele anschauen (pro Schritt 3 gute + 1 schlechtes), oder Office-Hours buchen (Academy/Founding-30). Schritt 4 ist statistisch der häufigste Hänger — Phasen-Währung braucht Baseline-Daten, die du oft erst recherchieren musst. Plan ein, nicht Versagen.',
            },
          ],
        },
      },
      {
        type: 'cta',
        content: {
          eyebrow: 'BEREIT?',
          headline: 'Acht Schritte zwischen „wir gucken\'s uns an" und „wo unterschreiben wir?"',
          body: 'Sichere dir den Bauplan. Heute Abend hast du dein nächstes Angebot durchgespielt — wiederholbar, ohne Marketing-Lehrbuch, ohne Talent-Lotterie.',
          ctaLabel: 'Bauplan jetzt holen',
          ctaHref: '#download',
        },
      },
    ],
  },

  // ─── 3. Instant Influence ──────────────────────────────────────────────
  {
    slug: 'instant-influence',
    title: 'Instant Influence — Win Customers in Your First Conversation',
    metaDescription:
      'Die 3 Zutaten, die Kunden im ersten Gespräch gewinnen. Discovery-Call-Generator + Learning + Notes-AI als interaktives Tool.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Interaktives Tool: Discovery-Call-Generator soll später als embedded UI-Fragment auf der LP integriert werden.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · DISCOVERY-CALL TOOL',
          headline: 'Instant Influence: Die 3 Zutaten, die Kunden im ersten Gespräch gewinnen.',
          subheadline:
            'Mit Discovery-Call-Generator, Learning und Notes-AI bekommst du nicht nur die Methode — sondern das Werkzeug, sie in jedem Call sofort einzusetzen.',
          ctaLabel: 'Zum Tool',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Das Problem',
          headline: 'Erste Gespräche fühlen sich oft wie Glücksspiel an.',
          items: [
            { title: 'Du redest, sie nicken', description: 'Das Gespräch läuft, aber am Ende ist nichts klar — und kein nächster Schritt.' },
            { title: 'Du fragst, sie weichen aus', description: 'Standard-Discovery-Fragen → Standard-Antworten. Kein echter Pain sichtbar.' },
            { title: 'Sie ghosten danach', description: 'Discovery war freundlich, aber die Followup-Mail bekommt keine Antwort.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Die 3 Zutaten',
          headline: 'Was wirklich beeinflusst — sofort, nicht erst nach Aufbau.',
          subheadline: 'Jede Zutat ist trainierbar. Die Kombination macht den Unterschied.',
          steps: [
            { title: 'Zutat 1: Tactical Empathy', description: 'Labeling, Mirroring, Calibrated Questions. Kunde fühlt sich verstanden, BEVOR du etwas verkaufst.', example: '"Es klingt so, als ob ihr schon viel ausprobiert habt — und nichts davon hat gehalten?"', tip: 'Mehr fragen, weniger pitchen. Verhältnis 80/20.' },
            { title: 'Zutat 2: Authority Reframe', description: 'Du bist der Sparringspartner, nicht der Bittsteller. Kleine Reframes drehen die Dynamik.', example: '"Bevor wir reden — passt mein Programm überhaupt zu deiner Phase? Lass mich kurz checken."' },
            { title: 'Zutat 3: Decision Architecture', description: 'Du strukturierst die Entscheidung — was wäre der nächste Schritt, wenn wir uns verstehen?', tip: 'Nie mit "Sollen wir noch mal reden?" enden. Immer mit konkretem Folgeschritt.' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir das Tool',
          headline: 'Instant Influence · Discovery-Call-Generator',
          subheadline: 'Trag deine Email ein und bekomm Zugang zum Discovery-Call-Generator: gibt dir vor jedem Call eine maßgeschneiderte Frageliste + Notes-AI für die Auswertung.',
          format: 'Web-Tool + PDF',
          size: '',
          benefits: [
            'Discovery-Call-Generator (Web-Tool)',
            'Notes-AI: Liest deine Call-Notes + extrahiert Pain + Next Step',
            'PDF mit den 3 Zutaten + Beispiel-Skripten',
            'Mini-Kurs: 4 kurze Videos (je 5 Min) zur Anwendung',
          ],
          ctaLabel: 'Jetzt Zugang holen',
          privacyNote: 'Kein Spam. Newsletter 1× pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Ist das wirklich „Instant"? Oder dauert es Monate, bis es wirkt?', a: 'Die 3 Zutaten kannst du im nächsten Call sofort einsetzen. Souveränität wächst über 5–10 Calls.' },
            { q: 'Funktioniert das auch in englischsprachigen Calls?', a: 'Ja — die Zutaten sind sprachunabhängig. Beispiel-Skripte sind auf Deutsch, das Notes-AI versteht beide Sprachen.' },
            { q: 'Brauche ich besondere Technik für den Generator?', a: 'Browser reicht. Notes-AI läuft per Custom-GPT (Plus-Abo) oder Claude-Pro.' },
          ],
        },
      },
      {
        type: 'cta',
        content: { headline: 'Mach den nächsten Discovery-Call zu deinem stärksten.', body: '', ctaLabel: 'Tool holen', ctaHref: '#download' },
      },
    ],
  },

  // ─── 4. Beef Radar ────────────────────────────────────────────────────────
  {
    slug: 'beef-radar',
    title: 'Beef Radar — Vom Merkmal zum Financial Impact',
    metaDescription:
      'Der einfache, übersehene Hack, mit dem du eine Tonne Wert kommunizierst — sodass auch der CFO zuhört. Kostenlos als Bauplan + Worksheet.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Interaktives Tool später: "Beef-Radar-Konverter" — Eingabe Merkmal, Ausgabe Financial Impact in 3 Schichten.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · COMMUNICATION HACK',
          headline: 'Beef Radar: Wie du Wert kommunizierst, sodass auch der CFO zuhört.',
          subheadline:
            'Der einfache, oft übersehene Hack, der aus jedem Merkmal einen Financial Impact macht — und damit jedes Sales-Gespräch in eine Investitions-Diskussion verwandelt.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Warum Pitches scheitern',
          headline: 'Du redest über Features. Sie hören Lärm.',
          items: [
            { title: 'Feature-Dumping', description: 'Du listest auf, was dein Produkt kann. Käufer wartet auf "Was bringt mir das?"' },
            { title: 'Benefit-Schwurbel', description: 'Du sagst "spart Zeit". Der CFO sagt "wie viel?"' },
            { title: 'CFO-Test failed', description: 'Wer nicht in € rechnen kann, wird im Boardroom nicht durchgesetzt.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Der Hack',
          headline: 'Vom Merkmal zum Financial Impact in 3 Schichten',
          subheadline: 'Jede Schicht macht den Wert konkreter — und die Entscheidung leichter.',
          steps: [
            { title: 'Schicht 1: Feature', description: 'Was kann das Produkt rein objektiv?', example: '"AI-gestütztes Lead-Scoring."' },
            { title: 'Schicht 2: Outcome', description: 'Was ändert sich konkret im Tagesgeschäft?', example: '"Vertrieb arbeitet nur die Top-20 % der Leads — keine Zeitverschwendung mehr."' },
            { title: 'Schicht 3: Financial Impact', description: 'Was bedeutet das in € pro Jahr?', example: '"Pro Verkäufer +12 echte Discovery-Calls/Monat × Conversion 35 % × Deal-Wert €15k = €756k zusätzlicher Umsatz."', tip: 'Niemals raten. Immer 2–3 Annahmen mit dem Käufer im Call validieren.' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir den Beef-Radar',
          headline: 'Beef Radar · Bauplan + Worksheet + Beispiele',
          subheadline: 'Trag deine Email ein und bekomm das PDF mit Methode + ein Worksheet zum Befüllen für dein Angebot + 5 reale B2B-Beispiele.',
          format: 'PDF + Worksheet',
          size: '~1.5 MB',
          benefits: [
            'Beef-Radar-Methode in 3 Schichten erklärt',
            'Worksheet zum Befüllen für deine 3 Hauptangebote',
            '5 reale B2B-Beispiele aus verschiedenen Branchen',
            'Bonus: CFO-Test-Checkliste vor jedem großen Deal',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. Newsletter 1× pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Brauche ich harte Zahlen? Was, wenn ich keine Branchendaten habe?', a: 'Du brauchst nur Annahmen, die du mit dem Käufer validierst. Das ist das Wesentliche — gemeinsam rechnen statt vorrechnen.' },
            { q: 'Wie lange dauert die Vorbereitung pro Account?', a: '15–30 Minuten, sobald du das Worksheet einmal für dein Angebot durchhast.' },
            { q: 'Funktioniert das auch bei kleinen Deals?', a: 'Ja — bei kleinen Deals fokussierst du Schicht 2 (Outcome) stärker. Bei großen Deals ist Schicht 3 (€) entscheidend.' },
          ],
        },
      },
      {
        type: 'cta',
        content: { headline: 'Bring den CFO auf deine Seite.', body: '', ctaLabel: 'Bauplan holen', ctaHref: '#download' },
      },
    ],
  },

  // ─── 5. Core: 11 Messages ──────────────────────────────────────────────
  {
    slug: 'core-messages',
    title: 'Core — Die 11 Botschaften, die jede:r Unternehmer:in im Schlaf können sollte',
    metaDescription:
      'Die 11 Kern-Botschaften für planbares Wachstum — und wie du deine eigenen in 18 Minuten findest. Kostenlos als Bauplan + Worksheet.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Tool: 18-Min-Worksheet + AI-Prompt zum Selber-Generieren der eigenen 11 Botschaften.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · MESSAGING FOUNDATION',
          headline: 'Core: 11 Botschaften, die jede:r Unternehmer:in im Schlaf können sollte.',
          subheadline:
            'Plus: Wie du deine eigenen 11 in 18 Minuten findest — und damit jedes Gespräch, jeden Pitch, jeden Post auf solidem Fundament führst.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Das Problem',
          headline: 'Jeder Pitch ist anders. Das ist das Problem.',
          items: [
            { title: 'Improvisation', description: 'Jedes Gespräch beginnt bei null. Botschaften sind nicht eingespielt.' },
            { title: 'Inkonsistenz', description: 'Was du auf LinkedIn schreibst, ist nicht das, was du auf der Bühne sagst — und beides ist nicht das, was im Sales-Call vorkommt.' },
            { title: 'Fehlende Wiedererkennung', description: 'Kund:innen merken sich nichts, weil es keine Wiederholung gibt.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Die 11 Core-Botschaften',
          headline: 'Was jede:r Unternehmer:in im Schlaf können muss',
          subheadline: 'Eine konsistente Erzählung — über Posts, Calls, Bühne, Email.',
          steps: [
            { title: 'Wer du bist (1 Satz)', description: 'Persona-Definition in einem Satz, mit Branche und Differenzierung.' },
            { title: 'Wem du dienst (ICP)', description: 'Eng + spezifisch — kein "alle B2B-Founder".' },
            { title: 'Welchen Schmerz du löst', description: 'Der eine Schmerz, den du am besten löst.' },
            { title: 'Welches Outcome du lieferst', description: 'Konkret + messbar.' },
            { title: 'Warum jetzt (Urgency)', description: 'Was passiert, wenn man nicht handelt?' },
            { title: 'Warum du (Authority)', description: 'Was qualifiziert dich, das zu lösen?' },
            { title: 'Wie du arbeitest (Method)', description: 'Dein Framework / dein Vorgehen — namentlich.' },
            { title: 'Was es nicht ist (Anti-Pitch)', description: 'Was du explizit NICHT machst.' },
            { title: 'Erste Aktion', description: 'Was ist der konkrete erste Schritt?' },
            { title: 'Garantie / Risiko-Reversal', description: 'Was ist das Risiko, wenn es nicht funktioniert?' },
            { title: 'Origin-Story', description: 'Warum machst du das überhaupt?' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir das 18-Min-Worksheet',
          headline: 'Core 11 · Bauplan + Worksheet',
          subheadline: 'Trag deine Email ein, bekomm den Bauplan + ein 18-Minuten-Worksheet, das dich schrittweise durch deine eigenen 11 Botschaften führt — plus AI-Prompt zum Iterieren.',
          format: 'PDF + Worksheet + AI-Prompt',
          size: '~2 MB',
          benefits: [
            'PDF mit allen 11 Botschaften erklärt + Beispielen',
            '18-Minuten-Worksheet zum Befüllen',
            'AI-Prompt für GPT/Claude zum Iterieren',
            'Bonus: Anwendungs-Map (welche Botschaft wo nutzen)',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. Newsletter 1× pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Wirklich nur 18 Minuten?', a: 'Für den ersten Durchlauf, ja. Iterationen kommen über die nächsten 2–4 Wochen — beim Anwenden in echten Gesprächen.' },
            { q: 'Was, wenn meine Botschaften noch nicht klar sind?', a: 'Genau dann ist das Worksheet wertvoll — die Fragen zwingen Klarheit.' },
            { q: 'Brauche ich AI für die Übung?', a: 'Nein. Optional — der AI-Prompt hilft beim Iterieren, aber das Worksheet funktioniert auch komplett analog.' },
          ],
        },
      },
      {
        type: 'cta',
        content: { headline: 'Findest du deine 11 in 18 Minuten?', body: 'Hol dir das Worksheet und finde es heraus.', ctaLabel: 'Worksheet holen', ctaHref: '#download' },
      },
    ],
  },

  // ─── 6. Strategic Preparation ─────────────────────────────────────────
  {
    slug: 'strategic-preparation',
    title: 'Strategic Preparation — In 8 Schritten zu jedem wichtigen Gespräch',
    metaDescription:
      'Auch in den schwierigsten und wichtigsten Gesprächen souverän überzeugen. In 8 Schritten zur strategischen Vorbereitung. Kostenlos als Bauplan + Checkliste.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Tool: Pre-Meeting-Checkliste als interaktives UI später.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · MEETING-PREP-FRAMEWORK',
          headline: 'Strategic Preparation: In 8 Schritten zu jedem wichtigen Gespräch.',
          subheadline:
            'Wer Großes vorhat, geht nicht unvorbereitet. Diese 8 Schritte sind dein Vor-Meeting-Bauplan — egal ob C-Level-Pitch, Investoren-Update oder strategischer Workshop.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Warum wichtige Gespräche schiefgehen',
          headline: 'Improvisation tötet wichtige Gespräche.',
          items: [
            { title: 'Du kennst die Stakeholder nicht', description: 'Du weißt nicht, wer wirklich entscheidet — und was sie/ihn wachhält.' },
            { title: 'Du hast keine Hypothese', description: 'Du fragst, ohne zu wissen, was die Antwort wahrscheinlich ist.' },
            { title: 'Du hast keinen Plan B', description: 'Wenn das Gespräch in eine andere Richtung kippt, hast du nichts in der Hinterhand.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Der Bauplan',
          headline: 'Die 8 Schritte vor jedem wichtigen Gespräch',
          subheadline: '15–45 Minuten Vorbereitung, je nach Bedeutung des Termins. Worth every minute.',
          steps: [
            { title: 'Klarheit über das Outcome', description: 'Was soll am Ende des Gesprächs konkret stehen?' },
            { title: 'Stakeholder-Mapping', description: 'Wer ist im Raum, wer entscheidet, wer beeinflusst?', tip: 'LinkedIn-Recherche jeder Person — 3 Min pro Stakeholder.' },
            { title: 'Hypothese: Was sie wollen', description: 'Was glaubst du, ist ihr stärkster Pain / ihr stärkstes Ziel?' },
            { title: 'Frage-Hierarchie', description: '5 Fragen, sortiert von "harmlos warm-up" bis "scharfe Diagnose".' },
            { title: 'Pre-Mortem: Was kann schiefgehen?', description: 'Welche 3 Einwände/Sackgassen sind wahrscheinlich? Vorab Antworten formulieren.' },
            { title: 'Plan B + C', description: 'Wenn das Hauptziel nicht erreichbar ist, was ist die Fallback-Vereinbarung?' },
            { title: 'Eröffnungs- + Schluss-Sequenz auswendig', description: 'Erste 60 Sek + letzte 60 Sek — die brennen sich ein.' },
            { title: 'Mental Reset 5 Min vor Termin', description: 'Atmen, Outcome visualisieren, Stakeholder-Namen wiederholen. Volle Präsenz.' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir die Checkliste',
          headline: 'Strategic Preparation · Bauplan + Pre-Meeting-Checkliste',
          subheadline:
            'Trag deine Email ein, bekomm das PDF mit allen 8 Schritten + eine ausdruckbare Pre-Meeting-Checkliste, die du vor jedem wichtigen Gespräch durchgehst.',
          format: 'PDF + Checkliste',
          size: '~1.2 MB',
          benefits: [
            '20-seitiges PDF mit allen 8 Schritten + Beispielen',
            'Pre-Meeting-Checkliste (1 Seite, ausdruckbar)',
            '3 Beispiele aus echten C-Level-Pitches',
            'Bonus: Stakeholder-Mapping-Template',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. Newsletter 1× pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Macht man das wirklich vor JEDEM Gespräch?', a: 'Nein — vor jedem wichtigen. Faustregel: alles über €50k Deal-Wert oder Stakeholder-Komplexität.' },
            { q: 'Wie viel Zeit pro Vorbereitung?', a: '15 Min für mittelgroße Deals, 45 Min für strategische Pitches. Lohnt sich immer.' },
            { q: 'Funktioniert das auch im Team?', a: 'Ja — sogar besser. Stakeholder-Mapping + Pre-Mortem im Team führen zu deutlich anderen Hypothesen.' },
          ],
        },
      },
      {
        type: 'cta',
        content: { headline: 'Geh nie wieder unvorbereitet ins wichtige Gespräch.', body: '', ctaLabel: 'Bauplan holen', ctaHref: '#download' },
      },
    ],
  },

  // ─── 7. The "Recommendation" Pitch ────────────────────────────────────
  {
    slug: 'recommendation-pitch',
    title: 'The "Recommendation" Pitch — Verkaufen ohne zu verkaufen',
    metaDescription:
      'Wie du Empfehlungen aussprichst statt zu pitchen — und damit den Käufer ins Driver-Seat setzt. Kostenlos als Bauplan + Skript.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Möglicher Tool-Add-on: Recommendation-Pitch-Generator (Eingabe Discovery-Notes, Ausgabe Empfehlungs-Skript).',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · ADVANCED-CLOSE-FRAMEWORK',
          headline: 'The Recommendation Pitch: Verkaufen ohne zu verkaufen.',
          subheadline:
            'Statt zu pitchen, sprichst du eine Empfehlung aus. Statt zu schließen, formulierst du, was logisch wäre. Das verändert die Dynamik kompletter Gespräche.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'problem',
        content: {
          eyebrow: 'Warum klassisches Closing nicht mehr funktioniert',
          headline: 'B2B-Käufer hassen "verkauft werden".',
          items: [
            { title: '"Trial Close" ist tot', description: 'Käufer durchschauen die Methode in Sekunden. Vertrauen leidet.' },
            { title: 'Druck verschiebt Entscheidung', description: 'Druck im Closing führt zu "ich überleg\'s nochmal" — die Sales-Variante von Nein.' },
            { title: 'Käufer wollen souverän entscheiden', description: 'Die besten Käufer entscheiden gegen alles, was sich nach Verkauf anfühlt.' },
          ],
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Der Bauplan',
          headline: 'Vom Pitch zur Empfehlung — in 5 Schritten',
          subheadline: 'Diese Sequenz dreht das Verkaufs-Gespräch um.',
          steps: [
            { title: 'Diagnose machen, nicht präsentieren', description: 'Erst verstehen, was wirklich gebraucht wird — bevor du auch nur EIN Wort über dein Angebot sagst.', tip: 'Wenn du in Minute 5 schon präsentierst, hast du verloren.' },
            { title: 'Hypothese laut aussprechen', description: '"Wenn ich richtig verstehe, ist X die größte Baustelle — und Y wäre der Hebel?" → Käufer korrigiert oder bestätigt.' },
            { title: 'Empfehlung formulieren, nicht Pitch', description: '"In dieser Situation würde ich [konkrete Vorgehensweise] empfehlen — nicht weil ich das verkaufe, sondern weil ich es bei 30+ ähnlichen Cases gesehen habe."' },
            { title: 'Einwand vorwegnehmen', description: '"Das funktioniert NICHT, wenn [Bedingung X]. Trifft das auf euch zu?" → echte Konversation statt verstecktem Closing.' },
            { title: 'Logischen nächsten Schritt benennen', description: 'Nicht fragen, ob sie kaufen wollen. Sondern: "Der nächste sinnvolle Schritt wäre [Pilot/Workshop/Scope]. Soll ich das vorbereiten?"' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir das Skript',
          headline: 'Recommendation Pitch · Bauplan + Skript-Vorlage',
          subheadline:
            'Trag deine Email ein, bekomm das PDF mit der Methode + ein Skript zum Adaptieren für dein eigenes Angebot.',
          format: 'PDF + Skript',
          size: '~1.5 MB',
          benefits: [
            'PDF mit der 5-Schritte-Methode + Beispielen',
            'Skript-Vorlage zum Adaptieren',
            '3 Vorher/Nachher-Vergleiche aus echten Calls',
            'Bonus: Liste der häufigsten Einwand-Antworten',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. Newsletter 1× pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Funktioniert das wirklich besser als klassisches Closing?', a: 'In B2B-Sales mit informierten Käufern: ja, deutlich. Conversion +15–30 % im Schnitt unserer Klienten.' },
            { q: 'Ist das nicht zu passiv?', a: 'Im Gegenteil — eine klare Empfehlung mit Einwand-Vorwegnahme ist offensiver als ein Trial-Close. Sie ist nur weniger manipulativ.' },
            { q: 'Was, wenn der Käufer trotzdem nicht entscheidet?', a: 'Dann gibt es eine Bedingung, die noch nicht klar ist. Das Skript hilft, sie sichtbar zu machen.' },
          ],
        },
      },
      {
        type: 'cta',
        content: { headline: 'Lass die Pitch-Phase hinter dir.', body: '', ctaLabel: 'Skript holen', ctaHref: '#download' },
      },
    ],
  },
]

/**
 * Seedet alle Frameworks idempotent. Bestehende Slugs werden aktualisiert
 * (Sektionen werden komplett ersetzt). Gibt eine Zusammenfassung zurück.
 */
export async function seedAllFrameworks() {
  await requireAdmin()

  const results: { slug: string; id: string; created: boolean }[] = []
  for (const fw of FRAMEWORKS) {
    const accent = ACCENT_BY_TOPIC[fw.topic]

    const [existing] = await db
      .select({ id: landingPages.id })
      .from(landingPages)
      .where(eq(landingPages.slug, fw.slug))
      .limit(1)

    let pageId: string
    let created = false

    if (existing) {
      await db.update(landingPages).set({
        title: fw.title,
        metaDescription: fw.metaDescription,
        accentColor: accent,
        templateKey: 'framework-leadmagnet',
        status: fw.status,
        updatedAt: new Date(),
      }).where(eq(landingPages.id, existing.id))
      await db.delete(landingPageSections).where(eq(landingPageSections.landingPageId, existing.id))
      pageId = existing.id
    } else {
      const [row] = await db.insert(landingPages).values({
        slug: fw.slug,
        title: fw.title,
        metaDescription: fw.metaDescription,
        status: fw.status,
        locale: 'de',
        accentColor: accent,
        templateKey: 'framework-leadmagnet',
        emailList: `framework-${fw.slug}`,
      }).returning()
      pageId = row.id
      created = true
    }

    await db.insert(landingPageSections).values(
      fw.sections.map((s, i) => ({
        landingPageId: pageId,
        type: s.type as any,
        order: i * 10,
        isVisible: true,
        content: s.content,
      })),
    )

    results.push({ slug: fw.slug, id: pageId, created })
  }

  revalidatePath('/admin/frameworks')
  revalidatePath('/frameworks')
  for (const r of results) revalidatePath(`/frameworks/${r.slug}`)

  return { count: results.length, results }
}

/** Backward-compat: legacy single-framework seeder. Now just seeds all. */
export async function seedB2BOffersAsFramework() {
  const result = await seedAllFrameworks()
  const b2b = result.results.find((r) => r.slug === 'b2b-angebote')
  if (!b2b) throw new Error('seed: b2b-angebote not found in result')
  return { id: b2b.id, slug: 'b2b-angebote' }
}
