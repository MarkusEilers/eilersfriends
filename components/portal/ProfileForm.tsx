'use client'

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, Loader2 } from 'lucide-react'
import { saveProfileAction } from '@/lib/actions/member'

const line = '#E6E3E1', muted = '#605D5D'
const input = 'w-full rounded-xl border bg-white px-4 py-3 text-[15px] outline-none transition-shadow focus:border-[#1A5FD4] focus:shadow-[0_0_0_4px_rgba(26,95,212,.12)]'

export function ProfileForm({ initial, readOnly }: {
  initial: { name: string; initials: string; avatarUrl: string | null; headline: string; linkedin: string; bio: string; phone: string; email: string; meta: string }
  readOnly: boolean
}) {
  const router = useRouter()
  const [avatar, setAvatar] = useState(initial.avatarUrl)
  const [upl, setUpl] = useState<'idle' | 'busy' | 'err'>('idle')
  const [uplErr, setUplErr] = useState('')
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(f: File) {
    setUpl('busy'); setUplErr('')
    const fd = new FormData(); fd.append('file', f)
    const r = await fetch('/api/member/avatar', { method: 'POST', body: fd })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.ok) { setUpl('err'); setUplErr(j.error || 'Upload fehlgeschlagen'); return }
    setAvatar(j.url); setUpl('idle'); router.refresh()
  }

  return (
    <form action={(fd) => start(async () => { setErr(''); const r = await saveProfileAction(fd); if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); router.refresh() } else setErr(r.error || 'Speichern fehlgeschlagen') })}
      className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <button type="button" disabled={readOnly || upl === 'busy'} onClick={() => fileRef.current?.click()} className="group relative h-24 w-24 flex-none overflow-hidden rounded-full" aria-label="Foto ändern">
          {avatar ? <img src={avatar} alt={initial.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-[#C9D8F5] text-[30px] font-bold text-[#124293]">{initial.initials}</span>}
          {!readOnly && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">{upl === 'busy' ? <Loader2 className="animate-spin" /> : <Camera />}</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
        <div className="min-w-0">
          <p className="m-0 text-[22px] font-bold tracking-[-.01em]">{initial.name}</p>
          <p className="m-0 mt-0.5 text-[14px]" style={{ color: muted }}>{initial.meta}</p>
          {!readOnly && <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 rounded-full border bg-white px-3.5 py-1.5 text-[13px] font-semibold" style={{ borderColor: line }}>{avatar ? 'Foto ändern' : 'Foto hochladen'}</button>}
          {upl === 'err' && <p className="m-0 mt-1.5 text-[13px] text-[#B0001F]">{uplErr}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Name<input name="name" defaultValue={initial.name} required disabled={readOnly} className={input} style={{ borderColor: line }} /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Rolle in einem Satz<input name="headline" defaultValue={initial.headline} placeholder="z. B. Account Executive, Fokus Logistik" disabled={readOnly} className={input} style={{ borderColor: line }} /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">LinkedIn<input name="linkedin" defaultValue={initial.linkedin} placeholder="linkedin.com/in/…" disabled={readOnly} className={input} style={{ borderColor: line }} /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Mobil <span className="font-normal" style={{ color: muted }}>nur für Eilers+Friends sichtbar</span><input name="phone" type="tel" defaultValue={initial.phone} disabled={readOnly} className={input} style={{ borderColor: line }} /></label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold sm:col-span-2">Über Dich <span className="font-normal" style={{ color: muted }}>sehen andere Mitglieder in der Community</span><textarea name="bio" rows={4} defaultValue={initial.bio} placeholder="Was verkaufst Du, an wen, und woran arbeitest Du gerade?" disabled={readOnly} className={input} style={{ borderColor: line }} /></label>
      </div>
      <p className="m-0 text-[13px]" style={{ color: muted }}>E-Mail: {initial.email} · ändern wir auf Zuruf, damit Dein Zugang erhalten bleibt.</p>
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-5 py-3 text-[15px] font-bold text-white disabled:opacity-60">{pending ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}{saved ? 'Gespeichert' : 'Speichern'}</button>
          {err && <span className="text-[14px] text-[#B0001F]">{err}</span>}
        </div>
      )}
      {readOnly && <p className="m-0 rounded-xl bg-[#FFF8E6] px-4 py-3 text-[14px] text-[#7A5600]">Vorschau „Ansehen als“: Profile anderer Personen lassen sich hier nicht ändern.</p>}
    </form>
  )
}
