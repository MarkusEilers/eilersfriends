import { viewer, getMember, scoreSeries, startData, fmt } from '@/lib/portal/member'
import { myCourses } from '@/lib/courses/member'

/** Ist das ein Pfad im Kundenbereich? (mit oder ohne Sprachpräfix) */
export const isMemberPath = (p?: string) => !!p && /^\/(?:(?:en|es|de)\/)?(dashboard|clients)(\/|$)/.test(p)

/**
 * Was Eily über die angemeldete Person wissen soll: wer sie ist, was sie gebucht hat,
 * wo sie im Kurs steht, was offen ist. Nur für angemeldete Nutzer, nur ihre eigenen Daten.
 */
export async function memberContext(path?: string): Promise<string | null> {
  const v = await viewer().catch(() => null)
  if (!v) return null
  const m = await getMember(v.userId).catch(() => null)
  if (!m) return null
  const [courses, series, sd] = await Promise.all([
    myCourses(m.id, m.companyId, v.role).catch(() => []),
    scoreSeries(m.email).catch(() => []),
    startData(m, v.role).catch(() => null),
  ])
  const inside = isMemberPath(path)
  const L: string[] = []
  L.push(inside
    ? 'DU BIST IM KUNDENBEREICH (Member-Section von Eilers+Friends)'
    : 'DIE PERSON IST ANGEMELDET (Kundin oder Kunde von Eilers+Friends), gerade aber auf der öffentlichen Website')
  L.push(`- Du sprichst mit ${m.name}${m.title ? `, ${m.title}` : ''}${m.companyName ? ` bei ${m.companyName}` : ''}${m.teamName ? ` (Team ${m.teamName})` : ''}. Sprich sie mit Vornamen an (${m.firstName}), per Du.`)
  if (v.preview) L.push('- Achtung: Eilers+Friends sieht sich den Bereich gerade „als“ diese Person an (Vorschau). Wer schreibt, ist jemand aus dem Eilers+Friends-Team.')
  if (m.plans.length) L.push(`- Zugang: ${m.plans.map((p) => p.label).join(', ')}.`)
  for (const cv of courses) {
    L.push(`- Kurs „${cv.course.title}“: ${cv.done} von ${cv.total} Bausteinen erledigt (${cv.percent} %).${cv.next ? ` Als Nächstes: Lektion ${cv.next.index} „${cv.next.title}“ → /dashboard/programs/${cv.course.slug}/${cv.next.slug}` : ''}`)
    const hw = cv.lessons.filter((l) => l.kind === 'homework' && l.gate.open && !l.submitted)
    if (hw.length) L.push(`  Offene Homework: ${hw.map((l) => `„${l.title}“ → /dashboard/programs/${cv.course.slug}/${l.slug}`).join('; ')}`)
    const fb = cv.lessons.filter((l) => l.feedback)
    if (fb.length) L.push(`  Feedback vom Coach liegt vor zu: ${fb.map((l) => `„${l.title}“`).join(', ')}`)
    const locked = cv.modules.filter((x) => !x.gate.open)
    if (locked.length) L.push(`  Noch gesperrt: ${locked.map((x) => `${x.title} (${x.gate.reason ?? 'später'})`).join('; ')}`)
    L.push(`  Inhalte des Kurses (zum Erklären, nicht vorlesen):`)
    for (const mod of cv.modules) for (const l of mod.lessons) {
      if (l.summary && l.gate.open) L.push(`  · ${l.title}: ${l.summary.slice(0, 260)}`)
    }
  }
  if (series.length) {
    const last = series.at(-1)!
    L.push(`- Gesprächs-Score: zuletzt ${last.overall} von 100 (${fmt(last.date)}), ${series.length} ausgewertete Gespräche. Details → /dashboard/score`)
  } else L.push('- Noch kein Gesprächs-Score. Erstes Transkript hochladen → /gespraechs-check')
  if (sd?.todos.length) L.push(`- Gerade offen für die Person: ${sd.todos.map((t) => `${t.title} → ${t.href}`).join('; ')}`)

  if (inside) {
    L.push(`SO VERHÄLTST DU DICH IM KUNDENBEREICH
- Die Person ist schon Kunde. Kein Verkaufsgespräch, kein Pitch für Mystery Shopping oder die Academy, außer sie fragt ausdrücklich danach.
- Du bist hier ihre Lernbegleiterin und Wegweiserin: erklärst Lektionen, Werkzeuge und Frameworks, sagst, was als Nächstes dran ist, und wo sie etwas findet.
- Verweise mit Links auf die Seiten des Kundenbereichs: Start /dashboard · Kurse und Programme /dashboard/programs · Programm Guide /dashboard/guide · Meine Frameworks /dashboard/frameworks · Mein Score /dashboard/score · Profil /dashboard/profile · Rechnungen /dashboard/billing · Angebote und Verträge /clients.
- Bei Fragen zur Homework: Ermutige, gib Denkanstöße, schreib die Homework aber nicht für sie.
- Persönliches Feedback, Termine und Vertragliches kommen vom Coach (Markus) oder dem Team; biete an, eine Nachricht weiterzugeben.
- Halte Dich kurz. Antworte in der Sprache, in der geschrieben wird.`)
  }
  return L.join('\n')
}
