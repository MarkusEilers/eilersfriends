'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2, PlusCircle } from 'lucide-react'
import { StepCompanion } from './StepCompanion'

interface Card { column: 'what' | 'how' | 'why'; text: string; detail?: string }

interface Props {
  initialAnswers?: { cards?: Card[]; offerDescription?: string; icpSnapshot?: string; pricingRange?: string }
  onSaved?: (progress: number) => void
}

// WAS = grau (Substanz). WIE = blau (Wirkung). WARUM = orange (hirnaktiv, Konsequenz).
const COLUMN_META = {
  what: { color: '#4B5563', bg: '#F3F4F6', label: 'WAS' },
  how: { color: '#1A5FD4', bg: '#EBF1FF', label: 'WIE' },
  why: { color: '#F05A1A', bg: '#FFF1EB', label: 'WARUM' },
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
  const [offerDescription, setOfferDescription] = useState(initialAnswers?.offerDescription ?? '')
  const [icpSnapshot, setIcpSnapshot] = useState(initialAnswers?.icpSnapshot ?? '')
  const [pricingRange, setPricingRange] = useState(initialAnswers?.pricingRange ?? '')
  const [cards, setCards] = useState<Card[]>(initialAnswers?.cards ?? [])
  const [notes, setNotes] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'appending' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastAppended, setLastAppended] = useState<number | null>(null)

  async function callSuggest() {
    if (!offerDescription.trim()) return { ok: false, error: 'Bitte beschreib Dein Angebot in mindestens einem Satz.' }
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-beef-radar/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription, icpSnapshot, pricingRange, existingCards: cards }),
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
    if (cards.length === 0) {
      setCards(r.result?.cards ?? [])
    } else {
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
        body: JSON.stringify({ cards, offerDescription, icpSnapshot, pricingRange, notes }),
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
      <div className="relative">
        <p className="text-lg leading-relaxed text-gray-800">
          <span className="float-left mr-3 mt-1 text-6xl font-bold leading-none" style={{ fontFamily: 'var(--font-serif)', color: '#7A1F1F' }}>W</span>
          ir gehen die Top-Bausteine Deines Angebots durch — und fragen fuer jeden, was er wirklich ausloest. Nicht das Feature.
          Nicht den Marketing-Effekt. Den Wellen-Effekt, der dem Kunden den naechsten Dienstag veraendert.
        </p>
      </div>

      <hr className="border-t border-gray-300" />

      {/* Companion educational mini-cards inline */}
      <StepCompanion stepKey="01-beef-radar" />

      {/* Markus' Stimme editorial quote + Input segment side-by-side */}
      <div className="grid gap-8 sm:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Markus&apos; Stimme</p>
          <blockquote className="border-l-2 border-red-900 pl-4 text-sm italic leading-relaxed text-gray-800" style={{ fontFamily: 'var(--font-serif)' }}>
            „Am Ende steht eine Liste: was drin ist, was es bewirkt, und was es misst. Du kannst sie auf eine Karte schreiben."
          </blockquote>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Was hier weh tut</p>
          <p className="text-xs leading-relaxed text-gray-700">
            Der Bullshit-Detector laeuft live in den Feldern rechts. Trigger-Woerter werden rot unterringelt — mit einem Tooltip,
            der Dir genau sagt, <em>welche Floskel</em> Dich gerade billig macht.
          </p>
        </div>

        {/* Inline input segment — no nested card frame */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Deine Eingabe · Beef-Radar</p>

          <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Angebots-Beschreibung *</label>
          <textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} rows={3}
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
            placeholder="Was tut Dein Angebot? Welches Problem loest es?" />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">ICP-Snapshot</label>
              <input value={icpSnapshot} onChange={(e) => setIcpSnapshot(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                placeholder="z.B. Inhaberin Zahnarztpraxis" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Preisspanne</label>
              <input value={pricingRange} onChange={(e) => setPricingRange(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                placeholder="z.B. 9.997 € + 297 €/MA/Mo" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={initialSuggest} disabled={status === 'suggesting' || status === 'appending' || !offerDescription.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50">
              {status === 'suggesting' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {cards.length === 0 ? 'AI vorschlagen' : 'Erneut vorschlagen'}
            </button>
            {cards.length > 0 && (
              <button onClick={suggestMore} disabled={status === 'suggesting' || status === 'appending' || !offerDescription.trim()}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {status === 'appending' ? <Loader2 size={11} className="animate-spin" /> : <PlusCircle size={11} />}
                Suggest More
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-[10px] text-red-600">{error}</p>}
          {lastAppended !== null && lastAppended > 0 && (
            <p className="mt-2 text-[10px] font-semibold text-green-700">+{lastAppended} neue Karte{lastAppended === 1 ? '' : 'n'} hinzugefuegt</p>
          )}
          <p className="mt-3 text-[10px] italic text-gray-500">
            Die AI ueberschreibt nie Deine Eingaben.
          </p>
        </div>
      </div>

      {/* Cards in 3 columns — no nested frame */}
      {cards.length > 0 && (
        <>
          <hr className="border-t border-gray-300" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Deine Beef-Radar-Karten</p>
            <h3 className="text-2xl tracking-tight mb-1" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>WAS · WIE · WARUM</h3>
            <p className="text-xs text-gray-600 mb-5">Editiere direkt — was die AI vorgeschlagen hat, ist nur ein Startpunkt.</p>
            <div className="grid gap-3 lg:grid-cols-3">
              {(['what', 'how', 'why'] as const).map((col) => {
                const meta = COLUMN_META[col]
                const items = grouped[col]
                return (
                  <div key={col} className="rounded-lg border" style={{ borderColor: meta.color + '40', backgroundColor: meta.bg }}>
                    <div className="flex items-center justify-between p-2.5 border-b" style={{ borderColor: meta.color + '40' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                      <button onClick={() => addCard(col)} className="rounded-full p-1 hover:bg-white"><Plus size={11} style={{ color: meta.color }} /></button>
                    </div>
                    <ul className="p-2.5 space-y-1.5">
                      {items.length === 0 && <li className="text-[10px] text-gray-400 italic">Noch keine Karte.</li>}
                      {items.map(({ card, idx }) => (
                        <li key={idx} className="rounded bg-white p-2 border border-white/60">
                          <div className="flex items-start gap-1.5">
                            <input value={card.text} onChange={(e) => updateCard(idx, { text: e.target.value })}
                              className="flex-1 bg-transparent text-[11px] font-semibold text-gray-900 focus:outline-none" />
                            <button onClick={() => removeCard(idx)} className="text-gray-400 hover:text-red-500"><X size={9} /></button>
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
                <p className="mt-1 text-[11px] text-amber-900">{notes}</p>
              </div>
            )}
            <div className="mt-5 flex items-center gap-3">
              <button onClick={save} disabled={status === 'saving' || cards.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
                {status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={12} /> : <Save size={12} />}
                {status === 'saved' ? 'Gespeichert · Punkte gebucht' : 'Speichern · Punkte buchen'}
              </button>
              <span className="text-[10px] text-gray-500">{cards.length} Karten</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
