'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2, PlusCircle } from 'lucide-react'
import { StepCompanion } from './StepCompanion'

interface Card { column: 'what' | 'how' | 'why'; text: string; detail?: string }

interface Props {
  initialAnswers?: { cards?: Card[]; offerDescription?: string; icpSnapshot?: string; pricingRange?: string }
  onSaved?: (progress: number) => void
}

// WAS = grau (neutral, Substanz). WIE = blau (Bewegung, Wirkung). WARUM = orange (hirnaktiv, Konsequenz).
const COLUMN_META = {
  what: { color: '#4B5563', bg: '#F3F4F6', label: 'WAS' },
  how: { color: '#1A5FD4', bg: '#EBF1FF', label: 'WIE' },
  why: { color: '#F05A1A', bg: '#FFF1EB', label: 'WARUM' },
}

function dedupeAppend(existing: Card[], incoming: Card[]): Card[] {
  // Normalize for compare
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ')
  const seen = new Set(existing.map((c) => `${c.column}::${norm(c.text)}`))
  const newOnes: Card[] = []
  for (const c of incoming) {
    const key = `${c.column}::${norm(c.text)}`
    if (!seen.has(key) && c.text.trim()) {
      seen.add(key)
      newOnes.push(c)
    }
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

  async function callSuggest(): Promise<{ ok: boolean; result?: { cards?: Card[]; notes?: string }; error?: string }> {
    if (!offerDescription.trim()) {
      return { ok: false, error: 'Bitte beschreib Dein Angebot in mindestens einem Satz.' }
    }
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-beef-radar/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription, icpSnapshot, pricingRange, existingCards: cards }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) return { ok: false, error: data.error || 'Suggest fehlgeschlagen.' }
      return { ok: true, result: data.result }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }

  async function initialSuggest() {
    setStatus('suggesting'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    // Initial suggest only fills if cards are empty — never overwrites user input.
    if (cards.length === 0) {
      setCards(r.result?.cards ?? [])
    } else {
      const merged = dedupeAppend(cards, r.result?.cards ?? [])
      setLastAppended(merged.length - cards.length)
      setCards(merged)
    }
    setNotes(r.result?.notes ?? '')
    setStatus('idle')
  }

  async function suggestMore() {
    setStatus('appending'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    const merged = dedupeAppend(cards, r.result?.cards ?? [])
    setLastAppended(merged.length - cards.length)
    setCards(merged)
    setNotes(r.result?.notes ?? '')
    setStatus('idle')
  }

  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-beef-radar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-6">
      <StepCompanion stepKey="01-beef-radar" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Schritt 1 · Beef-Radar</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Beschreib Dein Angebot</h2>
          <p className="mt-1 text-sm text-gray-500">Je konkreter, desto besser die AI-Suggestions. Was tust Du, für wen, in welcher Phase?</p>
        </div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Angebots-Beschreibung *</label>
        <textarea
          value={offerDescription}
          onChange={(e) => setOfferDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="Was tut Dein Angebot? Welches Problem löst es?"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">ICP-Snapshot (optional)</label>
            <input value={icpSnapshot} onChange={(e) => setIcpSnapshot(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" placeholder="z.B. Inhaberin Zahnarztpraxis, 3-15 MA" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Preisspanne (optional)</label>
            <input value={pricingRange} onChange={(e) => setPricingRange(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" placeholder="z.B. 9.997 € Setup + 297 €/MA/Mo" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={initialSuggest} disabled={status === 'suggesting' || status === 'appending' || !offerDescription.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {cards.length === 0 ? 'AI: Karten vorschlagen' : 'AI: Erneut vorschlagen'}
          </button>
          {cards.length > 0 && (
            <button onClick={suggestMore} disabled={status === 'suggesting' || status === 'appending' || !offerDescription.trim()}
              className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 px-5 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
              {status === 'appending' ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Suggest More
            </button>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
          {lastAppended !== null && lastAppended > 0 && (
            <span className="text-xs font-semibold text-green-700">
              +{lastAppended} neue Karte{lastAppended === 1 ? '' : 'n'} hinzugefuegt
            </span>
          )}
          {lastAppended === 0 && (
            <span className="text-xs italic text-gray-500">Keine neuen Karten — AI hat nichts gefunden, was nicht schon da war.</span>
          )}
        </div>
        <p className="mt-3 text-[11px] italic text-gray-500">
          Tipp: Die AI ueberschreibt nie Deine Eingaben. Erneut/Suggest More fuegt neue Karten hinzu — Deine bleiben unberuehrt.
        </p>
      </div>

      {cards.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Deine Beef-Radar-Karten</p>
            <h3 className="mt-1 text-lg font-bold text-gray-900">WAS · WIE · WARUM</h3>
            <p className="mt-1 text-xs text-gray-500">Editier direkt — was die AI vorgeschlagen hat, ist nur ein Startpunkt.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(['what', 'how', 'why'] as const).map((col) => {
              const meta = COLUMN_META[col]
              const items = grouped[col]
              return (
                <div key={col} className="rounded-xl border" style={{ borderColor: meta.color + '40', backgroundColor: meta.bg }}>
                  <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: meta.color + '40' }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                    <button onClick={() => addCard(col)} className="rounded-full p-1 hover:bg-white"><Plus size={12} style={{ color: meta.color }} /></button>
                  </div>
                  <ul className="p-3 space-y-2">
                    {items.length === 0 && <li className="text-xs text-gray-400 italic">Noch keine Karte.</li>}
                    {items.map(({ card, idx }) => (
                      <li key={idx} className="rounded-lg bg-white p-2.5 border border-white/60">
                        <div className="flex items-start gap-2">
                          <input value={card.text} onChange={(e) => updateCard(idx, { text: e.target.value })}
                            className="flex-1 bg-transparent text-xs font-semibold text-gray-900 focus:outline-none" />
                          <button onClick={() => removeCard(idx)} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                        </div>
                        <input value={card.detail ?? ''} onChange={(e) => updateCard(idx, { detail: e.target.value })}
                          placeholder="(Detail)" className="mt-1.5 w-full bg-transparent text-[10px] text-gray-600 focus:outline-none" />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          {notes && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800">AI-Hinweis</p>
              <p className="mt-1 text-xs text-amber-900">{notes}</p>
            </div>
          )}
          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} disabled={status === 'saving' || cards.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
              {status === 'saving' ? <Loader2 size={14} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {status === 'saved' ? 'Gespeichert' : 'Schritt speichern'}
            </button>
            <span className="text-xs text-gray-500">{cards.length} Karten</span>
          </div>
        </div>
      )}
    </div>
  )
}
