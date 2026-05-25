'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2, PlusCircle, BookOpen } from 'lucide-react'
import { StepCompanion } from './StepCompanion'
import { WelcomeContextBadge } from './WelcomeContextBadge'

interface Card { column: 'what' | 'how' | 'why'; text: string; detail?: string }

interface Props {
  initialAnswers?: { cards?: Card[]; icpSnapshot?: string; pricingRange?: string }
  onSaved?: (progress: number) => void
}

const COLUMN_META = {
  what: { color: '#4B5563', label: 'WAS' },
  how: { color: '#1A5FD4', label: 'WIE' },
  why: { color: '#F05A1A', label: 'WARUM' },
}

function dedupeAppend(existing: Card[], incoming: Card[]): Card[] {
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ')
  const seen = new Set(existing.map((c) => `${c.column}::${norm(c.text)}`))
  const newOnes: Card[] = []
  for (const c of incoming) {
    const key = `${c.column}::${norm(c.text)}`
    if (!seen.has(key) && c.text.trim()) { seen.add(key); newOnes.push(c) }
  }
  return [...existing, ...newOnes]
}

export function BeefRadarStep({ initialAnswers, onSaved }: Props) {
  const [icpSnapshot, setIcpSnapshot] = useState(initialAnswers?.icpSnapshot ?? '')
  const [pricingRange, setPricingRange] = useState(initialAnswers?.pricingRange ?? '')
  const [cards, setCards] = useState<Card[]>(initialAnswers?.cards ?? [])
  const [notes, setNotes] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'appending' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastAppended, setLastAppended] = useState<number | null>(null)

  async function callSuggest() {
    // offerDescription replaced by welcome-context
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-beef-radar/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icpSnapshot, pricingRange, existingCards: cards }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) return { ok: false, error: data.error || 'Suggest fehlgeschlagen.' }
      return { ok: true, result: data.result as { cards?: Card[]; notes?: string } }
    } catch (e) { return { ok: false, error: String(e) } }
  }

  async function initialSuggest() {
    setStatus('suggesting'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    if (cards.length === 0) setCards(r.result?.cards ?? [])
    else {
      const merged = dedupeAppend(cards, r.result?.cards ?? [])
      setLastAppended(merged.length - cards.length); setCards(merged)
    }
    setNotes(r.result?.notes ?? ''); setStatus('idle')
  }
  async function suggestMore() {
    setStatus('appending'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    const merged = dedupeAppend(cards, r.result?.cards ?? [])
    setLastAppended(merged.length - cards.length); setCards(merged); setNotes(r.result?.notes ?? ''); setStatus('idle')
  }
  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-beef-radar/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, icpSnapshot, pricingRange, notes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save fehlgeschlagen'); setStatus('error'); return }
      setStatus('saved')
      if (onSaved) onSaved(data.progress ?? 0)
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  function updateCard(i: number, patch: Partial<Card>) { setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c))) }
  function removeCard(i: number) { setCards((prev) => prev.filter((_, idx) => idx !== i)) }
  function addCard(column: 'what' | 'how' | 'why') { setCards((prev) => [...prev, { column, text: '' }]) }

  const grouped: Record<'what' | 'how' | 'why', { card: Card; idx: number }[]> = { what: [], how: [], why: [] }
  cards.forEach((c, i) => grouped[c.column].push({ card: c, idx: i }))

  return (
    <div className="space-y-10">
      {/* Drop-cap editorial intro */}
      <p className="text-base leading-relaxed text-gray-800 max-w-prose">
        <span className="float-left mr-3 mt-1 text-6xl font-bold leading-none" style={{ fontFamily: 'var(--font-serif)', color: '#7A1F1F' }}>W</span>
        ir gehen die Top-Bausteine Deines Angebots durch — und fragen für jeden, was er wirklich ausloest. Nicht das Feature.
        Nicht den Marketing-Effekt. Den Wellen-Effekt, der dem Kunden den nächsten Dienstag verändert.
      </p>

      <StepCompanion stepKey="01-beef-radar" />

      {/* Markus quote — editorial */}
      <section className="max-w-prose">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Markus&apos; Stimme</h3>
        <blockquote className="border-l-2 border-red-900 pl-4 text-base italic leading-relaxed text-gray-800" style={{ fontFamily: 'var(--font-serif)' }}>
          „Am Ende steht eine Liste: was drin ist, was es bewirkt, und was es misst. Du kannst sie auf eine Karte schreiben."
        </blockquote>
      </section>

      {/* Examples — light blue box */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 max-w-3xl">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-3 inline-flex items-center gap-1.5">
          <BookOpen size={11} /> Konkrete Beispiele
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-gray-800">
          <p>
            <strong className="font-semibold">Statt</strong> <em className="text-gray-600">„professionelle Betreuung"</em>{' '}
            <strong className="font-semibold">steht</strong> <em className="text-blue-900">„−45 Min Dokumentationszeit pro Behandlertag (Customer-Avg, Sonia.so 2024)"</em>.
            Aus Feature wird Effekt — und Effekt verkauft.
          </p>
          <p>
            Wenn ein CFO in die Runde fragt <em className="text-gray-600">„Was bringt uns das konkret?"</em>, hast Du eine Zeile, die Dein Champion auswendig weiss.
            Genau die Spur, die er zur Vorstandstür mitnimmt.
          </p>
          <p className="text-xs text-blue-800 border-l-2 border-blue-300 pl-3 italic">
            Anti-Pattern: <em>„umfassende Lösung"</em>, <em>„nachhaltige Optimierung"</em>, <em>„ganzheitlich"</em> — wenn der Effekt nicht in einem Satz sagbar ist, gehoert der Baustein neu gedacht oder raus.
          </p>
        </div>
      </section>

      {/* Software input — white box with border only */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 max-w-3xl">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Deine Eingabe · Beef-Radar</h3>

        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Angebots-Beschreibung *</label>
        <textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} rows={3}
          className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="Was tut Dein Angebot? Welches Problem loest es?" />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">ICP-Snapshot</label>
            <input value={icpSnapshot} onChange={(e) => setIcpSnapshot(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="z.B. Inhaberin Zahnarztpraxis" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Preisspanne</label>
            <input value={pricingRange} onChange={(e) => setPricingRange(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="z.B. 9.997 € + 297 €/MA/Mo" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={initialSuggest} disabled={status === 'suggesting' || status === 'appending'}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {cards.length === 0 ? 'AI vorschlagen' : 'Erneut vorschlagen'}
          </button>
          {cards.length > 0 && (
            <button onClick={suggestMore} disabled={status === 'suggesting' || status === 'appending'}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {status === 'appending' ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
              Suggest More
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
        {lastAppended !== null && lastAppended > 0 && (
          <p className="mt-2 text-[11px] font-semibold text-green-700">+{lastAppended} neue Karte{lastAppended === 1 ? '' : 'n'} hinzugefuegt</p>
        )}
        <p className="mt-2 text-[10px] italic text-gray-500">Die AI überschreibt nie Deine Eingaben.</p>
      </section>

      {/* Cards output — white box, border only */}
      {cards.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 max-w-3xl">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deine Beef-Radar-Karten</h3>
              <p className="mt-1 text-2xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>WAS · WIE · WARUM</p>
            </div>
            <span className="text-[11px] text-gray-500">{cards.length} Karten</span>
          </div>
          <p className="text-xs text-gray-600 mb-4">Editiere direkt — was die AI vorgeschlagen hat, ist nur ein Startpunkt.</p>

          <div className="grid gap-3 lg:grid-cols-3">
            {(['what', 'how', 'why'] as const).map((col) => {
              const meta = COLUMN_META[col]
              const items = grouped[col]
              return (
                <div key={col}>
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: meta.color + '40' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                    <button onClick={() => addCard(col)} className="rounded-full p-1 hover:bg-gray-50"><Plus size={11} style={{ color: meta.color }} /></button>
                  </div>
                  <ul className="pt-2 space-y-1.5">
                    {items.length === 0 && <li className="text-[11px] text-gray-400 italic">Noch keine Karte.</li>}
                    {items.map(({ card, idx }) => (
                      <li key={idx} className="rounded border border-gray-100 bg-white p-2">
                        <div className="flex items-start gap-1.5">
                          <input value={card.text} onChange={(e) => updateCard(idx, { text: e.target.value })}
                            className="flex-1 bg-transparent text-[12px] font-semibold text-gray-900 focus:outline-none" />
                          <button onClick={() => removeCard(idx)} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                        </div>
                        <input value={card.detail ?? ''} onChange={(e) => updateCard(idx, { detail: e.target.value })}
                          placeholder="(Detail)" className="mt-1 w-full bg-transparent text-[10px] text-gray-600 focus:outline-none" />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {notes && (
            <div className="mt-4 rounded border-l-2 border-amber-400 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">AI-Hinweis</p>
              <p className="mt-1 text-xs text-amber-900">{notes}</p>
            </div>
          )}

          <div className="mt-5">
            <button onClick={save} disabled={status === 'saving' || cards.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
              {status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={12} /> : <Save size={12} />}
              {status === 'saved' ? 'Gespeichert' : 'Speichern · Punkte buchen'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
