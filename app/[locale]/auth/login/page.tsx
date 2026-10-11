'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

/**
 * Login mit Tageszeit.
 *
 * Gruß und Hintergrund richten sich nach der Uhr des Besuchers, nicht nach
 * dem Server — wer um 22 Uhr in Singapur sitzt, bekommt Nacht, auch wenn in
 * Stuttgart gerade Nachmittag ist. Deshalb wird beides erst im Browser
 * gewählt (useEffect); der Server rendert neutral, damit nichts flackert.
 *
 * Den Vornamen merkt sich der Browser nach einem erfolgreichen Login. Nur der
 * Vorname, nur lokal — beim nächsten Besuch heißt es dann „Moin, Marvin".
 */

type Slot = 'morgen' | 'tag' | 'abend' | 'nacht'
type Greet = 'morning' | 'lateMorning' | 'noon' | 'afternoon' | 'evening' | 'night'

// Zehn Orte, je in vier Lichtstimmungen (public/login/<key>-<slot>.webp).
const SPOTS: { key: string; name: Record<string, string> }[] = [
  { key: 'lofoten',    name: { de: 'Lofoten, Norwegen', en: 'Lofoten, Norway', es: 'Lofoten, Noruega' } },
  { key: 'moraine',    name: { de: 'Moraine Lake, Kanada', en: 'Moraine Lake, Canada', es: 'Lago Moraine, Canadá' } },
  { key: 'kyoto',      name: { de: 'Kyoto, Japan', en: 'Kyoto, Japan', es: 'Kioto, Japón' } },
  { key: 'santorini',  name: { de: 'Santorini, Griechenland', en: 'Santorini, Greece', es: 'Santorini, Grecia' } },
  { key: 'patagonien', name: { de: 'Torres del Paine, Chile', en: 'Torres del Paine, Chile', es: 'Torres del Paine, Chile' } },
  { key: 'dolomiten',  name: { de: 'Dolomiten, Italien', en: 'Dolomites, Italy', es: 'Dolomitas, Italia' } },
  { key: 'borabora',   name: { de: 'Bora Bora, Französisch-Polynesien', en: 'Bora Bora, French Polynesia', es: 'Bora Bora, Polinesia Francesa' } },
  { key: 'sahara',     name: { de: 'Erg Chebbi, Marokko', en: 'Erg Chebbi, Morocco', es: 'Erg Chebbi, Marruecos' } },
  { key: 'island',     name: { de: 'Kirkjufell, Island', en: 'Kirkjufell, Iceland', es: 'Kirkjufell, Islandia' } },
  { key: 'halong',     name: { de: 'Halong-Bucht, Vietnam', en: 'Ha Long Bay, Vietnam', es: 'Bahía de Ha Long, Vietnam' } },
]

function slotFor(h: number): Slot {
  if (h >= 5 && h < 11) return 'morgen'
  if (h >= 11 && h < 17) return 'tag'
  if (h >= 17 && h < 21) return 'abend'
  return 'nacht'
}
function greetFor(h: number): Greet {
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 12) return 'lateMorning'
  if (h >= 12 && h < 14) return 'noon'
  if (h >= 14 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

const NAME_KEY = 'ef-login-firstname'

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [mood, setMood] = useState<{ slot: Slot; greet: Greet; spot: (typeof SPOTS)[number] } | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [bgReady, setBgReady] = useState(false)

  useEffect(() => {
    const h = new Date().getHours()
    setMood({ slot: slotFor(h), greet: greetFor(h), spot: SPOTS[Math.floor(Math.random() * SPOTS.length)] })
    try { setFirstName(localStorage.getItem(NAME_KEY)) } catch { /* privat-Modus */ }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)
    if (result?.error) {
      setError(t('error'))
      return
    }

    // Role-based redirect: admins + coaches → backend, participants → portal
    try {
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const first = typeof session?.user?.name === 'string' ? session.user.name.trim().split(/\s+/)[0] : ''
      try { if (first) localStorage.setItem(NAME_KEY, first) } catch { /* egal */ }
      const role: string | undefined = session?.user?.role
      router.push(role === 'admin' || role === 'coach' ? '/admin' : '/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  function forgetName() {
    try { localStorage.removeItem(NAME_KEY) } catch { /* egal */ }
    setFirstName(null)
  }

  const greeting = mood ? t(`greet.${mood.greet}`, { name: firstName ? `, ${firstName}` : '' }) : t('loginTitle')
  const bg = mood ? `/login/${mood.spot.key}-${mood.slot}.webp` : null
  const place = mood ? (mood.spot.name[locale] ?? mood.spot.name.en) : ''

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F1E3A] px-4">
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bg}
          alt=""
          aria-hidden
          onLoad={() => setBgReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${bgReady ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {/* leichter Schleier, damit Karte und Ortsangabe lesbar bleiben */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex justify-center">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-12 w-auto object-contain" priority />
          </div>

          <h1 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>{greeting}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('loginSubtext')}</p>
          {firstName && (
            <button type="button" onClick={forgetName} className="mt-1 text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline">
              {t('notYou', { name: firstName })}
            </button>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">{t('email')}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange focus:ring-2"
                style={{ '--tw-ring-color': '#1A5FD430' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">{t('password')}</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange focus:ring-2"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {t('submit')}
            </button>
          </form>
        </div>
      </div>

      {mood && (
        <p className={`absolute bottom-4 right-5 text-xs font-medium text-white/85 drop-shadow transition-opacity duration-1000 ${bgReady ? 'opacity-100' : 'opacity-0'}`}>
          {place} · {t(`slot.${mood.slot}`)}
        </p>
      )}
    </div>
  )
}
