import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export function FrontRowLaunchSection() {
  return (
    <section className="px-6 py-16 bg-white">
      <div className="mx-auto max-w-5xl">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-12 sm:px-14 sm:py-16"
          style={{
            backgroundColor: '#F5E8C8',
            border: '1px solid rgba(15,30,58,0.08)',
          }}
        >
          {/* Subtle decorative book stamp on the right */}
          <div
            className="absolute -right-8 -top-8 hidden sm:flex h-40 w-40 items-center justify-center rounded-full opacity-15"
            style={{ backgroundColor: '#0F1E3A' }}
            aria-hidden="true"
          >
            <BookOpen size={64} style={{ color: '#F5E8C8' }} />
          </div>

          <div className="relative">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: '#0F1E3A', color: '#F5E8C8' }}
            >
              Buch im Bau · Front Row offen
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl leading-tight max-w-2xl" style={{ color: '#0F1E3A' }}>
              Instant Influence.<br />
              Hilf mir, das Buch zu bauen, das B2B-Sales 2026 wirklich braucht.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(15,30,58,0.75)' }}>
              Frühe Kapitel-Drafts in deine Inbox, ein direkter Draht zu Markus, dein Name auf den
              Danksagungs-Seiten, ein signiertes Exemplar zum Launch. Eine Frage pro Kapitel — wenn
              du eine hast.
            </p>
            <Link
              href="/salesmade/frontrow"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F1E3A' }}
            >
              Platz nehmen <ArrowRight size={14} />
            </Link>
            <p className="mt-3 text-xs italic" style={{ color: 'rgba(15,30,58,0.55)' }}>
              „Ich starte keinen Launch. Ich starte einen Build."
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
