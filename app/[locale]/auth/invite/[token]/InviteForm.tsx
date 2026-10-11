'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { acceptInviteAction } from '@/lib/actions/invite'

const T = {
  de: {
    hello: (n: string) => `Willkommen${n ? ', ' + n : ''}`, sub: 'Setz Dein Passwort — danach landest Du direkt im Programm Guide.',
    pw: 'Passwort (mindestens 8 Zeichen)', pw2: 'Passwort wiederholen', go: 'Passwort setzen und loslegen',
    mismatch: 'Die Passwörter stimmen nicht überein.', short: 'Mindestens 8 Zeichen, bitte.',
    invalid: 'Dieser Link ist ungültig.', used: 'Dieser Link wurde schon benutzt. Melde Dich einfach an.', expired: 'Dieser Link ist abgelaufen. Frag Markus nach einem neuen.', login: 'Zur Anmeldung',
  },
  en: {
    hello: (n: string) => `Welcome${n ? ', ' + n : ''}`, sub: 'Set your password — you will land straight in the Program Guide.',
    pw: 'Password (at least 8 characters)', pw2: 'Repeat password', go: 'Set password and start',
    mismatch: 'The passwords do not match.', short: 'At least 8 characters, please.',
    invalid: 'This link is not valid.', used: 'This link has already been used. Just sign in.', expired: 'This link has expired. Ask Markus for a new one.', login: 'Go to sign in',
  },
}

export function InviteForm({ token, state, firstName, email, lang }: { token: string; state: 'ok' | 'invalid' | 'used' | 'expired'; firstName: string; email: string; lang: 'de' | 'en' }) {
  const t = T[lang]
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setErr(t.short)
    if (pw !== pw2) return setErr(t.mismatch)
    setBusy(true); setErr('')
    const r = await acceptInviteAction(token, pw)
    if (!r.ok) { setBusy(false); return setErr(t[r.error as 'invalid' | 'used' | 'expired'] ?? t.invalid) }
    try { localStorage.setItem('ef-login-firstname', firstName) } catch { /* egal */ }
    await signIn('credentials', { email: r.email, password: pw, redirect: false })
    router.push('/dashboard/guide')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1E3A] px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/login/dolomiten-morgen.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex justify-center"><Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-12 w-auto object-contain" priority /></div>
        {state !== 'ok' ? (
          <>
            <p className="text-sm text-gray-700">{t[state]}</p>
            <a href="/auth/login" className="mt-4 inline-block text-sm font-semibold text-blue-700">{t.login} →</a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">{t.hello(firstName)}</h1>
            <p className="mt-1 text-sm text-gray-600">{t.sub}</p>
            <p className="mt-3 text-xs text-gray-500">{email}</p>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              <input type="password" autoComplete="new-password" placeholder={t.pw} value={pw} onChange={(e) => setPw(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm" />
              <input type="password" autoComplete="new-password" placeholder={t.pw2} value={pw2} onChange={(e) => setPw2(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm" />
              {err && <p className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600">{err}</p>}
              <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#1A5FD4' }}>
                {busy && <Loader2 size={15} className="animate-spin" />}{t.go}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
