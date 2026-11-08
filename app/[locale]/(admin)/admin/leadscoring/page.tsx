import { listScores, nudgeStats, lastDwell } from '@/lib/scoring/core'

export const dynamic = 'force-dynamic'

const TIER: Record<string, string> = { 'heiß': 'bg-red-50 text-red-700 border-red-200', warm: 'bg-amber-50 text-amber-700 border-amber-200', kalt: 'bg-gray-50 text-gray-600 border-gray-200' }
const STAGE: Record<string, string> = { solo: 'Solo-Gründer', ramp: 'Ramp-Up', scale: 'Scale' }
const REC: Record<string, string> = { strategy: 'Strategiegespräch', mystery: 'Mystery Shopping', premiumF: 'Premium (Gründer)', premium: 'Premium', standard: 'Standard' }
const Q: Record<string, string[]> = {
  ambition: ['gleich, planbar', '+25–50 %', 'verdoppelt', 'mehr als verdoppelt', 'schaut sich um'],
  role: ['Gründer/CEO', 'Vertriebsleitung', 'erfahrene:r Seller', 'neu im Vertrieb'],
  size: ['nur ich', '2–3', '4–8', '9+'],
  dep: ['fast jeder Deal', 'die meisten großen', 'manche', 'kaum'],
  follow: ['selten', 'manchmal', 'oft', 'weiß nicht'],
  disc: ['selten', 'jeder dritte', 'die meisten', 'fast immer'],
  coach: ['je direkter, desto besser', 'offen, konstruktiv', 'gemischt', 'nicht unsere Kultur'],
}
const fmt = (s: string) => new Date(s).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Lead-Scoring: Besucher und Kontakte nach Punkten, mit Quiz-Antworten (auch unvollständig). */
export default async function LeadScoringPage() {
  const list = await listScores(300)
  const nudges = await nudgeStats().catch(() => [])
  const dwell = await lastDwell(list.map((v) => v.vid)).catch(() => new Map())
  const hot = list.filter((x) => x.tier === 'heiß').length, warm = list.filter((x) => x.tier === 'warm').length
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Lead-Scoring</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        Jede Aktion auf der Website zählt Punkte: Quiz-Antworten (auch abgebrochene), Klicks auf Empfehlungen, Opt-ins, Buchungen und — mit Analyse-Einwilligung — Seitenaufrufe.
        Ohne Einwilligung bleibt der Besucher anonym und nur für eine Sitzung erkennbar. Sobald eine E-Mail bekannt ist, werden alle Aktionen dieser Person rückwirkend zugeordnet.
        Stufen: <b>heiß</b> ab 40, <b>warm</b> ab 15 Punkten.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-3"><div className="text-gray-500">Heiß</div><div className="text-xl font-bold text-red-600">{hot}</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-3"><div className="text-gray-500">Warm</div><div className="text-xl font-bold text-amber-600">{warm}</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-3"><div className="text-gray-500">Gesamt</div><div className="text-xl font-bold">{list.length}</div></div>
      </div>
      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Noch keine Aktivität.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr><th className="p-3">Kontakt</th><th className="p-3">Punkte</th><th className="p-3">Quiz</th><th className="p-3">Zuletzt angesehen</th><th className="p-3">Aktionen</th><th className="p-3">Zuletzt</th></tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.vid + (v.email ?? '')} className="border-t border-gray-100 align-top">
                  <td className="p-3">
                    {v.email ? <><b>{v.firstName ? `${v.firstName} · ` : ''}{v.email}</b></> : <span className="text-gray-500">Anonym · {v.vid.slice(0, 8)}</span>}
                    <div className="text-xs text-gray-400">{v.persistent ? 'mit Cookie-Einwilligung' : 'nur Sitzung'} · seit {fmt(v.firstSeen)}</div>
                  </td>
                  <td className="p-3"><span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${TIER[v.tier]}`}>{v.tier} · {v.score}</span></td>
                  <td className="p-3 text-xs text-gray-600">
                    {v.quiz ? (
                      <>
                        {v.quiz.stage ? <div><b>{STAGE[v.quiz.stage] ?? v.quiz.stage}</b> → {REC[v.quiz.rec ?? ''] ?? v.quiz.rec}</div> : <div><b>abgebrochen</b> nach {v.quiz.answered} von 8 Fragen</div>}
                        <div className="mt-1">{Object.entries(v.quiz.answers ?? {}).map(([k, i]) => Q[k]?.[i] ? <span key={k} className="mr-1 mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5">{Q[k][i]}</span> : null)}</div>
                        {v.quiz.text && <div className="mt-1 italic">„{v.quiz.text}“</div>}
                      </>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-xs text-gray-600">{dwell.get(v.vid) ? <><b>{dwell.get(v.vid)!.section}</b><div className="text-gray-400">{dwell.get(v.vid)!.path} · {dwell.get(v.vid)!.sec} s</div></> : '—'}</td>
                  <td className="p-3">{v.events}</td>
                  <td className="p-3 text-gray-500">{fmt(v.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-900">Chat-Hinweise · A/B-Test</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">Eily meldet sich, wenn jemand 30 bzw. 40 Sekunden lang nicht geklickt hat — einmal pro Besuch. Varianten: a „Danke, dass Du Dich umsiehst …“, b „Was suchst Du?“, c „Mit welcher Frage bist Du hier?“, ctx „Du schaust Dir gerade … an“. Die Zahl dahinter ist die Wartezeit in Sekunden.</p>
        {nudges.length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">Noch keine Daten.</p> : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500"><tr><th className="p-3">Variante</th><th className="p-3">Gezeigt</th><th className="p-3">Geöffnet</th><th className="p-3">Geantwortet</th><th className="p-3">Weggeklickt</th><th className="p-3">Antwortquote</th></tr></thead>
              <tbody>{nudges.map((n) => (
                <tr key={n.variant} className="border-t border-gray-100"><td className="p-3 font-mono">{n.variant}</td><td className="p-3">{n.shown}</td><td className="p-3">{n.opened}</td><td className="p-3">{n.replied}</td><td className="p-3">{n.dismissed}</td><td className="p-3 font-bold">{n.shown ? Math.round((n.replied / n.shown) * 100) : 0} %</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
