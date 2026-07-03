'use client'
import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Save, GripVertical, Eye, ExternalLink } from 'lucide-react'
import { saveEventTypeAction, deleteEventTypeAction, saveHostProfileAction, type EventTypePayload } from '@/lib/actions/schedule-admin'

type ET = {
  id: string; ownerSlug: string; slug: string; name: string; description: string; durationMin: number
  bufferBeforeMin: number; bufferAfterMin: number; maxPerDay: number | null; visibility: string
  infoText: string; questions: { id: string; label: string; type: string; options?: string[]; required: boolean }[]
  reminders: { hoursBefore: number }[]; sort: number
}
type Owner = { slug: string; name: string }
type Host = { personSlug: string; avatarUrl: string; intro: string }
type QDraft = { id: string; label: string; type: string; optionsText: string; required: boolean }
type Draft = {
  id?: string; ownerSlug: string; slug: string; name: string; description: string; durationMin: number
  bufferBeforeMin: number; bufferAfterMin: number; maxPerDay: string; visibility: string; infoText: string
  questions: QDraft[]; remindersText: string; sort: number
}

const VIS: Record<string, string> = { live: 'Live (öffentlich)', internal: 'Intern (nur per Link)', offline: 'Offline (aus)' }

function emptyDraft(ownerSlug: string): Draft {
  return { ownerSlug, slug: '', name: '', description: '', durationMin: 30, bufferBeforeMin: 0, bufferAfterMin: 15, maxPerDay: '', visibility: 'live', infoText: '', questions: [], remindersText: '24', sort: 0 }
}
function toDraft(t: ET): Draft {
  return {
    id: t.id, ownerSlug: t.ownerSlug, slug: t.slug, name: t.name, description: t.description, durationMin: t.durationMin,
    bufferBeforeMin: t.bufferBeforeMin, bufferAfterMin: t.bufferAfterMin, maxPerDay: t.maxPerDay == null ? '' : String(t.maxPerDay),
    visibility: t.visibility, infoText: t.infoText,
    questions: t.questions.map(q => ({ id: q.id, label: q.label, type: q.type, optionsText: (q.options || []).join(', '), required: q.required })),
    remindersText: (t.reminders || []).map(r => r.hoursBefore).join(', '), sort: t.sort,
  }
}

export function EventTypeEditor({ owners, types, hosts }: { owners: Owner[]; types: ET[]; hosts: Host[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function save() {
    if (!draft) return
    setErr(null)
    const payload: EventTypePayload = {
      id: draft.id, ownerSlug: draft.ownerSlug, slug: draft.slug || undefined, name: draft.name, description: draft.description,
      durationMin: Number(draft.durationMin), bufferBeforeMin: Number(draft.bufferBeforeMin), bufferAfterMin: Number(draft.bufferAfterMin),
      maxPerDay: draft.maxPerDay.trim() === '' ? null : Number(draft.maxPerDay), visibility: draft.visibility as EventTypePayload['visibility'],
      infoText: draft.infoText, sort: Number(draft.sort),
      questions: draft.questions.filter(q => q.label.trim()).map(q => ({ id: q.id, label: q.label, type: q.type as 'text' | 'textarea' | 'select', options: q.type === 'select' ? q.optionsText.split(',').map(o => o.trim()).filter(Boolean) : undefined, required: q.required })),
      reminders: draft.remindersText.split(',').map(x => ({ hoursBefore: Number(x.trim()) })).filter(r => r.hoursBefore > 0),
    }
    if (!payload.name.trim()) { setErr('Bitte einen Namen angeben.'); return }
    start(async () => { try { await saveEventTypeAction(payload); setDraft(null); router.refresh() } catch { setErr('Speichern fehlgeschlagen.') } })
  }
  function del(id: string) { if (!confirm('Diesen Event-Typ wirklich löschen?')) return; start(async () => { await deleteEventTypeAction(id); router.refresh() }) }

  if (draft) return <EditorForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => { setDraft(null); setErr(null) }} pending={pending} err={err} />

  return (
    <div className="space-y-8">
      {owners.map(o => {
        const list = types.filter(t => t.ownerSlug === o.slug).sort((a, b) => a.sort - b.sort)
        return (
          <div key={o.slug}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">{o.name}</h3>
              <button onClick={() => setDraft(emptyDraft(o.slug))} className="inline-flex items-center gap-1 rounded-full bg-[#1A5FD4] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"><Plus size={13} /> Neuer Typ</button>
            </div>
            {list.length === 0 ? <p className="text-xs text-gray-400">Noch keine Event-Typen.</p> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map(t => (
                  <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{t.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{t.durationMin} Min · /{t.slug}{t.maxPerDay ? ` · max ${t.maxPerDay}/Tag` : ''}</p>
                      </div>
                      <span className={'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ' + (t.visibility === 'live' ? 'bg-green-50 text-green-700' : t.visibility === 'internal' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500')}>{t.visibility === 'live' ? 'Live' : t.visibility === 'internal' ? 'Intern' : 'Offline'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setDraft(toDraft(t))} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-blue-300"><Pencil size={12} /> Bearbeiten</button>
                      <a href={`/schedule/${t.ownerSlug}/${t.slug}?preview=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-blue-300"><Eye size={12} /> Vorschau</a>
                      {t.visibility !== 'offline' && <a href={`/schedule/${t.ownerSlug}/${t.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:border-green-300"><ExternalLink size={12} /> Live-Seite</a>}
                      <button onClick={() => del(t.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-600"><Trash2 size={12} /> Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-900">Gastgeber-Profile</h3>
        <p className="mb-3 text-xs text-gray-400">Avatar &amp; Kurzintro erscheinen auf den Buchungsseiten.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {hosts.map(h => <HostCard key={h.personSlug} host={h} owners={owners} />)}
        </div>
      </div>
    </div>
  )
}

function HostCard({ host, owners }: { host: Host; owners: Owner[] }) {
  const router = useRouter()
  const [avatar, setAvatar] = useState(host.avatarUrl)
  const [intro, setIntro] = useState(host.intro)
  const [pending, start] = useTransition()
  const [ok, setOk] = useState(false)
  const name = owners.find(o => o.slug === host.personSlug)?.name || host.personSlug
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-sm font-bold text-gray-900">{name}</p>
      <input value={avatar} onChange={e => { setAvatar(e.target.value); setOk(false) }} placeholder="Avatar-URL (https://…)" className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400" />
      <textarea value={intro} onChange={e => { setIntro(e.target.value); setOk(false) }} placeholder="Kurzintro" rows={3} className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400" />
      <button onClick={() => start(async () => { await saveHostProfileAction(host.personSlug, avatar, intro); setOk(true); router.refresh() })} disabled={pending} className="mt-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Speichern…' : ok ? 'Gespeichert ✓' : 'Speichern'}</button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-gray-700">{label}</span>{children}</label>
}
const inp = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400'

function EditorForm({ draft, setDraft, onSave, onCancel, pending, err }: { draft: Draft; setDraft: (d: Draft) => void; onSave: () => void; onCancel: () => void; pending: boolean; err: string | null }) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const setQ = (i: number, patch: Partial<QDraft>) => set({ questions: draft.questions.map((q, j) => j === i ? { ...q, ...patch } : q) })
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">{draft.id ? 'Event-Typ bearbeiten' : 'Neuer Event-Typ'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input value={draft.name} onChange={e => set({ name: e.target.value })} className={inp} placeholder="Kennenlernen" /></Field>
        <div>
          <Field label="URL-Slug (optional)"><input value={draft.slug} onChange={e => set({ slug: e.target.value })} className={inp} placeholder="wird aus Name erzeugt" /></Field>
          {draft.id && <p className="mt-1 text-[11px] leading-snug text-amber-600">Achtung: Den Slug nachträglich zu ändern bricht bestehende Links (Navi, „Book a call", Kontakt, bereits geteilte Buchungslinks). Besser nur den Namen ändern und den Slug lassen.</p>}
        </div>
        <Field label="Beschreibung"><input value={draft.description} onChange={e => set({ description: e.target.value })} className={inp} /></Field>
        <Field label="Sichtbarkeit"><select value={draft.visibility} onChange={e => set({ visibility: e.target.value })} className={inp}>{Object.entries(VIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Dauer (Min)"><input type="number" value={draft.durationMin} onChange={e => set({ durationMin: Number(e.target.value) })} className={inp} /></Field>
        <Field label="Max Buchungen / Tag (leer = unbegrenzt)"><input type="number" value={draft.maxPerDay} onChange={e => set({ maxPerDay: e.target.value })} className={inp} /></Field>
        <Field label="Puffer davor (Min)"><input type="number" value={draft.bufferBeforeMin} onChange={e => set({ bufferBeforeMin: Number(e.target.value) })} className={inp} /></Field>
        <Field label="Puffer danach (Min)"><input type="number" value={draft.bufferAfterMin} onChange={e => set({ bufferAfterMin: Number(e.target.value) })} className={inp} /></Field>
        <Field label="Erinnerungen (Std. vorher, kommagetrennt)"><input value={draft.remindersText} onChange={e => set({ remindersText: e.target.value })} className={inp} placeholder="24" /></Field>
        <Field label="Reihenfolge"><input type="number" value={draft.sort} onChange={e => set({ sort: Number(e.target.value) })} className={inp} /></Field>
      </div>
      <div className="mt-4"><Field label="Info-Text fürs Buchungsformular"><textarea value={draft.infoText} onChange={e => set({ infoText: e.target.value })} rows={3} className={inp} placeholder="Was der Gast vorab wissen sollte …" /></Field></div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700">Fragen an den Gast</p>
          <button onClick={() => set({ questions: [...draft.questions, { id: `q${draft.questions.length + 1}`, label: '', type: 'text', optionsText: '', required: true }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><Plus size={12} /> Frage</button>
        </div>
        <div className="space-y-2">
          {draft.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-300" />
                <input value={q.label} onChange={e => setQ(i, { label: e.target.value })} placeholder="Frage" className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400" />
                <select value={q.type} onChange={e => setQ(i, { type: e.target.value })} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"><option value="text">Text</option><option value="textarea">Mehrzeilig</option><option value="select">Auswahl</option></select>
                <label className="flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" checked={q.required} onChange={e => setQ(i, { required: e.target.checked })} /> Pflicht</label>
                <button onClick={() => set({ questions: draft.questions.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
              {q.type === 'select' && <input value={q.optionsText} onChange={e => setQ(i, { optionsText: e.target.value })} placeholder="Optionen, kommagetrennt" className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400" />}
            </div>
          ))}
          {!draft.questions.length && <p className="text-xs text-gray-400">Keine Fragen — der Gast gibt nur Name &amp; E-Mail an.</p>}
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <div className="mt-6 flex gap-2">
        <button onClick={onSave} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={15} />{pending ? 'Speichern…' : 'Speichern'}</button>
        <button onClick={onCancel} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600">Abbrechen</button>
      </div>
    </div>
  )
}
