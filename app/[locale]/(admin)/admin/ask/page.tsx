import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { FUNNELS } from '@/lib/ask/registry'
import { getCalibration, listSubmissions } from '@/lib/ask/store'
import { reportToken } from '@/lib/ask/tokens'
import { saveAskCalibrationAction } from '@/lib/actions/ask'

export const dynamic = 'force-dynamic'

const DOT: Record<string, string> = { red: 'bg-[#EB0028]', yellow: 'bg-[#E7A500]', green: 'bg-[#1F9D55]' }
const fmt = (s: string) => new Date(s).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

/** ASK-Funnels: Teilnahmen, Abbruch je Frage, Kalibrierung. */
export default async function AdminAskPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const slug = (await searchParams).f && FUNNELS[(await searchParams).f!] ? (await searchParams).f! : Object.keys(FUNNELS)[0]
  const { def } = FUNNELS[slug]
  const [subs, cal] = await Promise.all([listSubmissions(slug, 300), getCalibration(slug)])
  const name = (k: string | null) => (k ? def.stages.find((s) => s.key === k)?.name.de ?? k : '—')

  // Abbruch je Frage: wie viele Besucher haben Frage n beantwortet (anonym, aus dem Lead-Scoring)
  const qIds = def.stages.flatMap((s) => s.questions.map((q) => ({ id: q.id, stage: s.name.de, prompt: q.prompt.de })))
  const counts = new Map<string, number>()
  let starts = 0
  try {
    const r = rows(await db.execute(sql`
      SELECT key, count(DISTINCT vid)::int AS n FROM visitor_events
      WHERE (kind = 'quiz_answer' AND key LIKE ${`ask:${slug}:%`}) OR (kind = 'form_start' AND key = ${`ask:${slug}:start`})
      GROUP BY key`))
    for (const x of r) {
      const k = String(x.key)
      if (k.endsWith(':start')) starts = Number(x.n)
      else counts.set(k.split(':')[2], Number(x.n))
    }
  } catch { /* Tabelle fehlt noch */ }
  const maxN = Math.max(1, starts, ...counts.values())

  const withContact = subs.filter((s) => s.contact).length
  const confirmed = subs.filter((s) => s.confirmedAt).length
  const firstDist = new Map<string, number>()
  for (const s of subs) firstDist.set(s.result.first ?? 'none', (firstDist.get(s.result.first ?? 'none') ?? 0) + 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">ASK-Funnels · {def.kicker.de}</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        Öffentlich unter <a className="text-[#1A5FD4] underline" href={`/check/${slug}`} target="_blank">/check/{slug}</a> (DE/EN/ES).
        Kurzergebnis sofort, voller Report nach Bestätigung per Mail. Einbinden auf Landingpages über den Baustein „ASK-Teaser“.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[['Gestartet', starts], ['Abgeschlossen', subs.length], ['Kontakt angegeben', withContact], ['Bestätigt (Lead)', confirmed]].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-gray-200 bg-white p-3"><div className="text-gray-500">{l}</div><div className="text-xl font-bold">{v}</div></div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold text-gray-900">Teilnahmen</h2>
      {subs.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Noch keine Teilnahmen.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-3 py-2">Zeit</th><th className="px-3 py-2">Ampel</th><th className="px-3 py-2">Engpass Nr. 1</th><th className="px-3 py-2">Empfehlung</th><th className="px-3 py-2">Kontakt</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{fmt(s.createdAt)}<div className="text-xs">{s.lang.toUpperCase()}{s.source ? ` · ${s.source}` : ''}</div></td>
                  <td className="px-3 py-2"><div className="flex gap-1">{s.result.stages.map((x) => <span key={x.key} title={`${name(x.key)}: ${x.score}`} className={`inline-block h-3 w-3 rounded-sm ${DOT[x.status]}`} />)}</div></td>
                  <td className="px-3 py-2 font-medium">{name(s.result.first)}<div className="text-xs text-gray-500">{s.result.redCount} rot</div></td>
                  <td className="px-3 py-2">{def.ctas[s.result.cta]?.title.de ?? s.result.cta}</td>
                  <td className="px-3 py-2">{s.contact ? (<><div className="font-medium">{s.contact.company}</div><div>{s.contact.firstName ? `${s.contact.firstName} · ` : ''}<a className="text-[#1A5FD4]" href={`mailto:${s.contact.email}`}>{s.contact.email}</a></div>{s.contact.phone && <div><a className="text-[#1A5FD4]" href={`tel:${s.contact.phone.replace(/\s/g, '')}`}>{s.contact.phone}</a></div>}</>) : <span className="text-gray-400">anonym</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{s.confirmedAt ? <><span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">bestätigt</span> <a className="text-xs text-[#1A5FD4] underline" href={`/check/${slug}/report/${reportToken(s.id)}`} target="_blank">Report</a>{s.reportViews > 0 && <div className="text-xs text-gray-500">{s.reportViews}× geöffnet</div>}</> : s.contact ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Mail offen</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Abbruch je Frage</h2>
          <p className="mt-1 text-xs text-gray-500">Besucher, die die Frage beantwortet haben (anonym, auch Teaser-Antworten).</p>
          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="w-10 text-gray-500">Start</span><div className="h-3 rounded bg-[#1A5FD4]" style={{ width: `${(starts / maxN) * 100}%`, minWidth: 2 }} /><span>{starts}</span></div>
            {qIds.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2" title={`${q.stage}: ${q.prompt}`}><span className="w-10 text-gray-500">F{i + 1}</span><div className="h-3 rounded bg-[#1A5FD4]/70" style={{ width: `${((counts.get(q.id) ?? 0) / maxN) * 100}%`, minWidth: 2 }} /><span>{counts.get(q.id) ?? 0}</span></div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-bold text-gray-900">Engpass Nr. 1 — Verteilung</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {[...firstDist.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k} className="flex justify-between"><span>{k === 'none' ? 'keiner' : name(k)}</span><b>{n}</b></li>)}
          </ul>
        </div>

        <form action={saveAskCalibrationAction} className="rounded-2xl border border-gray-200 bg-white p-6">
          <input type="hidden" name="funnel" value={slug} />
          <h2 className="text-lg font-bold text-gray-900">Kalibrierung</h2>
          <p className="mt-1 text-xs text-gray-500">Stufenwert 0–100 (Mittel der zwei Antworten). Unter „Rot ab“ = Engpass, ab „Grün ab“ = läuft. Gilt für neue Teilnahmen, ohne Deploy.</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-1">Stufe</th><th className="py-1">Rot unter</th><th className="py-1">Grün ab</th></tr></thead>
            <tbody>
              {def.stages.map((s) => (
                <tr key={s.key} className="border-t border-gray-100">
                  <td className="py-1.5">{s.name.de}</td>
                  <td className="py-1.5"><input name={`red_${s.key}`} type="number" min={0} max={100} defaultValue={cal.benchmarks[s.key]?.red ?? 40} className="w-20 rounded-lg border border-gray-300 px-2 py-1" /></td>
                  <td className="py-1.5"><input name={`green_${s.key}`} type="number" min={0} max={100} defaultValue={cal.benchmarks[s.key]?.green ?? 66} className="w-20 rounded-lg border border-gray-300 px-2 py-1" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-5 rounded-full bg-[#1A5FD4] px-5 py-2.5 text-sm font-bold text-white">Speichern</button>
        </form>
      </div>
    </div>
  )
}
