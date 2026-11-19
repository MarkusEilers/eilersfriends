import Link from 'next/link'
import { listSubmissions, listManualGates, listCourses } from '@/lib/courses/store'
import { feedbackAction, gateAction } from '@/lib/actions/courses'

export const dynamic = 'force-dynamic'

const fmt = (s: unknown) => new Date(String(s)).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Kurse: Homework mit Feedback, manuelle Freigaben (z. B. „mit Session 3“). */
export default async function AdminCoursesPage() {
  const [subs, gates, courses] = await Promise.all([listSubmissions(), listManualGates(), listCourses()])
  const open = subs.filter((s) => !s.feedback).length
  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Kurse & Homework</h1>
        <p className="mt-1 text-sm text-gray-500">{courses.length} Kurs(e) · {subs.length} Einreichungen · {open} ohne Feedback</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold">Freigaben</h2>
        <p className="mt-1 text-sm text-gray-500">Module, die erst mit der nächsten Live-Session öffnen. Ein Klick schaltet sie für alle Teilnehmer frei.</p>
        <ul className="mt-3 flex flex-col divide-y divide-gray-100">
          {gates.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span><b>{g.course}</b> · {g.title} <span className="text-gray-500">({g.unlock.type === 'manual' ? g.unlock.label : ''})</span></span>
              <form action={gateAction}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="open" value={g.unlock.type === 'manual' && g.unlock.open ? '0' : '1'} />
                <button className={`rounded-full px-3 py-1 text-xs font-bold ${g.unlock.type === 'manual' && g.unlock.open ? 'bg-green-100 text-green-800' : 'bg-gray-900 text-white'}`}>{g.unlock.type === 'manual' && g.unlock.open ? 'Frei · wieder sperren' : 'Jetzt freischalten'}</button>
              </form>
            </li>
          ))}
          {!gates.length && <li className="py-2 text-sm text-gray-500">Keine manuellen Freigaben.</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-bold">Homework</h2>
        {subs.map((s) => (
          <div key={String(s.id)} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span><b>{String(s.name ?? s.email ?? '—')}</b> · {String(s.course)} · {String(s.lesson)}</span>
              <span className="text-gray-500">{fmt(s.submitted_at)}</span>
            </div>
            {s.text ? <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{String(s.text)}</p> : null}
            {s.file_url ? <Link href={String(s.file_url)} target="_blank" className="mt-2 inline-block text-sm font-semibold text-blue-700">📎 {String(s.file_name ?? 'Datei')}</Link> : null}
            <form action={feedbackAction} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={String(s.id)} />
              <textarea name="feedback" rows={3} defaultValue={String(s.feedback ?? '')} placeholder="Feedback an den Teilnehmer …" className="w-full rounded-lg border border-gray-200 p-2.5 text-sm" />
              <div className="flex items-center gap-3"><button className="rounded-full bg-blue-700 px-4 py-1.5 text-xs font-bold text-white">Feedback speichern</button>{s.feedback_at ? <span className="text-xs text-gray-500">gespeichert {fmt(s.feedback_at)}</span> : null}</div>
            </form>
          </div>
        ))}
        {!subs.length && <p className="text-sm text-gray-500">Noch keine Homework eingereicht.</p>}
      </section>
    </div>
  )
}
