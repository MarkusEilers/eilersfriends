/**
 * Das Material aus den Schreib-Skills.
 *
 * Die drei Skills (`salesmade-content-writer`, `salesmade-writer-pro`,
 * `salesmade-writer-v3`) sind ueber Monate gewachsen und enthalten das, was
 * unsere Texte von generischen unterscheidet: die Verbotsliste, das
 * Kernregelwerk, fuenf Stimmprofile, rund vierhundert Vorlagen, die Hook- und
 * Headline-Baenke, die Beispieltexte.
 *
 * Diese Datei ist das Verzeichnis dazu. Die Dateien selbst liegen unveraendert
 * unter `material/` — wir schreiben sie nicht um, wir ordnen sie nur ein. Wo
 * dieselbe Datei in mehreren Skills lag, hat die neueste Fassung gewonnen.
 *
 * Warum im Repo und nicht nur in der Datenbank: Was in der Datenbank steht,
 * kann niemand in einem Diff lesen. Die Datenbank wird aus diesem Verzeichnis
 * befuellt, nicht umgekehrt.
 */

export interface MaterialDef {
  /** Dateiname unter lib/agents/material/ */
  file: string
  /** Paketschluessel — mehrere Dateien duerfen sich eines teilen. */
  pack: string
  /** methode | voice | verbote | kanal | beispiele | vorlage | hook | cta | material | anleitung */
  kind: string
  name: string
  description?: string
  /** Schlagworte fuer die Auswahl. Der Dateiname steuert nichts, das hier schon. */
  tags: string[]
  /** Nicht an Ueberschriften zerlegen — die Datei ist als Ganzes ein Gedanke. */
  whole?: boolean
  weight?: number
  /** Gilt immer, wird nie ausgewaehlt, steht in jedem Schreibschritt im Prompt. */
  pflicht?: boolean
}

const T = (...t: string[]) => t

export const MATERIAL: MaterialDef[] = [
  /* ── Pflicht: gilt in jedem Schreibschritt, ohne Auswahl ───────────────── */
  {
    file: 'ref-kernregelwerk.md', pack: 'regelwerk', kind: 'methode', weight: 100, whole: true, pflicht: true,
    name: 'Kernregelwerk — die zehn Spielregeln',
    description: 'Die einzige Pflicht-Regeldatei. Alles andere setzen Linter und Prüfung durch.',
    tags: T('regel', 'pflicht'),
  },
  {
    file: 'forbidden-words.md', pack: 'verbote', kind: 'verbote', weight: 100, whole: true, pflicht: true,
    name: 'Verbotsliste',
    description: 'Version 1.2. Der Linter prüft, was sich prüfen lässt; der Rest gilt trotzdem.',
    tags: T('verbot', 'pflicht'),
  },
  {
    file: 'voice-charter-DE.md', pack: 'voice.markus', kind: 'voice', weight: 95, whole: true, pflicht: true,
    name: 'Voice-Charta (DE)',
    tags: T('voice', 'markus', 'pflicht'),
  },
  {
    file: '00-markus-voice-profile.md', pack: 'voice.markus', kind: 'voice', weight: 95, pflicht: true,
    name: 'Stimmprofil Markus Eilers',
    description: 'Bei Kollision mit einem Guru-Profil gewinnt dieses hier.',
    tags: T('voice', 'markus', 'pflicht'),
  },
  {
    file: 'self-check-prompt.md', pack: 'selbstpruefung', kind: 'methode', weight: 90, whole: true, pflicht: true,
    name: 'Selbstprüfung vor der Abgabe',
    tags: T('pruefung', 'pflicht'),
  },
  { file: 'voice-charter-EN.md', pack: 'voice.markus', kind: 'voice', weight: 60, whole: true, name: 'Voice Charter (EN)', tags: T('voice', 'markus', 'englisch') },

  /* ── Die Stimmen ───────────────────────────────────────────────────────── */
  {
    file: '05-kennedy-voice-profile.md', pack: 'voice.kennedy', kind: 'voice',
    name: 'Stimmprofil Dan Kennedy',
    description: 'Direct Response: Drei-Headlines, Stack-Slide, Risk-Reversal, Reason-Why. Urgency und Drohkulisse bleiben draußen.',
    tags: T('voice', 'kennedy', 'direct-response', 'sales-letter', 'angebot'),
  },
  {
    file: '01-welsh-voice-profile.md', pack: 'voice.welsh', kind: 'voice',
    name: 'Stimmprofil Justin Welsh',
    description: 'Solopreneur-Klarheit: kurze Zeilen, ein Gedanke, Hook-Line vor dem Umbruch.',
    tags: T('voice', 'welsh', 'linkedin', 'newsletter', 'kurzform'),
  },
  {
    file: '04-graziosi-voice-profile.md', pack: 'voice.graziosi', kind: 'voice',
    name: 'Stimmprofil Dean Graziosi',
    description: 'Story-First, Identifikation, der Leser als Held seiner eigenen Geschichte.',
    tags: T('voice', 'graziosi', 'story', 'buehne', 'webinar'),
  },
  {
    file: 'vosler-methods.md', pack: 'voice.vosler', kind: 'voice',
    name: 'Sean Vosler — Methoden und Frameworks',
    description: '7 Figure Marketing Copy: Imitation Game, Jugular Objection, Belief-Change. Für Long-Form, Landingpages, Sequenzen.',
    tags: T('voice', 'vosler', 'longform', 'sales-letter', 'landingpage', 'belief'),
  },
  {
    file: '03-kern-voice-profile.md', pack: 'voice.kern', kind: 'voice',
    name: 'Stimmprofil Frank Kern',
    description: 'Lockerheit ohne Anbiederung, Results-in-Advance, der Skim-Bogen der Zwischenüberschriften.',
    tags: T('voice', 'kern', 'video', 'webinar', 'ueberschriften'),
  },
  {
    file: '02-braun-voice-profile.md', pack: 'voice.braun', kind: 'voice',
    name: 'Stimmprofil Josh Braun',
    description: 'Pain-First, Permission-Based, kein Druck. Für Kaltkontakt.',
    tags: T('voice', 'braun', 'cold-email', 'outreach'),
  },

  /* ── Methoden ──────────────────────────────────────────────────────────── */
  { file: 'kennedy-magnetic-close.md', pack: 'methode.close', kind: 'methode', name: 'Kennedy — Magnetic Close', tags: T('methode', 'kennedy', 'close', 'angebot') },
  { file: 'welsh-3-akt.md', pack: 'methode.welsh', kind: 'methode', name: 'Welsh — Drei Akte', tags: T('methode', 'welsh', 'struktur', 'kurzform') },
  { file: 'braun-poke-the-bear.md', pack: 'methode.braun', kind: 'methode', name: 'Braun — Poke the Bear', tags: T('methode', 'braun', 'cold-email', 'frage') },
  { file: 'suby-fletcher-magic-lantern.md', pack: 'methode.magic-lantern', kind: 'methode', name: 'Suby/Fletcher — Magic Lantern', tags: T('methode', 'sequenz', 'hvco', 'nachfass') },
  { file: 'ref-belief-chain-guide.md', pack: 'methode.belief-chain', kind: 'methode', whole: true, name: 'Belief-Chain — Leitfaden', description: 'Welche Überzeugungen der Leser in welcher Reihenfolge übernehmen muss.', tags: T('methode', 'belief', 'ueberzeugung', 'strategie') },
  { file: 'ref-decision-matrix.md', pack: 'methode.entscheidung', kind: 'methode', whole: true, name: 'Entscheidungsmatrix — welcher Kanal, welche Stimme, welches Framework', tags: T('methode', 'auswahl', 'kanal') },
  { file: 'ref-pipeline.md', pack: 'methode.pipeline', kind: 'methode', whole: true, name: 'Pipeline v3 — Stufen und Freigaben', tags: T('methode', 'ablauf', 'pipeline') },
  { file: 'ref-artefakt-vorlagen.md', pack: 'methode.artefakte', kind: 'methode', whole: true, name: 'Artefakt-Vorlagen der Pipeline', tags: T('methode', 'ablauf', 'artefakt') },
  { file: 'ref-hvco-channel-matrix.md', pack: 'methode.hvco', kind: 'methode', whole: true, name: 'HVCO — Kanalmatrix', tags: T('methode', 'hvco', 'kanal', 'sequenz') },

  /* ── Kanaele ───────────────────────────────────────────────────────────── */
  { file: '01-linkedin-post-DE.md', pack: 'kanal.linkedin', kind: 'kanal', name: 'Kanal: LinkedIn-Post', tags: T('kanal', 'linkedin') },
  { file: '02-newsletter-DE.md', pack: 'kanal.newsletter', kind: 'kanal', name: 'Kanal: Newsletter', tags: T('kanal', 'newsletter') },
  { file: '03-cold-email-DE.md', pack: 'kanal.cold-email', kind: 'kanal', name: 'Kanal: Cold-Email', tags: T('kanal', 'cold-email', 'outreach') },
  { file: '04-hvco-followup-DE.md', pack: 'kanal.hvco', kind: 'kanal', name: 'Kanal: HVCO-Nachfass', tags: T('kanal', 'hvco', 'nachfass', 'sequenz') },
  { file: 'hvco-email-sequences.md', pack: 'kanal.hvco', kind: 'kanal', name: 'HVCO — E-Mail-Sequenzen', tags: T('kanal', 'hvco', 'email', 'sequenz') },
  { file: 'hvco-linkedin-dm-sequences.md', pack: 'kanal.hvco', kind: 'kanal', name: 'HVCO — LinkedIn-DM-Sequenzen', tags: T('kanal', 'hvco', 'linkedin', 'sequenz') },
  { file: 'hvco-whatsapp-sms-sequences.md', pack: 'kanal.hvco', kind: 'kanal', name: 'HVCO — WhatsApp- und SMS-Sequenzen', tags: T('kanal', 'hvco', 'whatsapp', 'sequenz') },

  /* ── Vorlagen ──────────────────────────────────────────────────────────── */
  { file: 'linkedin-50-templates.md', pack: 'vorlage.linkedin', kind: 'vorlage', name: '50 LinkedIn-Vorlagen', tags: T('vorlage', 'linkedin', 'kurzform') },
  { file: 'newsletter-50-templates.md', pack: 'vorlage.newsletter', kind: 'vorlage', name: '50 Newsletter-Vorlagen', tags: T('vorlage', 'newsletter') },
  { file: 'blog-50-templates.md', pack: 'vorlage.blog', kind: 'vorlage', name: '50 Blog-Vorlagen', tags: T('vorlage', 'blog', 'longform', 'report', 'nachbereitung') },
  { file: 'twitter-threads-50-templates.md', pack: 'vorlage.thread', kind: 'vorlage', name: '50 Thread-Vorlagen', tags: T('vorlage', 'thread', 'x', 'kurzform') },
  { file: 'carousels-50-templates.md', pack: 'vorlage.carousel', kind: 'vorlage', name: '50 Carousel-Vorlagen', tags: T('vorlage', 'carousel', 'linkedin') },
  { file: 'youtube-shorts-50-templates.md', pack: 'vorlage.short', kind: 'vorlage', name: '50 Shorts-Vorlagen', tags: T('vorlage', 'short', 'video', 'youtube') },
  { file: 'instagram-reels-50-templates.md', pack: 'vorlage.reel', kind: 'vorlage', name: '50 Reel-Vorlagen', tags: T('vorlage', 'reel', 'video', 'instagram') },
  { file: 'ctas-by-strength-60-templates.md', pack: 'vorlage.cta', kind: 'cta', name: '60 CTAs nach Stärke', description: 'Von weich bis hart, sortiert. Die Stärke ist die Auswahl, nicht der Geschmack.', tags: T('cta', 'schluss', 'angebot') },
  { file: 'super-signatures-30-templates.md', pack: 'vorlage.signatur', kind: 'cta', name: '30 Super-Signaturen', tags: T('cta', 'signatur', 'newsletter', 'email') },
  { file: 'repository-05-offers-ctas.md', pack: 'vorlage.cta', kind: 'cta', name: 'Angebote und CTAs aus dem Repository', tags: T('cta', 'angebot') },

  /* ── Hooks, Headlines, Grabber ─────────────────────────────────────────── */
  { file: 'hook-bank-master.md', pack: 'hook.master', kind: 'hook', name: 'Hook- und Headline-Bank (Master)', tags: T('hook', 'headline', 'einstieg') },
  { file: 'ref-hook-cta-bank.md', pack: 'hook.master', kind: 'hook', name: 'Hook- und CTA-Bank', tags: T('hook', 'cta', 'headline') },
  { file: 'vosler-headline-formats-v2.md', pack: 'hook.vosler', kind: 'hook', name: 'Vosler — Headline-Formate (Vollextraktion)', description: 'Jede Formel ist template-fähig. Platzhalter in {…} füllen, dann durch die Verbotsliste filtern.', tags: T('hook', 'headline', 'vosler', 'formel') },
  { file: 'vosler-headline-hook-bank.md', pack: 'hook.vosler', kind: 'hook', name: 'Vosler — Headline- und Hook-Bank', tags: T('hook', 'headline', 'vosler') },
  { file: 'repository-01-headlines-hooks.md', pack: 'hook.repository', kind: 'hook', whole: true, name: 'Headlines und Hooks aus dem Repository', tags: T('hook', 'headline', 'eigen') },

  /* ── Beispiele ─────────────────────────────────────────────────────────── */
  { file: 'vosler-swipe-examples.md', pack: 'beispiele.vosler', kind: 'beispiele', name: 'Vosler — Swipes im Wortlaut', tags: T('beispiele', 'vosler', 'swipe', 'longform') },
  { file: 'repository-07-full-pieces.md', pack: 'beispiele.eigen', kind: 'beispiele', name: 'Eigene Texte im Wortlaut', tags: T('beispiele', 'eigen', 'markus') },
  { file: 'repository-08-ad-swipes.md', pack: 'beispiele.eigen', kind: 'beispiele', name: 'Anzeigen-Swipes', tags: T('beispiele', 'anzeige', 'swipe') },
  { file: 'example-TEMPLATE.md', pack: 'beispiele.eigen', kind: 'beispiele', whole: true, name: 'Aufbau eines Beispiel-Eintrags', tags: T('beispiele', 'form') },

  /* ── Stoff: Zahlen, Zitate, Programme ──────────────────────────────────── */
  { file: 'repository-02-data-points.md', pack: 'stoff.zahlen', kind: 'material', name: 'Datenpunkte mit Herkunft', description: 'Nur was hier steht, darf als Zahl in einen Text. Alles andere wird recherchiert oder weggelassen.', tags: T('stoff', 'zahlen', 'beleg') },
  { file: 'repository-03-talking-points.md', pack: 'stoff.argumente', kind: 'material', name: 'Argumente und Talking Points', tags: T('stoff', 'argument') },
  { file: 'repository-04-quotes-bio.md', pack: 'stoff.zitate', kind: 'material', name: 'Zitate und Biografisches', tags: T('stoff', 'zitat', 'bio', 'markus') },
  { file: 'repository-06-frameworks-programs.md', pack: 'stoff.frameworks', kind: 'material', name: 'Eigene Frameworks und Programme', tags: T('stoff', 'framework', 'programm', 'angebot') },

  /* ── Messaging-Audit ───────────────────────────────────────────────────── */
  {
    file: 'audit-rubrik.md', pack: 'audit.rubrik', kind: 'methode', weight: 100, whole: true,
    name: 'Scoring-Rubrik — 7 Dimensionen, je 1 bis 5',
    description: 'Ankerbeispiele bei 2, 3 und 4 Punkten. Immer lesen, nie aus dem Gedächtnis bewerten.',
    tags: T('audit', 'rubrik', 'scoring', 'pflicht'),
  },
  {
    file: 'audit-berichte.md', pack: 'audit.berichte', kind: 'methode', whole: true,
    name: 'Berichtsvorlagen — interne Fassung und Kundenfassung',
    description: 'Erst die interne Version, daraus die Prospect-Version destillieren.',
    tags: T('audit', 'bericht', 'vorlage'),
  },
  {
    file: 'audit-benchmark.md', pack: 'audit.benchmark', kind: 'methode', whole: true,
    name: 'Benchmark-Datenbank — Schema und Mechanik',
    tags: T('audit', 'benchmark', 'vergleich'),
  },
  {
    file: 'audit-anleitung.md', pack: 'audit.anleitung', kind: 'anleitung', whole: true,
    name: 'Prospect-Audit — Arbeitsweise und Quellenklassen',
    tags: T('audit', 'anleitung', 'quellen'),
  },
  {
    file: 'audit-broschuere.md', pack: 'audit.broschuere', kind: 'anleitung', whole: true,
    name: 'Messaging-Audit-Broschüre — Seitenplan der EFGMA-Serie',
    tags: T('audit', 'anleitung', 'broschuere', 'layout'),
  },

  /* ── Anleitungen: wie die Skills selbst arbeiten ───────────────────────── */
  { file: 'skill-v3.md', pack: 'anleitung.v3', kind: 'anleitung', whole: true, name: 'Writer v3 — Arbeitsweise', tags: T('anleitung', 'ablauf') },
  { file: 'skill-pro.md', pack: 'anleitung.pro', kind: 'anleitung', whole: true, name: 'Writer Pro — Arbeitsweise', tags: T('anleitung', 'ablauf') },
  { file: 'skill-cw.md', pack: 'anleitung.cw', kind: 'anleitung', whole: true, name: 'Content-Writer — Arbeitsweise', tags: T('anleitung', 'ablauf') },
  { file: 'agent-stratege.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Stratege', tags: T('anleitung', 'rolle', 'belief') },
  { file: 'agent-architekt.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Architekt', tags: T('anleitung', 'rolle', 'struktur') },
  { file: 'agent-schreiber.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Schreiber', tags: T('anleitung', 'rolle', 'prosa') },
  { file: 'agent-punchliner.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Punchliner', tags: T('anleitung', 'rolle', 'hook') },
  { file: 'agent-qs-pruefer.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: QS-Prüfer', tags: T('anleitung', 'rolle', 'pruefung') },
  { file: 'agent-challenger.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Challenger', tags: T('anleitung', 'rolle', 'kritik') },
  { file: 'agent-bibliothekar.md', pack: 'anleitung.rollen', kind: 'anleitung', whole: true, name: 'Rolle: Bibliothekar', tags: T('anleitung', 'rolle', 'katalog') },
]

/** Die Pakete, die in jedem Schreibschritt gelten — ohne Auswahl, ohne Ausnahme. */
export const PFLICHT_PACKS = [...new Set(MATERIAL.filter((m) => m.pflicht).map((m) => m.pack))]

/** Die waehlbaren Stimmen. Markus ist nicht dabei: er gilt immer. */
export const STIMMEN = MATERIAL
  .filter((m) => m.kind === 'voice' && m.pack !== 'voice.markus')
  .map((m) => ({ pack: m.pack, name: m.name, wofuer: m.description ?? '', tags: m.tags }))
