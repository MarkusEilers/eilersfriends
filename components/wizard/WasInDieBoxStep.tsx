'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2, PlusCircle, Package, BookOpen } from 'lucide-react'
import { StepCompanion } from './StepCompanion'
import { WelcomeContextBadge } from './WelcomeContextBadge'

interface Item { name: string; description: string }

interface Props {
  initialAnswers?: { items?: Item[] }
  onSaved?: (progress: number) => void
}

function dedupeAppend(existing: Item[], incoming: Item[]): Item[] {
  const norm = (t: string) => (t || '').trim().toLowerCase().replace(/\s+/g, ' ')
  const seen = new Set(existing.map((i) => norm(i.name)))
  const out: Item[] = []
  for (const i of incoming) {
    const k = norm(i.name)
    if (k && !seen.has(k)) { seen.add(k); out.push(i) }
  }
  return [...existing, ...out]
}

export function WasInDieBoxStep({ initialAnswers, onSaved }: Props) {
  const [items, setItems] = useState<Item[]>(initialAnswers?.items ?? [])
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'appending' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastAppended, setLastAppended] = useState<number | null>(null)

  async function callSuggest() {
    if (items.length === 0 && false) {  // welcome-context replaces requirement
      return { ok: false, error: 'Beschreib Dein Angebot kurz — dann find ich die Bausteine.' }
    }
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-was-in-die-box/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingItems: items }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) return { ok: false, error: data.error || 'Suggest fehlgeschlagen.' }
      return { ok: true, result: data.result as { items?: Item[] } }
    } catch (e) { return { ok: false, error: String(e) } }
  }

  async function initialSuggest() {
    setStatus('suggesting'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    const incoming = r.result?.items ?? []
    if (items.length === 0) setItems(incoming.slice(0, 5))
    else {
      const merged = dedupeAppend(items, incoming)
      setLastAppended(merged.length - items.length); setItems(merged)
    }
    setStatus('idle')
  }
  async function suggestMore() {
    setStatus('appending'); setError(null); setLastAppended(null)
    const r = await callSuggest()
    if (!r.ok) { setError(r.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    const merged = dedupeAppend(items, r.result?.items ?? [])
    setLastAppended(merged.length - items.length); setItems(merged); setStatus('idle')
  }
  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/01-was-in-die-box/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save fehlgeschlagen'); setStatus('error'); return }
      setStatus('saved')
      if (onSaved) onSaved(data.progress ?? 0)
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  function updateItem(i: number, patch: Partial<Item>) { setItems((p) => p.map((x, idx) => idx === i ? { ...x, ...patch } : x)) }
  function removeItem(i: number) { setItems((p) => p.filter((_, idx) => idx !== i)) }
  function addItem() { setItems((p) => [...p, { name: '', description: '' }]) }

  return (
    <div className="space-y-10">
      {/* Editorial drop-cap intro */}
      <p className="text-base leading-relaxed text-gray-800 max-w-prose">
        <span className="float-left mr-3 mt-1 text-6xl font-bold leading-none" style={{ fontFamily: 'var(--font-serif)', color: '#7A1F1F' }}>F</span>
        uenf. Nicht vierzehn. Fünf Bausteine, Services oder Lizenzen, die Dein Angebot tragen. Dein Kunde merkt sich keine vierzehn. Er merkt sich drei.
        Sieben ist die Schmerzgrenze. Wenn Du nicht auf fünf kommst, fehlt nicht Material — fehlt Schärfe.
      </p>

      <StepCompanion stepKey="01-beef-radar" />

      {/* Markus quote */}
      <section className="max-w-prose">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Markus&apos; Stimme</h3>
        <blockquote className="border-l-2 border-red-900 pl-4 text-base italic leading-relaxed text-gray-800" style={{ fontFamily: 'var(--font-serif)' }}>
          „Was nicht im Pitch der Top 5 ueberlebt, gehoert nicht ins Angebot — gehoert in den Nachschlag."
        </blockquote>
      </section>

      {/* Examples — light blue */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 max-w-3xl">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-3 inline-flex items-center gap-1.5">
          <BookOpen size={11} /> Konkrete Beispiele
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-gray-800">
          <p><strong>SaaS-Onboarding-Programm</strong>: 1. Setup-Workshop. 2. Wochen-1-Sprint mit Coach. 3. Playbook-Bibliothek. 4. Slack-Sparring-Channel. 5. Quartals-Review mit ROI-Report.</p>
          <p><strong>Sales-Coaching</strong>: 1. Diagnostik-Audit. 2. Bauplan-Workshop. 3. 12 Coaching-Sessions. 4. Playbook + Templates. 5. Office-Hours bei Bedarf.</p>
          <p className="text-xs text-blue-800 border-l-2 border-blue-300 pl-3 italic">
            Anti-Pattern: „Beratung", „Begleitung", „Unterstuetzung" — Hülsen. Pack das Konkrete: Workshop, Audit, Library, Channel, Review.
          </p>
        </div>
      </section>

      {/* Software input — white */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 max-w-3xl">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Deine Eingabe · Was kommt in die Box</h3>

        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Kurze Angebots-Beschreibung (optional, hilft der AI)</label>
        <textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} rows={2}
          className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="Was tut Dein Angebot? Wenn Du Welcome ausgefuellt hast, kann das auch leer bleiben." />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={initialSuggest} disabled={status === 'suggesting' || status === 'appending'}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {items.length === 0 ? 'AI: Bausteine vorschlagen' : 'AI: Erneut vorschlagen'}
          </button>
          {items.length > 0 && (
            <button onClick={suggestMore} disabled={status === 'suggesting' || status === 'appending'}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {status === 'appending' ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
              Suggest More
            </button>
          )}
        </div>
        {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
        {lastAppended !== null && lastAppended > 0 ? (
          <p className="mt-2 text-[11px] font-semibold text-green-700">+{lastAppended} neue Baustein{lastAppended === 1 ? '' : 'e'} hinzugefuegt</p>
        ) : null}
        <p className="mt-2 text-[10px] italic text-gray-500">Die AI überschreibt nie Deine Eingaben.</p>
      </section>

      {/* Items list — white box, numbered */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 max-w-3xl">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deine Top-5 Bausteine</h3>
            <p className="mt-1 text-2xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>
              Was in die Box kommt
            </p>
          </div>
          <span className="text-[11px] text-gray-500">{items.length} / 5+ Bausteine</span>
        </div>

        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {i + 1}
              </div>
              <div className="flex-1">
                <input value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })}
                  placeholder="Baustein-Name (z.B. Setup-Workshop)"
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 focus:border-blue-400 focus:outline-none" />
                <input value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })}
                  placeholder="Was leistet er (in einem Satz, nicht was er IST)"
                  className="mt-1.5 w-full bg-transparent text-xs text-gray-600 focus:outline-none" />
              </div>
              <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 mt-1.5"><X size={12} /></button>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-[11px] italic text-gray-400">Noch keine Bausteine — klick „AI: Bausteine vorschlagen" oder leg manuell los.</li>
          ) : null}
        </ol>

        <div className="mt-4 flex gap-3">
          <button onClick={addItem} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50">
            <Plus size={11} /> Baustein hinzufuegen
          </button>
          <button onClick={save} disabled={status === 'saving' || items.length === 0}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={12} /> : <Save size={12} />}
            {status === 'saved' ? 'Gespeichert' : 'Speichern · Punkte buchen'}
          </button>
        </div>

        {items.length > 0 && items.length < 5 ? (
          <p className="mt-3 text-[11px] italic text-amber-700">
            Tipp: Wenn Du unter 5 bleibst, prüft die AI im nächsten Schritt nochmal, ob nicht ein wichtiger Baustein fehlt.
          </p>
        ) : null}
      </section>
    </div>
  )
}
