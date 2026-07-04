'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAvailabilityAction } from '@/lib/actions/schedule-admin'
import { Save, RotateCcw } from 'lucide-react'

type Week = Record<number, Array<[number, number]>>
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const START = 480, END = 1200, STEP = 30
const CELLS = (END - START) / STEP
const DEFAULT_WEEK: Week = { 0: [[510, 750], [810, 1050]], 1: [[510, 750], [810, 1050]], 2: [[510, 750], [810, 1050]], 3: [[510, 750], [810, 1050]], 4: [[510, 750], [810, 1050]], 5: [], 6: [] }

function label(min: number) { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}` }
function weekToGrid(week: Week): boolean[][] {
  const g: boolean[][] = []
  for (let d = 0; d < 7; d++) {
    const row: boolean[] = []
    const ivs = week[d] || []
    for (let i = 0; i < CELLS; i++) { const t = START + i * STEP; row.push(ivs.some(iv => t >= iv[0] && t + STEP <= iv[1])) }
    g.push(row)
  }
  return g
}
function gridToWeek(g: boolean[][]): Week {
  const w: Week = {}
  for (let d = 0; d < 7; d++) {
    const ivs: [number, number][] = []
    let s: number | null = null
    for (let i = 0; i < CELLS; i++) {
      const t = START + i * STEP
      if (g[d][i]) { if (s === null) s = t } else if (s !== null) { ivs.push([s, t]); s = null }
    }
    if (s !== null) ivs.push([s, END])
    w[d] = ivs
  }
  return w
}

export function AvailabilityEditor({ person, week }: { person: string; week: Week }) {
  const router = useRouter()
  const [grid, setGrid] = useState<boolean[][]>(() => weekToGrid(week))
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const times = useMemo(() => Array.from({ length: CELLS }, (_, i) => START + i * STEP), [])

  function toggleCell(d: number, i: number) { setGrid(g => g.map((row, dd) => dd === d ? row.map((v, ii) => ii === i ? !v : v) : row)); setSaved(false) }
  function toggleDay(d: number) { setGrid(g => { const anyOn = g[d].some(Boolean); return g.map((row, dd) => dd === d ? row.map(() => !anyOn) : row) }); setSaved(false) }
  function reset() { setGrid(weekToGrid(DEFAULT_WEEK)); setSaved(false) }
  function save() { start(async () => { await saveAvailabilityAction(person, gridToWeek(grid)); setSaved(true); router.refresh() }) }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th></th>
              {DAYS.map((d, di) => (
                <th key={d} className="px-1 pb-1">
                  <button onClick={() => toggleDay(di)} className="w-12 rounded-md bg-gray-100 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200">{d}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((t, i) => (
              <tr key={t}>
                <td className="pr-2 text-right align-middle text-[10px] tabular-nums text-gray-400" style={{ height: 18 }}>{t % 60 === 0 ? label(t) : ''}</td>
                {DAYS.map((_, d) => (
                  <td key={d}>
                    <button onClick={() => toggleCell(d, i)} title={`${DAYS[d]} ${label(t)}`}
                      className="block h-[18px] w-12 rounded-[3px] transition-colors"
                      style={{ backgroundColor: grid[d][i] ? '#1A5FD4' : '#EEF0F3' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-full bg-[#1A5FD4] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Save size={13} />{pending ? 'Speichern…' : saved ? 'Gespeichert ✓' : 'Speichern'}</button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-300"><RotateCcw size={12} /> Standard</button>
        <span className="text-[11px] text-gray-400">Blau = verfügbar. Klick blockt/entsperrt eine halbe Stunde; Klick auf den Wochentag den ganzen Tag.</span>
      </div>
    </div>
  )
}
