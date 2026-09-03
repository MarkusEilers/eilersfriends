'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { Mail, Calendar, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import type { Author } from '@/lib/blog/authors'

/**
 * Die Box am Fuss.
 *
 * Zwei Wege nebeneinander, mit Absicht unterschiedlich schwer: links der leichte
 * — eine Adresse hinterlassen und donnerstags lesen. Rechts der schwere — sich
 * eine halbe Stunde mit einem Menschen hinsetzen. Wer nur den schweren anbietet,
 * verliert alle, die noch nicht so weit sind; wer nur den leichten anbietet,
 * sammelt Adressen und fuehrt keine Gespraeche.
 */
export function BlogCta({ author }: { author: Author }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: `blog:${author.slug}` }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch { setState('error') }
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl px-6">
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{ borderColor: `${author.accent}22`, background: author.tint }}
      >
        <div className="grid gap-px sm:grid-cols-2" style={{ background: `${author.accent}18` }}>
          {/* Newsletter */}
          <div className="p-8 sm:p-10" style={{ background: author.tint }}>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: '#fff', color: author.accent }}
            >
              <Mail size={18} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Donnerstags eine Lehre aus der Woche
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kein Newsletter über Neuigkeiten. Eine Sache, die {author.name.split(' ')[0]} diese Woche
              gelernt hat — und woran sie sich gezeigt hat.
            </p>

            {state === 'done' ? (
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold" style={{ color: author.accent }}>
                <CheckCircle2 size={16} /> Prüf bitte Dein Postfach — dort liegt die Bestätigung.
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 flex gap-2">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@firma.de"
                  className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                />
                <button
                  type="submit" disabled={state === 'loading'}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: author.accent }}
                >
                  {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Eintragen
                </button>
              </form>
            )}
            {state === 'error' && (
              <p className="mt-2 text-xs text-red-600">Das hat nicht geklappt. Versuch es bitte noch einmal.</p>
            )}
          </div>

          {/* Termin */}
          <div className="p-8 sm:p-10" style={{ background: '#fff' }}>
            <div className="flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image src={author.avatar} alt={author.name} fill sizes="48px" className="object-cover" />
              </span>
              <div>
                <div className="text-sm font-bold text-gray-900">{author.name}</div>
                <div className="text-xs text-gray-500">{author.role}</div>
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Oder wir reden eine halbe Stunde darüber
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kein Verkaufsgespräch mit Agenda. Du bringst die Situation mit, wir schauen sie uns gemeinsam an.
            </p>
            <Link
              href={author.booking as '/'}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: author.deep }}
            >
              <Calendar size={14} /> Termin mit {author.name.split(' ')[0]}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
