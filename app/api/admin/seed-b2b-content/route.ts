import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Admin-only: upsert the new content blocks for b2b-angebote landing page.
 * Idempotent — running again just overwrites with the same content.
 * Triggered via POST /api/admin/seed-b2b-content (Bearer or admin session).
 */

const SLUG = 'b2b-angebote'

const HERO = {
  eyebrow: 'SALESMADE · PILLAR-ASSET',
  headline: 'Der geheime Bauplan für unwiderstehliche B2B-Angebote.',
  subheadline:
    'So einfach macht Dein Growth Team jedes B2B-Angebot unwiderstehlich. In 8 einfachen Schritten.',
  pills: ['5× überzeugender', '37 % zufriedenere Kunden', '58 % profitabler', '500+ Gründer:innen'],
  ctaLabel: 'Sichere dir den Bauplan',
  ctaHref: '#bauplan',
  showEmailForm: false,
}

const SCI_FI = {
  tone: 'positive',
  eyebrow: 'WAS NACH DEM BAUPLAN NORMAL WIRD',
  headline: 'Acht Wochen später fragst du dich, warum du es nicht eher gemacht hast.',
  subheadline:
    'Neun Dinge, die unsere Klienten 90 Tage nach dem Bauplan als selbstverständlich erleben — und die vorher noch wie Sales-Romantik klangen.',
  items: [
    { title: 'Du gibst keine Rabatte mehr', description: 'Nicht weil du stur bist, sondern weil dein Angebot keinen mehr nötig hat. Substanz ersetzt Verhandlung.' },
    { title: 'Deals slippen nicht mehr durch Phase 2', description: 'Der Pfad steht, jede Phase hat eine Währung. Der Kunde verschiebt nicht, weil er weiß, was er verschiebt.' },
    { title: 'Dein Kunde versteht, was du tust', description: 'Ohne ein einziges Feature zu nennen. Du sprichst die echten Schmerzen — heute und morgen.' },
    { title: 'Termine werden geplant, nicht erhofft', description: 'Jeder Besuch hat einen Plan und eine Hypothese. Wunsch-Denken bleibt im Schreibtisch.' },
    { title: 'Fünf Kunden in einer Woche', description: 'Ohne Hustle, ohne Marathon. Ein Angebot, das jeder Stakeholder in drei Minuten versteht und am Mittagstisch verteidigen kann.' },
    { title: '200 % der Ziele — bei weniger Arbeitsstunden', description: 'Phasen-Währung ersetzt Arbeits-Tagebuch. Du verkaufst Ergebnisse, keine Stunden.' },
    { title: 'Verkaufen ohne hinterherzujagen', description: 'Wenn dein Angebot trägt, trägt es sich selbst weiter. Empfehlungen kommen von Vorständen, die dich nie persönlich getroffen haben.' },
    { title: 'Kunden, die ihr Wort halten', description: 'Wort-Garantie aus deinem Lieferversprechen. Reziprozität, die im B2B normalerweise nicht passiert.' },
    { title: 'Stabile Preise, sechsstellig', description: 'Verteidigbare Preise halten stabil. Beweise machen sie verteidigbar. Beides ist Bauplan, nicht Glück.' },
  ],
}

const ORIGIN = {
  eyebrow: 'WIE DER BAUPLAN ENTSTANDEN IST',
  headline: 'Vom 14-Features-Pitch zum Bauplan.',
  paragraphs: [
    'In den ersten zehn Jahren in seinem Systemhaus hat Markus Angebote mit vierzehn Features geschrieben. Jedes Feature war stolz erkämpft, jedes hatte seinen Platz. Bis ein Kunde, mit dem er gerade unterschrieb, ihn am Tisch fragte: „Markus, jetzt mal ehrlich — was bedeutet das alles für meine Firma? Konkret?"',
    'Er konnte es nicht in einem Satz sagen.',
    'Das war der Tag, an dem das Beef-Radar entstanden ist. Die Regel ist seitdem: Wenn ich bei einem Baustein nicht in einem Satz sagen kann, was er beim Kunden auslöst, gehört er entweder neu gedacht — oder raus.',
    'Über die folgenden Jahre haben wir den Bauplan in Dutzenden B2B-Unternehmen getestet — Systemhäuser, Software-Hersteller, Hardware-Hersteller, Beratungen, SaaS, Telekommunikation. Wir haben ihn in unseren eigenen Angeboten geschliffen, bevor wir ihn weitergegeben haben. Jede Iteration hatte denselben Anspruch: das Angebot muss so gut erklärt und so klar verpackt sein, dass der Käufer es kaum erwarten kann, zuzugreifen — auch im B2B. Besonders im B2B.',
    'Acht Schritte sind übrig geblieben. Drei davon sind unsere eigenen Layer, die wir in keinem anderen Verkaufs-Framework systematisch gefunden haben: Sichtbarer Pfad, Phasen-Währung, Doppelschmerz mit Zukunfts-Ebene. Heute nutzen 500+ Gründer:innen den Bauplan — und die ersten Vorstände bei unseren Klienten haben angefangen, ihn als interne Methodik einzuziehen.',
  ],
}

const STEPS_GRID_LAYOUT_AND_RESULT = {
  layout: 'grid',
  resultTile: {
    eyebrow: 'Was am Ende rauskommt',
    headline: 'Ein Angebot, das verteidigbar ist — vom Espresso-Test bis zum CFO-Tisch.',
    body: 'Acht Schritte, vier Stunden, ein unwiderstehliches B2B-Angebot. Wiederholbar, ohne Marketing-Lehrbuch, ohne Talent-Lotterie.',
    metrics: [
      { value: '5×', label: 'überzeugender' },
      { value: '+58 %', label: 'profitabler' },
    ],
  },
}

const LEAD_MAGNET_IMAGE = {
  imageSrc: '/frameworks/b2b-bauplan-cover.jpg',
}

const STEPS_FULL = [
  {
    "title": "Beef-Radar · Inhalte → Value → Impact",
    "description": "Wir gehen die Top-5 Bausteine deines Angebots durch — pro Baustein: direkter Effekt, Wellen-Effekt, messbarer Impact mit Zahl und Einheit. Am Ende eine Karte mit fünf Zeilen, die dein Kunde lesen kann, ohne dass jemand danebensteht.",
    "example": "Statt „professionelle Betreuung“ steht „−45 Min Dokumentationszeit pro Behandlertag (Customer-Avg, Sonia.so 2024)“. Aus Feature wird Effekt — und Effekt verkauft. Wenn ein CFO in die Runde fragt „Was bringt uns das konkret?“, hast du eine Zeile, die dein Champion auswendig weiß.",
    "tip": "Wenn du den Effekt nicht in einem Satz sagen kannst, gehört der Baustein neu gedacht oder raus. Kürzere Angebote werden öfter unterschrieben."
  },
  {
    "title": "Doppelschmerz · Heute & Morgen",
    "description": "Welche Probleme löst dein Angebot heute schon — und welche kommen in 12 bis 24 Monaten so sicher, dass du sie gleich mit-adressierst? Heute-gelöst macht relevant. Morgen-vorausgesehen macht strategisch. Strategische Angebote verkaufen sich teurer und länger.",
    "example": "„Heute löst Sonia 45 Min Dokumentationszeit pro Behandlertag. Morgen verhindert sie, dass deine Praxis von der BEMA-Verschärfung 2027 überrascht wird — alle Behandlungen sind ab Tag 1 strukturiert dokumentiert.“ Heute + Morgen, eine Brücke, ein Angebot.",
    "tip": "Wenn dein Angebot nur das Heute löst, ist es ein Pflaster. Wenn es beide adressiert, ist es eine Strecke. Strecken haben einen anderen Preis als Pflaster."
  },
  {
    "title": "Sichtbarer Pfad · Bulletproof Delivery Plan",
    "description": "Wir machen sichtbar, wie dein Angebot wirkt — als Sequenz von 3 bis 5 benannten Phasen, jede mit Input, Output und Dauer in Wochen. Sobald dein Kunde den Weg sehen kann, schrumpft die Entscheidung. Er schaut nicht mehr auf den Berg, sondern auf den ersten Schritt.",
    "example": "„Aufräumen · Aufstellen · Abliefern“ (3 Phasen, 12 Wochen, gleiche Grammatik, gleiche Silbenanzahl). Drei Wörter, die im Slack-Chat hängen bleiben. Ein Sales-Coach aus München hat seinen 12-Wochen-Sprint so neu strukturiert — beim nächsten Pitch sagte der Kunde: „Das Blatt hat mehr verkauft als ich.“",
    "tip": "Ohne Pfad muss dein Kunde dir vertrauen. Mit Pfad muss er nur den Plan vorlegen — und der Plan überzeugt weiter, wenn du nicht im Raum bist."
  },
  {
    "title": "Phasen-Währung · Currency pro Phase",
    "description": "Pro Phase eine Hauptwährung mit Baseline, Drei-Punkt-Korridor (Pessimist / Realist / Optimist) und Mess-Zeitpunkt. Aus „wir helfen Ihnen“ wird „in Phase 2 verschieben wir die Annahmequote um 12 Punkte — gemessen Woche 8“.",
    "example": "SaaS-Onboarding für Mid-Market — Phase 1: Time-to-First-Value (Baseline 31 Tage → Ziel ≤ 14). Phase 2: Aktivierungs-Rate Kern-Feature (38 % → ≥ 65 %). Phase 3: 30-Tage-Retention (71 % → ≥ 85 %). Ein VP Customer Success hat die Tabelle abfotografiert und zum CFO mitgenommen.",
    "tip": "Pricing wird gegen Realist verteidigt. Garantie wird gegen Pessimist geschrieben. Optimist ist Up-Side, nicht Versprechen."
  },
  {
    "title": "Beweis-Stapel · ROI-Hypothesen oder Beweise",
    "description": "3 bis 7 Beweise nach Klassen: A=Named Customer, B=Customer-Avg, C=Hypothese mit Methodik, D=Branchen-Benchmark, E=Testimonial-Quote. Mindestens 2 aus A oder B im Top-3.",
    "example": "IT-Security aus Wien: 10.000 €/MA/Jahr eingespart (Customer-Avg, belegt aus 7 Implementierungen seit 2021, Range 4.000-18.000 €). Im Pitch: „Bei 200 MA wären das 2 Mio €/Jahr — selbst im Pessimist-Korridor noch 800k.“ Methodik macht aus der Marketing-Floskel ein CFO-Argument.",
    "tip": "Eine Hypothese ohne Methodik ist eine Marketing-Floskel mit Zahl. Eine Hypothese mit Methodik („3 FTE × 4h/Wo × 47 Wo × 90 €/h = 50.760 €“) wird im Vorstand übernommen."
  },
  {
    "title": "Booster · Adjacent Pain, mit Anker",
    "description": "1 bis 3 Booster, die ein angrenzendes Problem lösen, das der Kunde im Pitch nicht erwartet hat. Echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts. Bonus ist nicht „mehr für gleichen Preis“ — Bonus ist „zweites Problem gelöst, mit €-Anker und Margin-Schutz“.",
    "example": "Agentur in Hamburg, 24k-Programm. Hängepartie von 6 Wochen zwischen Pitch und Zusage. Booster: „Pre-Kickoff Audit-Workshop. Wert 4.500 €. Im Programm enthalten.“ Echter Aufwand: halber Tag, den sie ohnehin in Woche 1 machten. Nächster Pitch: „Wann starten wir?“ — direkt.",
    "tip": "Wenn jemand „geht da nicht was am Preis?“ fragt, antwortest du nicht mit %, sondern mit „Wir machen Y mit drauf — den Wert dazu kannst du in der Tabelle sehen.“"
  },
  {
    "title": "Wort-Garantie · Verteidigbare Garantie",
    "description": "Eine Garantie, die du beim Espresso aussprechen kannst, weil dein Lieferversprechen sie trägt. Typ + Trigger + Konsequenz + Liefer-Anker (Phase aus Schritt 3 + Währung aus Schritt 4) + Espresso-Test bestanden.",
    "example": "„Wenn nach Phase 2 die Annahmequote nicht um mindestens 8 Punkte steigt, läuft Phase 3 ohne weitere Rechnung.“ Konkret. Datiert. An Phase und Währung gebunden. Kein „Geld zurück bei Unzufriedenheit“ — sondern ein Verkäufer-Versprechen, das CFOs öffnet, ohne dass du Preis bewegen musst.",
    "tip": "„100 % Zufriedenheits-Garantie“ ist ein Marketing-Schwur. Eine Wort-Garantie ist ein Verkäufer-Versprechen. Der Unterschied schlägt sich in der Pricing-Power nieder."
  },
  {
    "title": "Die letzten 20 % · Name + Headline + CTA",
    "description": "Cooler Name, geniale Headline, klarer CTA — drei Mikro-Entscheidungen, die das Angebot lesbar machen oder verkleben. Zum Schluss, nicht am Anfang. Weil sie aus den ersten sieben Schritten gespeist werden — nicht aus dem Marketing-Lehrbuch.",
    "example": "„Der Wachstumsmotor für den Maschinenbau“ — Stil [Substantiv] für [Branche]. Im Slack-Chat teilbar, im Espresso aussprechbar, in 3 Sekunden einsortierbar. Headline: „In 12 Wochen zu einer Annahmequote über 50 % — ohne dass du jeden Pitch persönlich rettest.“ CTA: „45-Min-Sparring buchen“.",
    "tip": "Espresso-Test (Slack, Espresso, Google, Domain, 3-Jahre) muss mindestens 4/5 bestehen. Sonst weiter iterieren — Naming ist Ringen, kein Genie-Blitz."
  }
]

const FAQ_FULL = {
  eyebrow: 'HÄUFIGE FRAGEN',
  headline: 'Was du wissen willst, bevor du startest.',
  items: [
  {
    "q": "Funktioniert das auch ohne Markus?",
    "a": "Ja. Genau das ist der Punkt. Der Bauplan ist Methodik, nicht Magie. Sobald dein Growth Team ihn einmal durchläuft, kann es ihn das zweite Mal alleine. Beim ersten Angebot bist du dabei (oder dein Senior-Verkäufer). Beim dritten merkst du, dass dein Team Fragen stellt, die du selbst auch gestellt hättest — nur ohne dich. Wenn ein Angebot später verklemmt: prüfe es mit drei Fragen — Beef-Radar? Phasen-Währung? Beweis-Stapel?"
  },
  {
    "q": "Wie lange dauert es, ein Angebot durchzubauen?",
    "a": "Erstes Angebot mit dem Wizard: 3-4 Stunden konzentriert, mit Pausen verteilt über 2 Tage. Zweites: 90 Min. Drittes: 45 Min. Du machst nicht weniger Substanzarbeit — du machst sie schneller, weil du den Pfad schon kennst. Templates sind die schnellste Lehrweise."
  },
  {
    "q": "Wir sind kein Mid-Market-DACH — passt das trotzdem?",
    "a": "Wenn du im B2B verkaufst, wenn dein Sales-Cycle länger als ein Tag dauert, wenn dein Angebot mehr als ein SKU ist — ja, passt. Die Beispiele sind aus dem DACH-Mittelstand (Systemhäuser, Software-Hersteller, SaaS, Beratungen, Telekommunikation), weil das mein Coaching-Pool ist. Die Mechanik ist branchenneutral. Was nicht passt: B2C-Direct-to-Consumer, reines Self-Service-SaaS unter 500 €/Monat, Einmal-Spontankäufe."
  },
  {
    "q": "„Unwiderstehlich“ — ist das nicht Marketing-Übertreibung?",
    "a": "Verständliche Frage. Antwort: Wenn alle Schritte sitzen, fühlt es sich tatsächlich anders an — beim Pitch, beim Champion, beim Vorstand. Wir messen nicht mit „Begeisterung“. Wir messen mit Annahmequote (28 % → 53 % bei einem unserer Klienten), Sales-Cycle (unter 3 Monaten), 5× wahrgenommener Überzeugungskraft, 58 % höhere Profitabilität. Unwiderstehlich heißt nicht „alle sagen Ja“. Heißt: Die richtigen sagen schneller Ja, die falschen früher Nein. Beides spart Zeit."
  },
  {
    "q": "Wir haben schon zu Offer-Design gelesen — was ist hier neu?",
    "a": "Drei Layer, die in den meisten Standard-Modellen nicht systematisch sind: (1) Sichtbarer Pfad als visualisierbare Methodik mit Phasen-Architektur — kein Wischiwaschi. (2) Phasen-Währung pro Phase, nicht nur ROI am Ende. Der Markus-Unterschied. (3) Doppelschmerz mit Zukunfts-Layer — heute UND morgen. Plus: Wir sind im DACH-Mittelstand kalibriert. Sprache, Pitch-Kultur, Vorstands-Rituale — alles anders als im US-Coaching-Markt."
  },
  {
    "q": "Wo ist die Garantie?",
    "a": "In Schritt 7. Ironisch, oder? Auf das PDF: 30-Tage-Refund-Window, voller Refund, ohne Begründung. Auf den Wizard: erste 5 Tage testen, Cancel ohne Begründung. Auf die Academy (1.997 €): Wenn dein Team nach 12 Wochen die ersten 5 Pitches nicht mit dem Bauplan durchgeführt hat, läuft die Office-Hours-Begleitung 8 Wochen länger kostenfrei. Wir praktizieren, was wir predigen."
  },
  {
    "q": "Funktioniert der AI-Begleiter, wenn ich kein KI-Profi bin?",
    "a": "Genau dafür ist er gebaut. Der Wizard stellt dir keine technischen Fragen — er stellt die richtigen Fragen, die ich im Coaching auch stelle. Wenn du eine Floskel tippst, hält er dich an. Wenn du substanziell antwortest, gibt er dir das nächste Kompliment und führt dich weiter. Keine Prompts schreiben, keine Tokens zählen. Nur denken, antworten, weitermachen."
  },
  {
    "q": "Was passiert, wenn ich nach Schritt 4 hängen bleibe?",
    "a": "Pause-und-Resume (Wizard speichert alle 20 Sekunden), Beispiele anschauen (pro Schritt 3 gute + 1 schlechtes), oder Office-Hours buchen (Academy / Founding-30). Schritt 4 ist statistisch der häufigste Hänger — Phasen-Währung braucht Baseline-Daten, die du oft erst recherchieren musst. Plan ein, nicht Versagen. Komm einen Tag später zurück mit den drei Zahlen, und Schritt 5 läuft in 30 Min."
  }
],
}

const SITUATION = {
  "tone": "negative",
  "eyebrow": "WO DU GERADE STEHST",
  "headline": "Klingt das vertraut?",
  "subheadline": "Sechs Beobachtungen aus über 100 B2B-Coaching-Gespraechen. Wenn drei oder mehr passen, hast Du kein Sales-Problem. Du hast ein Beef-Problem.",
  "items": [
    {
      "title": "Dein Team produziert Angebote ad hoc, in unterschiedlicher Qualitaet",
      "description": "Du rettest jeden zweiten Pitch persoenlich — und merkst, dass das System nicht skaliert."
    },
    {
      "title": "Sales-Cycles ziehen sich, Annahmequoten stagnieren",
      "description": "Die richtigen Leute sagen zu langsam Ja. Die falschen sagen zu spaet Nein. Beides kostet."
    },
    {
      "title": "Wettbewerber-Angebote machen Eure Loesung vergleichbar",
      "description": "Du landest in Excel-Tabellen, in denen nur der Preis zaehlt. Marge erodiert, ohne dass jemand es merkt."
    },
    {
      "title": "Eure Angebote sind zu voll — und gleichzeitig zu duenn",
      "description": "Je hoeher der Preis, desto voller die Schachtel. Das hilft weder Euch noch dem Kunden. 14 Features, kein Effekt-Satz."
    },
    {
      "title": "Die Sprache passt nicht zum Entscheider",
      "description": "Was Ihr koennt, kommt im Vorstandsraum nicht an. Der Champion kann es nicht weitererzaehlen — die Methodik fehlt."
    },
    {
      "title": "Du ahnst, dass das Angebot selbst der Engpass ist",
      "description": "Nicht der Vertrieb. Nicht das Pitch-Talent. Du bist muede von noch-mehr-Sales-Coaching und willst Substanz im Angebot."
    }
  ],
  "body": "Wenn das sitzt: Du brauchst keinen neuen Verkaufstrick. Du brauchst einen Bauplan. Acht Schritte, vier Stunden — damit Dein Team jedes Angebot wiederholbar unwiderstehlich macht, ohne dass Du jeden Pitch persoenlich rettest."
}

export async function POST(request: Request) {
  // Auth: admin session OR a one-time bearer token via SEED_TOKEN env
  const session = await auth().catch(() => null)
  const authHeader = request.headers.get('authorization')
  const seedToken = process.env.SEED_TOKEN
  const okSession = session?.user?.role === 'admin' || session?.user?.role === 'coach'
  const okBearer = seedToken && authHeader === `Bearer ${seedToken}`
  if (!okSession && !okBearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [page] = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.slug, SLUG))
      .limit(1)
    if (!page) {
      return NextResponse.json({ error: `landing_page not found: ${SLUG}` }, { status: 404 })
    }

    const sections = await db
      .select()
      .from(landingPageSections)
      .where(eq(landingPageSections.landingPageId, page.id))

    let updated = 0
    for (const s of sections) {
      const c = (s.content ?? {}) as Record<string, unknown>
      let next: Record<string, unknown> | null = null
      if (s.type === 'hero') next = { ...c, ...HERO }
      else if (s.type === 'problem' && (((s.content ?? {}) as Record<string, unknown>).eyebrow !== 'WO DU GERADE STEHST')) next = SCI_FI
      else if (s.type === 'origin_story') next = ORIGIN
      else if (s.type === 'framework_steps') next = { ...c, ...STEPS_GRID_LAYOUT_AND_RESULT, steps: STEPS_FULL }
      else if (s.type === 'faq') next = FAQ_FULL
      else if (s.type === 'lead_magnet') next = { ...c, ...LEAD_MAGNET_IMAGE }
      if (next) {
        await db.update(landingPageSections)
          .set({ content: next, updatedAt: new Date() })
          .where(eq(landingPageSections.id, s.id))
        updated++
      }
    }


    // Insert Situation-Section if not present (before existing positive 'problem' section)
    try {
      const existingTypes = sections.map((s) => s.type)
      const hasSituation = sections.some((s) => {
        const c = (s.content ?? {}) as Record<string, unknown>
        return c.eyebrow === 'WO DU GERADE STEHST'
      })
      if (!hasSituation) {
        // Find existing 'problem' section order
        const problemSection = sections.find((s) => s.type === 'problem')
        const insertAt = problemSection ? problemSection.order : 2
        // Shift orders of sections at or after insertAt by +1
        await db.execute(sql`
          UPDATE landing_page_sections
          SET "order" = "order" + 1
          WHERE landing_page_id = ${page.id} AND "order" >= ${insertAt}
        `)
        // Insert new problem section with SITUATION content
        await db.insert(landingPageSections).values({
          landingPageId: page.id,
          type: 'problem',
          order: insertAt,
          isVisible: true,
          content: SITUATION,
        })
        updated++
      } else {
        // Update existing situation content
        const target = sections.find((s) => {
          const c = (s.content ?? {}) as Record<string, unknown>
          return c.eyebrow === 'WO DU GERADE STEHST'
        })
        if (target) {
          await db.update(landingPageSections)
            .set({ content: SITUATION, updatedAt: new Date() })
            .where(eq(landingPageSections.id, target.id))
          updated++
        }
      }
    } catch (err) {
      console.error('[seed-b2b] situation insert failed:', err)
    }

    return NextResponse.json({ ok: true, updated, slug: SLUG })

  } catch (err) {
    console.error('[seed-b2b-content] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
