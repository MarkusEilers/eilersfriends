'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Save, Wand2, Image as ImageIcon, Loader2, Upload, Eye, Trash2, Check, X, AlertTriangle, Scissors, Tags,
} from 'lucide-react'
import { AUTHOR_LIST, AUTHORS } from '@/lib/blog/authors'

const LOCALES = ['de', 'en', 'es'] as const
const LOCALE_LABEL: Record<string, string> = { de: 'Deutsch', en: 'English', es: 'Español' }

type Status = 'draft' | 'review' | 'scheduled' | 'published'

export interface EditorPost {
  id?: string | null
  title: string; subtitle: string; excerpt: string; content: string
  author_slug: 'markus' | 'aljona'
  tags: string[]
  hero_image: string | null; hero_alt: string | null; image_prompt: string | null
  status: Status; published_at: string | null; comments_open: boolean
  locale: string; translation_of: string | null
  slug?: string
}

export interface Sibling { id: string; locale: string; slug: string; status: string; title: string }

const EMPTY: EditorPost = {
  title: '', subtitle: '', excerpt: '', content: '', author_slug: 'markus', tags: [],
  hero_image: null, hero_alt: null, image_prompt: null,
  status: 'draft', published_at: null, comments_open: true,
  locale: 'de', translation_of: null,
}

const STATUS_LABEL: Record<Status, string> = {
  draft: 'Entwurf', review: 'In Prüfung', scheduled: 'Geplant', published: 'Veröffentlicht',
}

/**
 * Zwei Spalten: links der Text, rechts alles, was kein Text ist.
 *
 * Kein Baukasten mit Bloecken — fuer ein Briefing ist Markdown die schnellere
 * Schreibflaeche, und die Einzelseite versteht bereits Ueberschriften, Zitate,
 * Listen und Fettung.
 */
export function PostEditor({
  initial, knownTags, siblings: initialSiblings,
}: { initial?: EditorPost | null; knownTags: string[]; siblings?: Sibling[] }) {
  const [post, setPost] = useState<EditorPost>(initial ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [panel, setPanel] = useState<{ kind: string; data: Record<string, unknown> } | null>(null)
  const [siblings, setSiblings] = useState<Sibling[]>(initialSiblings ?? [])
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof EditorPost>(k: K, v: EditorPost[K]) => setPost((p) => ({ ...p, [k]: v }))
  const a = AUTHORS[post.author_slug]
  const words = useMemo(() => post.content.trim().split(/\s+/).filter(Boolean).length, [post.content])

  async function save() {
    setSaving(true); setNote(null)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id, title: post.title, subtitle: post.subtitle, excerpt: post.excerpt,
          content: post.content, authorSlug: post.author_slug, tags: post.tags,
          heroImage: post.hero_image, heroAlt: post.hero_alt, imagePrompt: post.image_prompt,
          status: post.status, publishedAt: post.published_at, commentsOpen: post.comments_open,
          locale: post.locale, translationOf: post.translation_of,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Speichern fehlgeschlagen')
      setPost((p) => ({ ...p, id: d.post.id, slug: d.post.slug }))
      setNote('Gespeichert.')
    } catch (e) { setNote(String(e)) } finally { setSaving(false) }
  }

  async function help(kind: string) {
    setBusy(kind); setPanel(null)
    try {
      const res = await fetch('/api/admin/blog/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind, authorSlug: post.author_slug, title: post.title,
          subtitle: post.subtitle, content: post.content, tags: knownTags,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setPanel({ kind, data: d.result })
    } catch (e) { setNote(String(e)) } finally { setBusy(null) }
  }

  async function makeImage() {
    setBusy('bild')
    try {
      let prompt = post.image_prompt
      if (!prompt) {
        const r = await fetch('/api/admin/blog/assist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'bildprompt', authorSlug: post.author_slug,
            title: post.title, subtitle: post.subtitle, content: post.content,
          }),
        }).then((x) => x.json())
        prompt = r.result?.prompt ?? null
        if (r.result?.alt) set('hero_alt', r.result.alt)
        if (prompt) set('image_prompt', prompt)
      }
      if (!prompt) throw new Error('Kein Bildauftrag')
      const res = await fetch('/api/admin/blog/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, slug: post.slug ?? 'beitrag' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      set('hero_image', d.url)
      setNote(`Bild erzeugt (${d.model}).`)
    } catch (e) { setNote(String(e)) } finally { setBusy(null) }
  }

  async function uploadImage(f: File) {
    setBusy('bild')
    try {
      const fd = new FormData(); fd.append('file', f); fd.append('slug', post.slug ?? 'beitrag')
      const res = await fetch('/api/admin/blog/image', { method: 'PUT', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      set('hero_image', d.url)
    } catch (e) { setNote(String(e)) } finally { setBusy(null) }
  }

  async function uploadDoc(f: File) {
    setBusy('datei')
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setPost((p) => ({
        ...p, title: d.draft.title || p.title, subtitle: d.draft.subtitle ?? p.subtitle,
        excerpt: d.draft.excerpt ?? p.excerpt, content: d.draft.content,
        tags: d.draft.tags?.length ? d.draft.tags : p.tags,
        author_slug: d.draft.authorSlug ?? p.author_slug,
      }))
      setNote('Datei übernommen — jetzt prüfen und speichern.')
    } catch (e) { setNote(String(e)) } finally { setBusy(null) }
  }

  /**
   * Uebersetzen legt einen eigenen Beitrag in der Zielsprache an, kein Feld im
   * bestehenden. So kann eine Sprache veroeffentlicht sein und eine andere noch
   * im Entwurf liegen — und die Uebersetzung laesst sich getrennt bearbeiten.
   */
  async function translate(target: string) {
    if (!post.id) { setNote('Bitte zuerst speichern.'); return }
    setBusy(`t-${target}`)
    try {
      const r = await fetch('/api/admin/blog/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'uebersetzen', authorSlug: post.author_slug, targetLocale: target,
          title: post.title, subtitle: post.subtitle, excerpt: post.excerpt, content: post.content,
        }),
      }).then((x) => x.json())
      if (!r.ok) throw new Error(r.error)
      const t = r.result
      const res = await fetch('/api/admin/blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t.title, subtitle: t.subtitle ?? '', excerpt: t.excerpt ?? '', content: t.content,
          authorSlug: post.author_slug, tags: t.tags ?? post.tags,
          heroImage: post.hero_image, heroAlt: post.hero_alt,
          status: 'draft', locale: target, translationOf: post.translation_of ?? post.id,
          commentsOpen: post.comments_open,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setSiblings((s) => [...s, { id: d.post.id, locale: target, slug: d.post.slug, status: 'draft', title: d.post.title }])
      setNote(`Übersetzung angelegt — als Entwurf. ${(t.abweichungen ?? []).length} Stellen weichen bewusst vom Wortlaut ab.`)
    } catch (e) { setNote(String(e)) } finally { setBusy(null) }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void save() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="space-y-3">
        <input
          value={post.title} onChange={(e) => set('title', e.target.value)} placeholder="Titel"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-2xl font-bold outline-none focus:border-gray-400"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        />
        <input
          value={post.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)}
          placeholder="Untertitel — schärft den Titel, wiederholt ihn nicht"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        />
        <textarea
          value={post.content} onChange={(e) => set('content', e.target.value)}
          placeholder="Text in Markdown. Zwischenüberschrift mit zwei Rauten, Zitat mit spitzer Klammer, Liste mit Strich."
          className="h-[560px] w-full resize-y rounded-xl border border-gray-200 bg-white p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-gray-400"
        />
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{words} Wörter · ca. {Math.max(1, Math.round(words / 200))} Min</span>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 hover:text-gray-700">
            <Upload size={12} /> Datei laden
          </button>
          <input
            ref={fileRef} type="file" accept=".md,.markdown,.txt,.docx" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])}
          />
          {busy === 'datei' && <Loader2 size={12} className="animate-spin" />}
        </div>

        {panel && <AssistPanel panel={panel} post={post} set={set} onClose={() => setPanel(null)} />}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={save} disabled={saving || !post.title.trim()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: a.accent }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Speichern
            </button>
            {post.slug && (
              <a
                href={`/de/blog/${post.slug}?preview=1`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <Eye size={14} /> Vorschau
              </a>
            )}
          </div>
          {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}

          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <button
                key={s} onClick={() => set('status', s)}
                className="rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors"
                style={post.status === s
                  ? { borderColor: a.accent, background: a.tint, color: a.accent }
                  : { borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {(post.status === 'scheduled' || post.status === 'published') && (
            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {post.status === 'scheduled' ? 'Erscheint am' : 'Veröffentlicht am'}
              </div>
              <input
                type="datetime-local"
                value={post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
              />
              {post.status === 'scheduled' && !post.published_at && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertTriangle size={11} /> Ohne Zeitpunkt erscheint der Beitrag nie.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sprache</div>
          <div className="mt-1.5 space-y-1">
            {LOCALES.map((l) => {
              const self = post.locale === l
              const sib = siblings.find((s) => s.locale === l && s.id !== post.id)
              return (
                <div key={l} className="flex items-center gap-2">
                  <span
                    className="w-14 shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-bold"
                    style={self
                      ? { background: a.tint, color: a.accent }
                      : { background: '#F3F4F6', color: '#9CA3AF' }}
                  >
                    {l.toUpperCase()}
                  </span>
                  {self ? (
                    <span className="text-[11px] text-gray-500">{LOCALE_LABEL[l]} — dieser Beitrag</span>
                  ) : sib ? (
                    <a href={`/de/admin/blog/${sib.id}`} className="text-[11px] font-semibold hover:underline" style={{ color: a.accent }}>
                      {LOCALE_LABEL[l]} öffnen ({sib.status === 'published' ? 'veröffentlicht' : 'Entwurf'})
                    </a>
                  ) : post.locale === 'de' ? (
                    <button
                      onClick={() => translate(l)} disabled={busy === `t-${l}` || !post.content.trim()}
                      className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                    >
                      {busy === `t-${l}` ? 'übersetzt…' : `nach ${LOCALE_LABEL[l]} übersetzen`}
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </div>
              )
            })}
          </div>
          {post.locale !== 'de' && (
            <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
              Übersetzungen werden vom deutschen Original aus angelegt.
            </p>
          )}

          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Autor</div>
          <div className="mt-1.5 flex gap-1.5">
            {AUTHOR_LIST.map((au) => (
              <button
                key={au.slug} onClick={() => set('author_slug', au.slug)}
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold"
                style={post.author_slug === au.slug
                  ? { borderColor: au.accent, background: au.tint, color: au.accent }
                  : { borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                {au.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={post.comments_open} onChange={(e) => set('comments_open', e.target.checked)} />
            Kommentare offen
          </label>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Titelbild</div>
          {post.hero_image ? (
            <div className="group relative mt-2 overflow-hidden rounded-lg">
              <img src={post.hero_image} alt="" className="h-32 w-full object-cover" />
              <button
                onClick={() => { set('hero_image', null); set('hero_alt', null) }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              Keines gesetzt — auf Knopfdruck entsteht eines im Bildstil von {a.name.split(' ')[0]}.
            </p>
          )}
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={makeImage} disabled={busy === 'bild' || !post.title}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === 'bild' ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />} Erzeugen
            </button>
            <button
              onClick={() => imgRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Upload size={12} />
            </button>
            <input
              ref={imgRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
          </div>
          <input
            value={post.hero_alt ?? ''} onChange={(e) => set('hero_alt', e.target.value)}
            placeholder="Alternativtext — beschreibt, was zu sehen ist"
            className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schlagworte</span>
            <button onClick={() => help('schlagworte')} className="text-[11px] font-semibold" style={{ color: a.accent }}>
              {busy === 'schlagworte' ? '…' : 'vorschlagen'}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: a.tint, color: a.accent }}>
                {t}
                <button onClick={() => set('tags', post.tags.filter((x) => x !== t))}><X size={10} /></button>
              </span>
            ))}
          </div>
          <input
            placeholder="Hinzufügen und Enter"
            onKeyDown={(e) => {
              const el = e.target as HTMLInputElement
              const v = el.value.trim()
              if (e.key === 'Enter' && v) {
                if (!post.tags.includes(v)) set('tags', [...post.tags, v])
                el.value = ''
              }
            }}
            className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
          />
          {knownTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {knownTags.filter((t) => !post.tags.includes(t)).slice(0, 10).map((t) => (
                <button
                  key={t} onClick={() => set('tags', [...post.tags, t])}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200"
                >
                  + {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Helfer</div>
          <p className="mt-1 text-[11px] leading-snug text-gray-400">
            Sie schreiben nichts in den Text. Sie legen den Vorschlag daneben.
          </p>
          <div className="mt-2.5 space-y-1.5">
            {[
              { k: 'kuerzen', label: 'Kürzen', icon: Scissors },
              { k: 'auszug', label: 'Auszug schreiben', icon: Wand2 },
              { k: 'untertitel', label: 'Untertitel vorschlagen', icon: Tags },
              { k: 'voice', label: 'Voice-Check', icon: Check },
            ].map(({ k, label, icon: Icon }) => (
              <button
                key={k} onClick={() => help(k)} disabled={busy === k || !post.content.trim()}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busy === k ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />} {label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function AssistPanel({
  panel, post, set, onClose,
}: {
  panel: { kind: string; data: Record<string, unknown> }
  post: EditorPost
  set: <K extends keyof EditorPost>(k: K, v: EditorPost[K]) => void
  onClose: () => void
}) {
  const d = panel.data as Record<string, any>
  const a = AUTHORS[post.author_slug]
  return (
    <div className="rounded-xl border-2 bg-white p-4" style={{ borderColor: a.accent }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.accent }}>
          Vorschlag · {panel.kind}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
      </div>

      {panel.kind === 'kuerzen' && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">{d.was_weg}</p>
          <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-mono text-[12px] leading-relaxed">{d.gekuerzt}</pre>
          <button
            onClick={() => { set('content', String(d.gekuerzt)); onClose() }}
            className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: a.accent }}
          >
            Übernehmen
          </button>
        </div>
      )}

      {(panel.kind === 'auszug' || panel.kind === 'untertitel') && (
        <ul className="mt-3 space-y-2">
          {(d.vorschlaege ?? []).map((v: any, i: number) => {
            const text = typeof v === 'string' ? v : v.text
            return (
              <li key={i} className="rounded-lg bg-gray-50 p-3">
                <p className="text-[13px] leading-relaxed text-gray-700">{text}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {typeof v !== 'string' && v.ansatz && <span className="text-[10px] text-gray-400">{v.ansatz}</span>}
                  <button
                    onClick={() => { set(panel.kind === 'auszug' ? 'excerpt' : 'subtitle', text); onClose() }}
                    className="ml-auto text-[11px] font-bold" style={{ color: a.accent }}
                  >
                    übernehmen
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {panel.kind === 'schlagworte' && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(d.schlagworte ?? []).map((t: string) => (
            <button
              key={t} onClick={() => !post.tags.includes(t) && set('tags', [...post.tags, t])}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: a.tint, color: a.accent }}
            >
              + {t}
            </button>
          ))}
        </div>
      )}

      {panel.kind === 'voice' && (
        <div className="mt-3">
          <div className="text-sm font-bold text-gray-900">{d.verdict}</div>
          {d.ansprache && <div className="text-xs text-gray-500">Ansprache: {d.ansprache}</div>}
          <ul className="mt-3 space-y-2">
            {(d.findings ?? []).map((f: any, i: number) => (
              <li key={i} className="rounded-lg bg-amber-50 p-3">
                <div className="text-[12px] italic text-gray-600">{f.quote}</div>
                <div className="mt-1 text-[12px] text-amber-800">{f.was}</div>
                <div className="mt-1 text-[12px] font-semibold text-gray-900">{f.vorschlag}</div>
              </li>
            ))}
          </ul>
          {(d.traegt ?? []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {d.traegt.map((t: string, i: number) => (
                <li key={i} className="text-[12px] text-emerald-700">{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
