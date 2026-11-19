'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Maximize2, Paperclip, X } from 'lucide-react'
import { saveLessonAction } from '@/lib/actions/courses'
import type { LessonInput, Slide, Submission, LessonKind } from '@/lib/courses/store'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'

function Slides({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0)
  const [full, setFull] = useState(false)
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(slides.length - 1, x + d))), [slides.length])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea')) return
      if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') setFull(false)
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [go])
  const s = slides[i]
  const frame = (big: boolean) => (
    <div className={`relative overflow-hidden ${big ? '' : 'rounded-[18px]'} bg-[#F3F2F2]`} style={{ aspectRatio: '16 / 9' }}>
      <img src={s.url} alt={s.title ?? `Folie ${i + 1}`} className="h-full w-full object-contain" />
      <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Vorherige Folie" className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize disabled:cursor-default" />
      <button type="button" onClick={() => go(1)} disabled={i === slides.length - 1} aria-label="Nächste Folie" className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize disabled:cursor-default" />
    </div>
  )
  return (
    <div className="flex flex-col gap-3">
      {frame(false)}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} disabled={i === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E3E1] bg-white disabled:opacity-40" aria-label="Zurück"><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => go(1)} disabled={i === slides.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E3E1] bg-white disabled:opacity-40" aria-label="Weiter"><ChevronRight size={17} /></button>
        <span className="text-[13px] tabular-nums" style={{ color: muted }}>Folie {i + 1} von {slides.length}</span>
        <div className="ml-auto flex gap-1.5 overflow-x-auto">
          {slides.length <= 14 && slides.map((_, k) => <button key={k} type="button" onClick={() => setI(k)} aria-label={`Folie ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-[#1A5FD4]' : 'w-2 bg-[#D6DCE8]'}`} />)}
        </div>
        <button type="button" onClick={() => setFull(true)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E3E1] bg-white" aria-label="Vollbild"><Maximize2 size={15} /></button>
      </div>
      {full && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0E1733]/95 p-4" onClick={(e) => { if (e.target === e.currentTarget) setFull(false) }}>
          <div className="w-full max-w-[1400px]">{frame(true)}<p className="mt-3 text-center text-[13px] text-white/70">Folie {i + 1} von {slides.length} · Pfeiltasten zum Blättern · Esc schließt</p></div>
          <button type="button" onClick={() => setFull(false)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Schließen"><X size={20} /></button>
        </div>
      )}
    </div>
  )
}

function Scale({ inp, value, onChange, disabled }: { inp: LessonInput; value: number | null; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[15px] font-semibold">{inp.label}</span>
      {inp.hint && <span className="-mt-2 text-[13px]" style={{ color: muted }}>{inp.hint}</span>}
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
          <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)}
            className={`h-10 rounded-lg text-[14px] font-semibold tabular-nums transition-colors ${value === n ? 'bg-[#1A5FD4] text-white' : value !== null && n < value ? 'bg-[#C9D8F5] text-[#124293]' : 'bg-[#F1F3F7] text-[#3A3836] hover:bg-[#E3EAF6]'}`}>{n}</button>
        ))}
      </div>
      <div className="flex justify-between text-[12px]" style={{ color: muted }}><span>{inp.low ?? 'wenig'}</span><span>{inp.high ?? 'sehr'}</span></div>
    </div>
  )
}

export function LessonBody({ lesson, eyebrow, answers, submissions, next, courseHref, readOnly }: {
  lesson: { id: string; kind: LessonKind; title: string; summary: string | null; body: string | null; videoUrl: string | null; slides: Slide[]; inputs: LessonInput[]; done: boolean }
  eyebrow: string; answers: Record<string, unknown>; submissions: Submission[]
  next: { title: string; href: string } | null; courseHref: string; readOnly: boolean
}) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, unknown>>(answers)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Text: speichern, sobald man aufhört zu tippen; Skala: sofort
  function set(key: string, v: unknown, now = false) {
    const nv = { ...vals, [key]: v }
    setVals(nv)
    if (readOnly) return
    if (timer.current) clearTimeout(timer.current)
    const run = async () => { setSaved('saving'); const r = await saveLessonAction(lesson.id, { [key]: v }, null); setSaved(r.ok ? 'saved' : 'idle'); if (!r.ok) setErr(r.error ?? '') }
    if (now) run(); else timer.current = setTimeout(run, 900)
  }

  function complete() {
    start(async () => {
      setErr('')
      const r = await saveLessonAction(lesson.id, null, true)
      if (!r.ok) { setErr(r.error ?? 'Speichern fehlgeschlagen'); return }
      router.push((next?.href ?? courseHref) as '/')
      router.refresh()
    })
  }

  return (
    <article className="flex min-w-0 flex-col gap-7">
      <header className="flex flex-col gap-2.5">
        <span className="text-[12px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">{eyebrow}</span>
        <h1 className="m-0 text-[34px] font-bold leading-[1.1] tracking-[-.025em]">{lesson.title}</h1>
        {lesson.summary && <p className="m-0 max-w-[720px] text-[18px] leading-relaxed text-[#124293]">{lesson.summary}</p>}
      </header>

      {lesson.videoUrl && (
        <div className="overflow-hidden rounded-[18px] bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe src={lesson.videoUrl} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={lesson.title} />
        </div>
      )}

      {lesson.slides.length > 0 && <Slides slides={lesson.slides} />}

      {lesson.body && (
        <div className={`${card} p-7 sm:p-8`}>
          <div className="flex max-w-[720px] flex-col gap-4 text-[16px] leading-[1.7]" style={{ color: '#3A3836' }}>
            {lesson.body.split(/\n{2,}/).map((para, k) => para.startsWith('- ')
              ? <ul key={k} className="m-0 flex list-disc flex-col gap-1.5 pl-5">{para.split('\n').map((li, n) => <li key={n}>{li.replace(/^- /, '')}</li>)}</ul>
              : para.startsWith('## ') ? <h3 key={k} className="m-0 mt-2 text-[19px] font-bold text-[#0D0D0B]">{para.slice(3)}</h3>
              : <p key={k} className="m-0">{para}</p>)}
          </div>
        </div>
      )}

      {lesson.inputs.length > 0 && (
        <div className={`${card} flex flex-col gap-6 p-7 sm:p-8`}>
          <div className="flex items-baseline justify-between gap-3">
            <b className="text-[18px]">Deine Einschätzung</b>
            <span className="text-[12px]" style={{ color: muted }}>{readOnly ? 'Vorschau' : saved === 'saving' ? 'speichert …' : saved === 'saved' ? 'gespeichert' : 'nur für Dich und Deinen Coach'}</span>
          </div>
          {lesson.inputs.map((inp) => inp.type === 'scale'
            ? <Scale key={inp.key} inp={inp} value={typeof vals[inp.key] === 'number' ? (vals[inp.key] as number) : null} onChange={(v) => set(inp.key, v, true)} disabled={readOnly} />
            : (
              <label key={inp.key} className="flex flex-col gap-2">
                <span className="text-[15px] font-semibold">{inp.label}</span>
                {inp.hint && <span className="-mt-1 text-[13px]" style={{ color: muted }}>{inp.hint}</span>}
                <textarea rows={3} disabled={readOnly} value={String(vals[inp.key] ?? '')} onChange={(e) => set(inp.key, e.target.value)}
                  className="w-full rounded-xl border border-[#E6E3E1] bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1A5FD4] focus:shadow-[0_0_0_4px_rgba(26,95,212,.12)]" />
              </label>
            ))}
        </div>
      )}

      {lesson.kind === 'homework' && <Homework lessonId={lesson.id} submissions={submissions} readOnly={readOnly} onDone={() => router.refresh()} />}

      <div className="flex flex-wrap items-center gap-4 border-t border-[#ECEAE8] pt-6">
        {lesson.kind !== 'homework' && !readOnly && (
          <button type="button" onClick={complete} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-6 py-3.5 text-[15px] font-bold text-white disabled:opacity-60">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{lesson.done ? 'Erledigt' : 'Als erledigt markieren'}{next ? ' und weiter' : ''}
          </button>
        )}
        {next && <Link href={next.href as '/'} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#1A5FD4] no-underline">Weiter: {next.title}<ArrowRight size={15} /></Link>}
        {err && <span className="text-[14px] text-[#B0001F]">{err}</span>}
      </div>
    </article>
  )
}

function Homework({ lessonId, submissions, readOnly, onDone }: { lessonId: string; submissions: Submission[]; readOnly: boolean; onDone: () => void }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<'idle' | 'busy' | 'ok'>('idle')
  const [pct, setPct] = useState(0)
  const [err, setErr] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setState('busy'); setPct(0)
    try {
      let fileUrl: string | null = null
      if (file) {
        const { upload } = await import('@vercel/blob/client')
        const b = await upload(`homework/${file.name.replace(/[^\w.\-]+/g, '_')}`, file, { access: 'public', handleUploadUrl: '/api/courses/upload', clientPayload: lessonId, onUploadProgress: (p) => setPct(Math.round(p.percentage)) })
        fileUrl = b.url
      }
      const r = await fetch('/api/courses/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lessonId, text, fileUrl, fileName: file?.name }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || 'Einreichen fehlgeschlagen')
      setState('ok'); setText(''); setFile(null); onDone()
    } catch (x) { setState('idle'); setErr((x as Error).message) }
  }

  return (
    <div className={`${card} flex flex-col gap-5 p-7 sm:p-8`}>
      <b className="text-[18px]">Deine Homework</b>
      {submissions.map((s) => (
        <div key={s.id} className="flex flex-col gap-2 rounded-2xl bg-[#F7F8FB] p-5">
          <span className="text-[13px] font-semibold text-[#16955C]"><Check size={14} className="mr-1 inline" />Eingereicht am {new Date(s.submittedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          {s.text && <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed">{s.text}</p>}
          {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#1A5FD4]"><Paperclip size={14} />{s.fileName ?? 'Datei'}</a>}
          {s.feedback
            ? <div className="mt-2 rounded-xl border-l-4 border-[#1A5FD4] bg-white px-4 py-3"><span className="block text-[12px] font-bold uppercase tracking-[.1em] text-[#1A5FD4]">Feedback von Deinem Coach</span><p className="m-0 mt-1 whitespace-pre-line text-[15px] leading-relaxed">{s.feedback}</p></div>
            : <span className="text-[13px]" style={{ color: muted }}>Feedback folgt.</span>}
        </div>
      ))}
      {!readOnly && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {submissions.length > 0 && <span className="text-[14px]" style={{ color: muted }}>Du kannst jederzeit eine neue Version einreichen.</span>}
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Was hast Du gemacht, was ist Dir aufgefallen? Gern auch Dein Transkript hier hineinkopieren."
            className="w-full rounded-xl border border-[#E6E3E1] bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1A5FD4] focus:shadow-[0_0_0_4px_rgba(26,95,212,.12)]" />
          <div className="flex flex-wrap items-center gap-3">
            <input ref={ref} type="file" className="hidden" accept=".txt,.md,.pdf,.doc,.docx,.rtf,.vtt,.srt,audio/*,video/*,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#E6E3E1] bg-white px-4 py-2.5 text-[14px] font-semibold"><Paperclip size={15} />{file ? file.name : 'Datei anhängen (Aufnahme, Transkript, Dokument)'}</button>
            {file && <button type="button" onClick={() => setFile(null)} className="text-[13px]" style={{ color: muted }}>entfernen</button>}
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={state === 'busy' || (!text.trim() && !file)} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-6 py-3.5 text-[15px] font-bold text-white disabled:opacity-50">
              {state === 'busy' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{state === 'busy' && file ? `Lädt hoch … ${pct} %` : 'Einreichen'}
            </button>
            {state === 'ok' && <span className="text-[14px] font-semibold text-[#16955C]">Eingereicht. Danke!</span>}
            {err && <span className="text-[14px] text-[#B0001F]">{err}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
