import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react'
import { addPhase, updatePhase, deletePhase, addStep, updateStep, deleteStep, addProgramFramework, removeProgramFramework } from '@/lib/actions/program-content'

interface PageProps { params: Promise<{ id: string }> }

const TYPES: [string, string][] = [
  ['lesson', 'Lesson'], ['homework', 'Homework'], ['sparring', 'Sparring Session'],
  ['story', 'Story'], ['info_why', 'Info: Warum wichtig'], ['info_how', 'Info: Wie gelernt'],
  ['tool_intro', 'Tool-Vorstellung'], ['exercise', 'Exercise'], ['examples', 'Beispiele'],
  ['tool_agent', 'Tool/Agent'], ['bonus', 'Bonus'],
]
const FORMATS: [string, string][] = [
  ['', '—'], ['self_paced', 'Self-paced'], ['live_group', 'Live-Gruppe'], ['one_on_one', '1:1'],
  ['upload', 'Upload'], ['video', 'Video'], ['worksheet', 'Worksheet'], ['agent', 'Agent'],
]

interface StepRow { id: string; phase_id: string; title: string; description: string | null; type: string; format: string | null; duration_h: number | null; is_bonus: boolean; framework_id: string | null; requires_step_id: string | null }
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
  const steps = (await db.execute(sql`SELECT id, phase_id, title, description, type, format, duration_h, is_bonus, framework_id, requires_step_id FROM program_steps WHERE program_id=${id} ORDER BY sort_order`)) as unknown as StepRow[]
  const allFw = (await db.execute(sql`SELECT id, slug, title FROM landing_pages WHERE template_key='framework-leadmagnet' ORDER BY title`)) as unknown as Fw[]
  const linked = (await db.execute(sql`SELECT lp.id, lp.slug, lp.title FROM program_frameworks pf JOIN landing_pages lp ON lp.id=pf.framework_id WHERE pf.program_id=${id} ORDER BY pf.sort_order`)) as unknown as Fw[]
  const linkedIds = new Set(linked.map((f) => f.id))

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
                      <textarea name="description" defaultValue={st.description ?? ''} placeholder="Beschreibung" rows={2} className={`${inp} w-full`} />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <select name="type" defaultValue={st.type} className={inp}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <select name="format" defaultValue={st.format ?? ''} className={inp}>{FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <select name="frameworkId" defaultValue={st.framework_id ?? ''} className={inp}>
                          <option value="">Framework/Agent: —</option>
                          {allFw.map((f) => <option key={f.id} value={f.id}>{f.title.split(' — ')[0]}</option>)}
                        </select>
                        <select name="requiresStepId" defaultValue={st.requires_step_id ?? ''} className={inp}>
                          <option value="">setzt voraus: —</option>
                          {phSteps.filter((o) => o.id !== st.id).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500"><input type="checkbox" name="isBonus" value="1" defaultChecked={st.is_bonus} className="h-3.5 w-3.5" /> Bonus</label>
                    </form>
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
