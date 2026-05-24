'use client'

import { useState, useEffect } from 'react'
import { Loader2, ArrowRight, Building2, Sparkles, CheckCircle2, Pencil, Globe } from 'lucide-react'

interface Profile {
  organisationName?: string
  website?: string
  summary?: string
  valueProposition?: string
  targetAudience?: string
  tone?: string
  keywords?: string[]
  brandColor?: string
  accentColor?: string
}

interface Props {
  onCompleted?: () => void
}

const ORANGE = '#F05A1A'

export function WelcomeStep({ onCompleted }: Props) {
  const [profile, setProfile] = useState<Profile>({})
  const [loaded, setLoaded] = useState(false)
  const [url, setUrl] = useState('')
  const [orgName, setOrgName] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [analysed, setAnalysed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load existing profile
  useEffect(() => {
    fetch('/api/wizard/company').then((r) => r.json()).then((data) => {
      if (data?.profile) {
        const p = data.profile as Record<string, unknown>
        const loaded: Profile = {
          organisationName: (p.organisation_name as string) ?? undefined,
          website: (p.website as string) ?? undefined,
          summary: (p.summary as string) ?? undefined,
          valueProposition: (p.value_proposition as string) ?? undefined,
          targetAudience: (p.target_audience as string) ?? undefined,
          tone: (p.tone as string) ?? undefined,
          keywords: (p.keywords as string[]) ?? [],
          brandColor: (p.brand_color as string) ?? undefined,
          accentColor: (p.accent_color as string) ?? undefined,
        }
        setProfile(loaded)
        setUrl(loaded.website ?? '')
        setOrgName(loaded.organisationName ?? '')
        if (loaded.summary) setAnalysed(true)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function analyse() {
    if (!url.trim()) { setError('Bitte gib die URL Deiner Website ein.'); return }
    setAnalysing(true); setError(null)
    try {
      const res = await fetch('/api/wizard/company/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, organisationName: orgName }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) { setError(data.error || 'Analyse fehlgeschlagen'); setAnalysing(false); return }
      const r = data.result as Profile
      setProfile({ ...r, website: data.url ?? url })
      if (r.organisationName) setOrgName(r.organisationName)
      setAnalysed(true)
    } catch (e) { setError(String(e)) }
    finally { setAnalysing(false) }
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const payload = {
        organisationName: orgName,
        website: url,
        summary: profile.summary,
        valueProposition: profile.valueProposition,
        targetAudience: profile.targetAudience,
        tone: profile.tone,
        keywords: profile.keywords,
        brandColor: profile.brandColor,
        accentColor: profile.accentColor,
      }
      const res = await fetch('/api/wizard/company/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Save fehlgeschlagen')
        setSaving(false); return
      }
      setEditing(false)
      if (onCompleted) onCompleted()
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  function set<K extends keyof Profile>(k: K, v: Profile[K]) { setProfile((p) => ({ ...p, [k]: v })) }

  if (!loaded) return <div className="py-12 text-center text-sm text-gray-400"><Loader2 size={18} className="animate-spin inline mr-2" /> Lade…</div>

  const isDone = analysed && !editing && profile.summary

  // ─── DONE state — compact summary ───────────────────────────────
  if (isDone) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800">
            <CheckCircle2 size={12} /> Done
          </span>
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: ORANGE }}>
            <Pencil size={11} /> Review & Edit
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Organisation</p>
            <p className="mt-1 text-sm text-gray-900">{profile.organisationName ?? orgName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Website</p>
            <p className="mt-1 text-sm text-gray-900 break-words">{profile.website ?? url}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Summary</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-800">{profile.summary}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Value Proposition</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-800">{profile.valueProposition}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Target Audience</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-800">{profile.targetAudience}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>Tone</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-800">{profile.tone}</p>
          </div>
        </div>

        {profile.keywords && profile.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {profile.keywords.map((k) => (
              <span key={k} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#FFF1EB', color: ORANGE }}>{k}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── ACTIVE state — journalistic intro + form + analyse + edit ───
  return (
    <div className="space-y-8">
      {/* Journalistic intro */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#FFF1EB' }}>
          <Building2 size={18} style={{ color: ORANGE }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lass uns Dein Unternehmen verstehen</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 max-w-2xl">
            Wenn Du magst, kann ich ein paar Informationen recherchieren, die wir brauchen — dann musst Du
            weniger eintippen. Gib mir die URL Eurer Website, und ich waerme den AI-Kontext fuer den Rest
            Deiner GTM-Strategie auf.
          </p>
        </div>
      </div>

      {/* Form: name + URL + button */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organisations-Name</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
            placeholder="z.B. Eilers+Friends"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website URL</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="eilersfriends.com"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-3 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
        </div>
        <div>
          <button onClick={analyse} disabled={analysing || !url.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {analysing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {analysing ? 'Analysiere…' : analysed ? 'Erneut analysieren' : 'Analyze & Continue'}
          </button>
          {error && <span className="ml-3 text-xs text-red-600">{error}</span>}
        </div>
      </div>

      {/* Analysis Result — only after analyze */}
      {analysed && (
        <div className="space-y-5 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ORANGE }} />
            <h3 className="text-base font-bold" style={{ color: ORANGE }}>Website Analysis Complete</h3>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Pencil size={11} /> Du kannst jedes Feld unten korrigieren.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Summary</label>
              <textarea value={profile.summary ?? ''} onChange={(e) => set('summary', e.target.value)}
                rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Value Proposition</label>
              <textarea value={profile.valueProposition ?? ''} onChange={(e) => set('valueProposition', e.target.value)}
                rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Target Audience</label>
              <textarea value={profile.targetAudience ?? ''} onChange={(e) => set('targetAudience', e.target.value)}
                rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Tone</label>
              <textarea value={profile.tone ?? ''} onChange={(e) => set('tone', e.target.value)}
                rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Keywords</label>
            <input
              value={(profile.keywords ?? []).join(', ')}
              onChange={(e) => set('keywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-400 focus:outline-none" />
            <p className="mt-1 text-[10px] text-gray-400">Comma-separated</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorRow label="Brand Color (Primary)" value={profile.brandColor ?? '#1A5FD4'} onChange={(v) => set('brandColor', v)} />
            <ColorRow label="Contrast / Accent" value={profile.accentColor ?? '#F05A1A'} onChange={(v) => set('accentColor', v)} />
          </div>

          <p className="text-[11px] italic text-gray-400">
            Werden automatisch an Bild-Prompts und KI-Vorschlaege angehaengt.
          </p>

          <div className="flex justify-end pt-2">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {saving ? 'Speichere…' : 'Continue to Next Section'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative h-10 w-12 flex-shrink-0">
          <div className="h-10 w-12 rounded-lg border border-gray-200" style={{ backgroundColor: safe }} aria-hidden />
          <input type="color" value={safe} onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </div>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono focus:outline-none" />
      </div>
    </div>
  )
}
