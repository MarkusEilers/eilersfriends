'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
}

const B2B_SLUG = 'b2b-angebote'

/**
 * Seedet die /b2b-offers-Page als Framework-Eintrag in der DB.
 * Idempotent: wenn der Slug schon existiert, wird er aktualisiert + zurückgegeben.
 */
export async function seedB2BOffersAsFramework() {
  await requireAdmin()

  // Check existing
  const [existing] = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.slug, B2B_SLUG))
    .limit(1)

  let pageId: string

  if (existing) {
    // Update meta + delete old sections, re-create
    await db.update(landingPages).set({
      title: 'Unwiderstehliche B2B-Angebote',
      metaDescription:
        'Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — in 8 einfachen Schritten. Inkl. Video-Masterclass.',
      accentColor: '#1A5FD4',
      templateKey: 'framework-leadmagnet',
      status: 'published',
      updatedAt: new Date(),
    }).where(eq(landingPages.id, existing.id))
    await db.delete(landingPageSections).where(eq(landingPageSections.landingPageId, existing.id))
    pageId = existing.id
  } else {
    const [created] = await db.insert(landingPages).values({
      slug: B2B_SLUG,
      title: 'Unwiderstehliche B2B-Angebote',
      metaDescription:
        'Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — in 8 einfachen Schritten. Inkl. Video-Masterclass.',
      status: 'published',
      locale: 'de',
      accentColor: '#1A5FD4',
      templateKey: 'framework-leadmagnet',
      emailList: 'b2b-angebote',
    }).returning()
    pageId = created.id
  }

  // Build section list — the 8-step framework
  const sections: { type: string; content: Record<string, unknown> }[] = [
    {
      type: 'hero',
      content: {
        eyebrow: 'KOSTENLOS · SOFORT VERFÜGBAR',
        headline: 'Unwiderstehliche B2B-Angebote in 8 einfachen Schritten.',
        subheadline:
          'Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — inklusive Video-Masterclass von Markus Eilers.',
        ctaLabel: 'Zum Bauplan',
        ctaHref: '#download',
      },
    },
    {
      type: 'problem',
      content: {
        eyebrow: 'Der Schmerzpunkt',
        headline: 'Warum die meisten B2B-Angebote nicht überzeugen.',
        items: [
          {
            title: 'Generische Pakete',
            description: 'Drei Tier-Optionen ohne klaren Mehrwert. Käufer verstehen den Unterschied nicht — und entscheiden sich gegen alle.',
          },
          {
            title: 'Fehlender Proof-Stack',
            description: 'Behauptungen ohne Belege. Case Studies fehlen, Zahlen sind weich, Testimonials wirken erfunden.',
          },
          {
            title: 'Verhandelt statt verkauft',
            description: 'Der Preis wird zur Diskussion statt zur Konsequenz. Der Verkäufer rechtfertigt, statt zu führen.',
          },
        ],
      },
    },
    {
      type: 'framework_steps',
      content: {
        eyebrow: 'Der Bauplan',
        headline: 'Das 8-Schritte-Framework',
        subheadline:
          'Jeder Schritt ist sofort umsetzbar. Beispiele aus echten B2B-Cases von 500+ Gründer:innen.',
        steps: [
          {
            title: 'Definiere, wen du wirklich bedienst',
            description:
              'Kein „Geschäftsführer von KMUs" mehr. Eng, spezifisch, mit Branche, Größe und Reife-Grad. Wer das überspringt, verkauft an alle und gewinnt keinen.',
            example:
              'Statt „B2B-SaaS-Founder" → „Founder von B2B-SaaS-Unternehmen mit €500k-€3M ARR, deren Vertriebsteam 5–10 Verkäufer:innen umfasst."',
            tip: 'Wenn dein ICP in einen Tweet passt, ist er noch nicht eng genug.',
          },
          {
            title: 'Identifiziere den stärksten Schmerzpunkt',
            description:
              'Nicht das Symptom, sondern die Wurzel. Was kostet sie wirklich Schlaf? Was bezahlen sie indirekt schon, bevor sie dich finden?',
            example:
              '„Pipeline-Generierung ist random" → echter Schmerz: „Forecasts sind Fiktion. Mein Board glaubt mir nicht mehr."',
          },
          {
            title: 'Formuliere deinen Transformation-Promise',
            description:
              'Vom Status quo (vorher) zum gewünschten Outcome (nachher) in einem Satz. Kein Feature, sondern eine Veränderung.',
            example: 'Vom „experimentellen Freestyle" zum planbaren Umsatzsystem in 12 Monaten.',
          },
          {
            title: 'Baue deinen Proof-Stack auf',
            description:
              'Drei Schichten: Ergebnisse (Zahlen), Stimmen (Testimonials), Autorität (Auszeichnungen, Reichweite). Jede Schicht stärkt die andere.',
            example:
              'Conversion 28% → 60% (Ergebnis) + Quote von Founder X (Stimme) + TOP 100 Speaker Award (Autorität).',
            tip: 'Mach es konkret. „Mehr Umsatz" ist tot. „+48% in 12 Monaten" lebt.',
          },
          {
            title: 'Gestalte dein Angebot-Paket',
            description:
              'Ein Hauptdeliverable plus Bonus-Layer (Material, Zugang, Garantie). Jeder Bonus muss eigenständig wertvoll sein.',
            example:
              'Hauptdeliverable: 12-Monate-Programm. Bonus: AI-Tool-Zugang, 1:1-Sparring-Tickets, lifetime updates, no-questions-asked refund.',
          },
          {
            title: 'Entwickle deinen Preis-Anker',
            description:
              'Setze einen High-Anchor (oft eine Premium-Variante), dann den eigentlichen Preis. Der Käufer fühlt das Mainpackage als Schnäppchen.',
            example: 'Premium €15k. Standard €5.485. Der Standard fühlt sich nach 1/3 an, nicht nach „teuer".',
            tip: 'Anker funktionieren nur, wenn sie real verkauft werden — nicht als Fake-Premium.',
          },
          {
            title: 'Erstelle deine Angebots-Präsentation',
            description:
              'Vom Gesprächsleitfaden zum Entscheidungs-Dokument. Strukturiere: Diagnose → Lösung → Pakete → Garantie → Next Steps.',
            example:
              'Eine 7-seitige PDF, die der Kunde dem Board zeigen kann, ohne dass du dabei sein musst.',
          },
          {
            title: 'Teste und iteriere in echten Gesprächen',
            description:
              'Niemals theoretisch optimieren. Starte mit 5 echten Discovery-Calls, miss Conversion + Einwände, iteriere wöchentlich.',
            tip: 'Wenn du nach 10 Calls dasselbe Einwand-Muster hörst, ist es ein Angebots-Bug, kein Verkaufs-Problem.',
          },
        ],
      },
    },
    {
      type: 'lead_magnet',
      content: {
        eyebrow: 'Hol dir den Bauplan',
        headline: 'B2B-Angebote · Bauplan + Workbook',
        subheadline:
          'Trag deine Email ein, bekomm das PDF mit allen 8 Schritten ausführlich, das Workbook zum Ausfüllen, und die Video-Masterclass.',
        format: 'PDF + Video',
        size: '~4.2 MB',
        benefits: [
          '40-seitiges PDF mit allen 8 Schritten + Beispielen',
          'Workbook mit Vorlagen + Übungen zum Ausfüllen',
          '47-Min Video-Masterclass von Markus Eilers',
          'Bonus: Angebots-Template als editierbares Google-Doc',
        ],
        ctaLabel: 'Jetzt kostenlos holen',
        privacyNote:
          'Kein Spam. Du bekommst den Bauplan + 1× pro Woche unseren Newsletter mit B2B-Vertriebs-Insights. Abmeldung mit einem Klick.',
      },
    },
    {
      type: 'coach_bio',
      content: {
        eyebrow: 'Wer das aufgeschrieben hat',
        name: 'Markus Eilers',
        role: 'Revenue Systems · B2B-Vertrieb · TEDx Speaker',
        photoUrl: '/markus-photo.jpg',
        bio:
          'Markus baut seit 25+ Jahren B2B-Vertriebsorganisationen — von Start-ups bis Konzerne. Aus 500+ begleiteten Gründer:innen und €50M+ aktiviertem Umsatz ist die SalesMade-Methodik entstanden. Dieses 8-Schritte-Framework ist der Angebots-Baustein daraus.',
        socials: {
          linkedin: 'https://linkedin.com/in/markuseilers',
          youtube: 'https://youtube.com/@markuseilers',
        },
      },
    },
    {
      type: 'faq',
      content: {
        headline: 'Häufige Fragen',
        items: [
          {
            q: 'Ist der Bauplan wirklich kostenlos?',
            a: 'Ja, 100 %. Im Austausch für deine Email bekommst du PDF + Workbook + Video. Plus unseren wöchentlichen B2B-Vertriebs-Newsletter. Abmeldung jederzeit mit einem Klick.',
          },
          {
            q: 'Für wen ist dieses Framework geeignet?',
            a: 'B2B-Founder, CEOs, Sales-Verantwortliche und Berater, die Angebote schreiben oder verkaufen. Besonders wertvoll im Umsatzbereich €500k–€10M, wenn du noch zu viele individuelle Angebote bastelst.',
          },
          {
            q: 'Wie lange dauert die Umsetzung der 8 Schritte?',
            a: 'Plane 6–10 Stunden für den ersten Durchlauf. Iterieren über 2–3 Wochen. Die echten Ergebnisse zeigen sich nach 5–10 echten Discovery-Calls mit dem neuen Angebot.',
          },
          {
            q: 'Was unterscheidet diesen Bauplan von Standard-Angebots-Methoden?',
            a: 'Drei Dinge: (1) ICP-First — kein Feature ohne Pain. (2) Proof-Stack als 3-Schichten-Modell statt einer Wand voll Logos. (3) Anker-Pricing als High-Anchor + Standard, nicht 3-Tier-Misch-Mix.',
          },
        ],
      },
    },
    {
      type: 'cta',
      content: {
        headline: 'Bereit für unwiderstehliche Angebote?',
        body:
          'Spar dir die Trial-and-Error-Phase. Setz das 8-Schritte-Framework im nächsten Pitch ein.',
        ctaLabel: 'Jetzt holen',
        ctaHref: '#download',
      },
    },
  ]

  // Insert sections
  await db.insert(landingPageSections).values(
    sections.map((s, i) => ({
      landingPageId: pageId,
      type: s.type as any,
      order: i * 10,
      isVisible: true,
      content: s.content,
    })),
  )

  revalidatePath('/admin/frameworks')
  revalidatePath('/frameworks')
  revalidatePath(`/frameworks/${B2B_SLUG}`)

  return { id: pageId, slug: B2B_SLUG }
}
