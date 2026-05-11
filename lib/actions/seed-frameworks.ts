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
    bio: 'Markus baut seit 25+ Jahren B2B-Vertriebsorganisationen — von Start-ups bis Konzerne. Aus 500+ begleiteten Gründer:innen und €50M+ aktiviertem Umsatz ist die SalesMade-Methodik entstanden. Dieses Framework ist ein extrahierter Baustein daraus.',
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

  // ─── 2. 8 Schritte unwiderstehliche Angebote (existiert schon — refresh) ──
  {
    slug: 'b2b-angebote',
    title: 'Unwiderstehliche B2B-Angebote',
    metaDescription:
      'Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — in 8 einfachen Schritten. Inkl. Video-Masterclass.',
    topic: 'revenue',
    status: 'draft',
    internalNote: 'Bereits aus /b2b-offers migriert. Nach Launch SM-Rockstar-Alumni unter Posts taggen.',
    sections: [
      {
        type: 'hero',
        content: {
          eyebrow: 'KOSTENLOS · SOFORT VERFÜGBAR',
          headline: 'Unwiderstehliche B2B-Angebote in 8 einfachen Schritten.',
          subheadline:
            'Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — inkl. Video-Masterclass von Markus Eilers.',
          ctaLabel: 'Zum Bauplan',
          ctaHref: '#download',
        },
      },
      {
        type: 'framework_steps',
        content: {
          eyebrow: 'Der Bauplan',
          headline: 'Das 8-Schritte-Framework',
          subheadline: 'Jeder Schritt sofort umsetzbar. Beispiele aus echten B2B-Cases von 500+ Gründer:innen.',
          steps: [
            { title: 'Definiere, wen du wirklich bedienst', description: 'Eng, spezifisch, mit Branche, Größe und Reife-Grad.', tip: 'Wenn dein ICP in einen Tweet passt, ist er noch nicht eng genug.' },
            { title: 'Identifiziere den stärksten Schmerzpunkt', description: 'Nicht das Symptom, sondern die Wurzel.' },
            { title: 'Formuliere deinen Transformation-Promise', description: 'Vom Status quo zum gewünschten Outcome in einem Satz.' },
            { title: 'Baue deinen Proof-Stack auf', description: 'Drei Schichten: Ergebnisse (Zahlen), Stimmen (Testimonials), Autorität.', tip: 'Mach es konkret. „Mehr Umsatz" ist tot. „+48 % in 12 Monaten" lebt.' },
            { title: 'Gestalte dein Angebot-Paket', description: 'Ein Hauptdeliverable plus Bonus-Layer.' },
            { title: 'Entwickle deinen Preis-Anker', description: 'High-Anchor + Standard. Der Käufer fühlt das Mainpackage als Schnäppchen.', tip: 'Anker funktionieren nur, wenn sie real verkauft werden.' },
            { title: 'Erstelle deine Angebots-Präsentation', description: 'Vom Gesprächsleitfaden zum Entscheidungs-Dokument.' },
            { title: 'Teste und iteriere in echten Gesprächen', description: 'Niemals theoretisch optimieren.', tip: 'Wenn du nach 10 Calls dasselbe Einwand-Muster hörst, ist es ein Angebots-Bug, kein Verkaufs-Problem.' },
          ],
        },
      },
      {
        type: 'lead_magnet',
        content: {
          eyebrow: 'Hol dir den Bauplan',
          headline: 'B2B-Angebote · Bauplan + Workbook + Video-Masterclass',
          subheadline:
            'Trag deine Email ein, bekomm das PDF mit allen 8 Schritten + Workbook + 47-Min Video-Masterclass.',
          format: 'PDF + Video',
          size: '~4.2 MB',
          benefits: [
            '40-seitiges PDF mit allen 8 Schritten + Beispielen',
            'Workbook mit Vorlagen + Übungen',
            '47-Min Video-Masterclass von Markus Eilers',
            'Bonus: Angebots-Template als Google-Doc',
          ],
          ctaLabel: 'Jetzt kostenlos holen',
          privacyNote: 'Kein Spam. 1× Newsletter pro Woche. Abmeldung mit einem Klick.',
        },
      },
      MARKUS_BIO,
      {
        type: 'faq',
        content: {
          headline: 'Häufige Fragen',
          items: [
            { q: 'Ist der Bauplan wirklich kostenlos?', a: 'Ja, 100 %. Email gegen PDF + Workbook + Video.' },
            { q: 'Für wen ist das Framework geeignet?', a: 'B2B-Founder, CEOs, Sales-Verantwortliche. Besonders im Umsatzbereich €500k–€10M.' },
            { q: 'Wie lange dauert die Umsetzung?', a: '6–10 Stunden für den ersten Durchlauf. Iterieren über 2–3 Wochen.' },
            { q: 'Was unterscheidet diesen Bauplan von Standard-Methoden?', a: 'ICP-First, Proof-Stack als 3-Schichten-Modell, Anker-Pricing statt 3-Tier-Misch-Mix.' },
          ],
        },
      },
      {
        type: 'cta',
        content: {
          headline: 'Bereit für unwiderstehliche Angebote?',
          body: 'Spar dir die Trial-and-Error-Phase.',
          ctaLabel: 'Jetzt holen',
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
