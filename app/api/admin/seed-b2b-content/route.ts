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
    'Über die folgenden Jahre haben wir den Bauplan in Dutzenden B2B-Unternehmen getestet — Maschinenbau, IT-Security, SaaS-Mid-Market, Druckindustrie, Industrie-Holdings. Wir haben ihn in unseren eigenen Angeboten geschliffen, bevor wir ihn weitergegeben haben. Jede Iteration hatte denselben Anspruch: das Angebot muss so gut erklärt und so klar verpackt sein, dass der Käufer es kaum erwarten kann, zuzugreifen — auch im B2B. Besonders im B2B.',
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
      else if (s.type === 'problem') next = SCI_FI
      else if (s.type === 'origin_story') next = ORIGIN
      else if (s.type === 'framework_steps') next = { ...c, ...STEPS_GRID_LAYOUT_AND_RESULT }
      else if (s.type === 'lead_magnet') next = { ...c, ...LEAD_MAGNET_IMAGE }
      if (next) {
        await db.update(landingPageSections)
          .set({ content: next, updatedAt: new Date() })
          .where(eq(landingPageSections.id, s.id))
        updated++
      }
    }

    return NextResponse.json({ ok: true, updated, slug: SLUG })
  } catch (err) {
    console.error('[seed-b2b-content] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
