import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react'
import { addPhase, updatePhase, deletePhase, addStep, updateStep, deleteStep, addProgramFramework, removeProgramFramework } from '@/lib/actions/program-content'
import { releaseProgramVersion, addStepResource, deleteStepResource } from '@/lib/actions/rollouts-admin'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'

const RES_KINDS: [string, string][] = [['resource', 'Ressource'], ['video', 'Video'], ['framework', 'Framework'], ['worksheet', 'Worksheet'], ['task_template', 'Aufgabe'], ['agent', 'Agent'], ['signal_mail', 'Signal-Mail-Text']]

interface PageProps { params: Promise<{ id: string }> }

const TYPES: [string, string][] = [
  ['lesson', 'Lesson'], ['homework', 'Homework'], ['sparring', 'Sparring Session'],
  ['story', 'Story'], ['info_why', 'Info: Warum wichtig'], ['info_how', 'Info: Wie gelernt'],
  ['tool_intro', 'Tool-Vorstellung'], ['exercise', 'Exercise'], ['examples', 'Beispiele'],
  ['tool_agent', 'Tool/Agent'], ['bonus', 'Bonus'], ['workshop', 'Workshop'],
]
const FORMATS: [string, string][] = [
  ['', '—'], ['self_paced', 'Self-paced'], ['live_group', 'Live-Gruppe'], ['one_on_one', '1:1'],
  ['upload', 'Upload'], ['video', 'Video'], ['worksheet', 'Worksheet'], ['agent', 'Agent'],
]

interface StepMeta { teams?: string[]; inputs?: string[]; outputs?: string[]; headline?: string; milestones?: string[] }
interface StepRow { id: string; phase_id: string; title: string; description: string | null; type: string; format: string | null; duration_h: number | null; is_bonus: boolean; framework_id: string | null; requires_step_id: string | null; meta: StepMeta | null }
interface PhaseRow { id: string; name: string; goal: string | null }
interface Fw { id: string; slug: string; title: string }

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params
  let name = '', slug = '', type = '', isPublished = false
  try {
    const r = (await db.execute(sql`SELECT name, slug, type, is_published FROM programs WHERE id=${id} LIMIT 1`)) as unknown as { name: string; slug: string; type: string; is_published: boolean }[]
    if (!r[0]) notFound()
    name = r[0].name; slug = r[0].slug; type = r[0].type; isPublished = r[0].is_published
  } catch { notFound() }

  const phases = (await db.execute(sql`SELECT id, name, goal FROM program_phases WHERE program_id=${id} ORDER BY sort_order`)) as unknown as PhaseRow[]
  const steps = (await db.execute(sql`SELECT id, phase_id, title, description, type, format, duration_h, is_bonus, framework_id, requires_step_id, meta FROM program_steps WHERE program_id=${id} ORDER BY sort_order`)) as unknown as StepRow[]
  const allFw = (await db.execute(sql`SELECT id, slug, title FROM landing_pages WHERE template_key='framework-leadmagnet' ORDER BY title`)) as unknown as Fw[]
  const linked = (await db.execute(sql`SELECT lp.id, lp.slug, lp.title FROM program_frameworks pf JOIN landing_pages lp ON lp.id=pf.framework_id WHERE pf.program_id=${id} ORDER BY pf.sort_order`)) as unknown as Fw[]
  const linkedIds = new Set(linked.map((f) => f.id))
  await ensureRolloutSchema()
  const versions = (await db.execute(sql`SELECT id, version, status, changelog, released_at::text AS released_at, (SELECT count(*)::int FROM rollouts r WHERE r.program_version_id=v.id) AS rollouts FROM program_versions v WHERE program_id=${id} ORDER BY released_at DESC`)) as unknown as { id: string; version: string; status: string; changelog: string | null; released_at: string; rollouts: number }[]
  const resources = (await db.execute(sql`SELECT r.id, r.program_step_id, r.kind, r.title, r.url, r.audience, r.offset_days, r.is_internal FROM step_resources r JOIN program_steps s ON s.id=r.program_step_id WHERE s.program_id=${id} ORDER BY r.sort_order, r.created_at`)) as unknown as { id: string; program_step_id: string; kind: string; title: string; url: string | null; audience: string[]; offset_days: number | null; is_internal: boolean }[]

  const inp = 'rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-300'

  return (
    <div>
      <Link href="/admin/programs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"><ChevronLeft size={14} /> Zurück zur Übersicht</Link>
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <p className="text-xs text-gray-400 font-mono mt-1">/{slug} · {type} · {isPublished ? 'Veröffentlicht' : 'Entwurf'}</p>

      {/* Enthaltene Frameworks (referenziert, nicht dupliziert) */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Enthaltene Frameworks</p>
        <p className="mb-3 text-xs text-gray-400">Referenziert — Updates am Framework fließen automatisch in dieses Programm.</p>
        <div className="flex flex-wrap gap-2">
          {linked.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {f.title.split(' — ')[0]}
              <form action={removeProgramFramework}>
                <input type="hidden" name="programId" value={id} /><input type="hidden" name="frameworkId" value={f.id} />
                <button type="submit" className="text-blue-400 hover:text-red-500"><Trash2 size={11} /></button>
              </form>
            </span>
          ))}
          {linked.length === 0 && <span className="text-xs text-gray-400">Noch keine Frameworks zugeordnet.</span>}
        </div>
        <form action={addProgramFramework} className="mt-3 flex items-center gap-2">
          <input type="hidden" name="programId" value={id} />
          <select name="frameworkId" defaultValue="" className={inp}>
            <option value="">+ Framework hinzufügen …</option>
            {allFw.filter((f) => !linkedIds.has(f.id)).map((f) => (<option key={f.id} value={f.id}>{f.title.split(' — ')[0]}</option>))}
          </select>
          <button type="submit" className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Hinzufügen</button>
        </form>
      </div>

      {/* Versionen */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Versionen</p>
        <p className="mb-3 text-xs text-gray-400">Eine Version friert den aktuellen Stand ein. Rollouts bei Kunden hängen an genau einer Version — Änderungen hier wirken erst mit der nächsten Version.</p>
        <ul className="mb-3 space-y-1 text-xs">
          {versions.map((v) => (<li key={v.id} className="flex gap-3"><span className="font-mono font-semibold text-gray-800">{v.version}</span><span className="text-gray-400">{new Date(v.released_at).toLocaleDateString('de-DE')}</span><span className="text-gray-500">{v.rollouts} Rollout{v.rollouts === 1 ? '' : 's'}</span>{v.changelog && <span className="text-gray-500">· {v.changelog}</span>}</li>))}
          {!versions.length && <li className="text-gray-400">Noch keine Version.</li>}
        </ul>
        <form action={releaseProgramVersion} className="flex items-center gap-2">
          <input type="hidden" name="programId" value={id} />
          <input name="changelog" placeholder="Was hat sich geändert? (optional)" className={`${inp} flex-1`} />
          <button type="submit" className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Version freigeben</button>
        </form>
      </div>

      {/* Phasen & Schritte Editor */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Phasen &amp; Schritte</p>
        <form action={addPhase}><input type="hidden" name="programId" value={id} />
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"><Plus size={12} /> Phase</button>
        </form>
      </div>

      <div className="mt-4 space-y-5">
        {phases.map((ph, pi) => {
          const phSteps = steps.filter((s) => s.phase_id === ph.id)
          return (
            <div key={ph.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 text-xs font-bold text-gray-400">{pi + 1}.</span>
                <form action={updatePhase} className="flex flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={ph.id} /><input type="hidden" name="programId" value={id} />
                  <input name="name" defaultValue={ph.name} placeholder="Phasen-Name" className={`${inp} flex-1 font-semibold`} />
                  <input name="goal" defaultValue={ph.goal ?? ''} placeholder="Ziel (optional)" className={`${inp} flex-1`} />
                  <button type="submit" className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"><Save size={12} /></button>
                </form>
                <form action={deletePhase}><input type="hidden" name="id" value={ph.id} /><input type="hidden" name="programId" value={id} />
                  <button type="submit" className="mt-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </form>
              </div>

              <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-3">
                {phSteps.map((st) => (
                  <div key={st.id} className="rounded-xl border border-gray-200 bg-white p-3">
                    <form action={updateStep} className="space-y-2">
                      <input type="hidden" name="id" value={st.id} /><input type="hidden" name="programId" value={id} />
                      <div className="flex items-center gap-2">
                        <input name="title" defaultValue={st.title} placeholder="Schritt-Titel" className={`${inp} flex-1 font-semibold`} />
                        <input type="number" name="durationH" defaultValue={st.duration_h ?? ''} placeholder="Std." className={`${inp} w-16`} />
                        <button type="submit" className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"><Save size={12} /></button>
                      </div>
                      <input name="headline" defaultValue={st.meta?.headline ?? ''} placeholder="Überschrift über dem Schritt (optional)" className={`${inp} w-full`} />
                      <textarea name="description" defaultValue={st.description ?? ''} placeholder="Beschreibung" rows={2} className={`${inp} w-full`} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input name="teams" defaultValue={(st.meta?.teams ?? []).join(', ')} placeholder="Teams (Komma-getrennt)" className={inp} />
                        <textarea name="inputs" defaultValue={(st.meta?.inputs ?? []).join('\n')} placeholder="Nötiger Input (eine Zeile je Punkt)" rows={2} className={inp} />
                        <textarea name="outputs" defaultValue={(st.meta?.outputs ?? []).join('\n')} placeholder="Output (eine Zeile je Punkt)" rows={2} className={inp} />
                      </div>
                      <input name="milestones" defaultValue={(st.meta?.milestones ?? []).join(' | ')} placeholder="Etappen-Hinweise (mit | trennen)" className={`${inp} w-full`} />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <select name="type" defaultValue={st.type} className={inp}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <select name="format" defaultValue={st.format ?? ''} className={inp}>{FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <select name="frameworkId" defaultValue={st.framework_id ?? ''} className={inp}>
                          <option value="">Framework/Agent: —</option>
                          {allFw.map((f) => <option key={f.id} value={f.id}>{f.title.split(' — ')[0]}</option>)}
                        </select>
                        <select name="requiresStepId" defaultValue={st.requires_step_id ?? ''} className={inp}>
                          <option value="">setzt voraus: —</option>
                          {steps.filter((o) => o.id !== st.id).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500"><input type="checkbox" name="isBonus" value="1" defaultChecked={st.is_bonus} className="h-3.5 w-3.5" /> Bonus</label>
                    </form>
                    <div className="mt-2 rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Material am Schritt</p>
                      <ul className="mt-1 space-y-0.5">
                        {resources.filter((r) => r.program_step_id === st.id).map((r) => (
                          <li key={r.id} className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-500">{RES_KINDS.find((k) => k[0] === r.kind)?.[1] ?? r.kind}</span>
                            {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{r.title}</a> : r.title}
                            {r.audience?.length ? <span className="text-gray-400">({r.audience.join(', ')})</span> : null}
                            {r.offset_days !== null ? <span className="text-gray-400">T{r.offset_days >= 0 ? '+' : ''}{r.offset_days}</span> : null}
                            {r.is_internal && <span className="text-amber-600">intern</span>}
                            <form action={deleteStepResource} className="ml-auto"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="programId" value={id} /><button type="submit" className="text-gray-400 hover:text-red-500"><Trash2 size={11} /></button></form>
                          </li>
                        ))}
                      </ul>
                      <form action={addStepResource} className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-6">
                        <input type="hidden" name="stepId" value={st.id} /><input type="hidden" name="programId" value={id} />
                        <select name="kind" className={`${inp} text-xs`}>{RES_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <input name="title" placeholder="Titel" className={`${inp} text-xs sm:col-span-2`} />
                        <input name="url" placeholder="URL (optional)" className={`${inp} text-xs`} />
                        <input name="audience" placeholder="Teams, z. B. sales" className={`${inp} text-xs`} />
                        <span className="flex items-center gap-1">
                          <input name="offsetDays" type="number" placeholder="T±" className={`${inp} w-14 text-xs`} />
                          <label className="flex items-center gap-1 text-[10px] text-gray-500"><input type="checkbox" name="isInternal" value="1" />intern</label>
                          <button type="submit" className="rounded-md bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white"><Plus size={11} /></button>
                        </span>
                      </form>
                    </div>
                    <form action={deleteStep} className="mt-1 text-right"><input type="hidden" name="id" value={st.id} /><input type="hidden" name="programId" value={id} />
                      <button type="submit" className="text-[11px] text-gray-400 hover:text-red-500">löschen</button>
                    </form>
                  </div>
                ))}
                <form action={addStep}><input type="hidden" name="phaseId" value={ph.id} /><input type="hidden" name="programId" value={id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-white"><Plus size={11} /> Schritt</button>
                </form>
              </div>
            </div>
          )
        })}
        {phases.length === 0 && <p className="text-sm text-gray-400">Noch keine Phasen. Oben „Phase" hinzufügen.</p>}
      </div>
    </div>
  )
}
