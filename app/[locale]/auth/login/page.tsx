'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError(t('error'))
      return
    }

    // Role-based redirect: admins + coaches → backend, participants → portal
    try {
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role: string | undefined = session?.user?.role
      if (role === 'admin' || role === 'coach') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={140} height={36} className="h-9 w-auto" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-ink" style={{ color: '#0D0D0B' }}>{t('loginTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('loginSubtext')}</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange focus:ring-2"
                style={{ '--tw-ring-color': '#F05A1A30' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">{t('password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange focus:ring-2"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#F05A1A' }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {t('submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
