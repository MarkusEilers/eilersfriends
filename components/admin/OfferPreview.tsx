'use client'

import { Rocket, Users, Gift, MessageCircle, Target, TrendingUp, Shield, Zap, Star, Compass } from 'lucide-react'
import type { OfferEditorState } from './OfferEditor'

const ICONS = { target: Target, users: Users, 'trending-up': TrendingUp, shield: Shield, zap: Zap, star: Star } as const

export function OfferPreview({ s }: { s: OfferEditorState }) {
  const empathyStatement = s.empathy.statement?.trim() || 'Hier steht Ihr Empathie-Statement, das zeigt, dass Sie die Herausforderungen Ihrer Kunden verstehen.'
  const goals = (s.understanding.goals ?? []).filter(Boolean)
  const challenges = (s.understanding.challenges ?? []).filter(Boolean)
  const previewGoals = goals.length ? goals : ['Ziel 1', 'Ziel 2', 'Ziel 3']
  const previewChallenges = challenges.length ? challenges : ['Herausforderung 1', 'Herausforderung 2', 'Herausforderung 3']

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 px-8 pt-10 pb-12 text-center" style={{ backgroundColor: '#F9FAFB' }}>
        <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#1A5FD4' }}>
          Angebot · Vorschau
        </p>
        <h1 className="mt-5 text-3xl font-bold leading-tight" style={{ color: '#0D0D0B' }}>
          {s.title || 'Ihr Angebots-Titel'}
        </h1>
        {s.subtitle && (
          <p className="mt-2 text-base text-gray-600">{s.subtitle}</p>
        )}
        {!s.subtitle && <p className="mt-2 text-base text-gray-400">Untertitel des Angebots</p>}
        {s.tagline && (
          <p className="mt-4 text-lg font-semibold" style={{ color: '#1A5FD4' }}>{s.tagline}</p>
        )}
        {!s.tagline && (
          <p className="mt-4 text-lg font-semibold" style={{ color: '#1A5FD4' }}>Ihr Weg zu mehr Kunden</p>
        )}
      </section>

      {/* Understanding */}
      <section className="px-8 py-10">
        <h2 className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>
          {s.understanding.title || 'So haben wir Euch verstanden'}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: '#1A5FD4' }}>
              <Target size={16} /> Eure Ziele
            </h3>
            <ul className="mt-3 space-y-2">
              {previewGoals.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: '#1A5FD4' }} />
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: '#0F1E3A' }}>
              <Compass size={16} /> Eure Herausforderungen
            </h3>
            <ul className="mt-3 space-y-2">
              {previewChallenges.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: '#0F1E3A' }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Eine neue Ära */}
      <section className="px-8 py-12 text-center" style={{ backgroundColor: '#F0F5FF' }}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#DBE6FF', color: '#1A5FD4' }}>
          <Rocket size={22} />
        </div>
        <h2 className="mt-5 text-2xl font-bold" style={{ color: '#0D0D0B' }}>
          Eine neue Ära der Überzeugungsarbeit
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
          {s.empathy.successMessage || 'Besonders Vertrieb und der Umgang mit Kunden ist ein Trust- und Networking-Game. Erfolgreiche Teams nutzen das und fordern den Status Quo ihrer Branche intelligent heraus.'}
        </p>
      </section>

      {/* Unsere Perspektive */}
      <section className="px-8 py-10">
        <h2 className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>Unsere Perspektive</h2>
        <blockquote className="mt-4 border-l-4 pl-5 italic text-gray-600" style={{ borderColor: '#1A5FD4' }}>
          {empathyStatement}
        </blockquote>
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: '#1A5FD4' }}>
          <Users size={14} /> Andere haben genau diese Herausforderungen erfolgreich gelöst.
        </p>
      </section>

      {/* 3 Zutaten */}
      <section className="px-8 py-10" style={{ backgroundColor: '#FAFAF8' }}>
        <h2 className="text-center text-2xl font-bold" style={{ color: '#0D0D0B' }}>
          Wirksame Überzeugungsarbeit braucht nur 3 Zutaten
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Users,         title: 'Ideale Kunden',          body: 'Wissen, mit wem ein Gespräch lohnt — Ziele, Sorgen, Entscheidungskriterien.' },
            { icon: Gift,          title: 'Unwiderstehliches Angebot', body: 'Mehr als Features und Preis — eine Story, die einlädt.' },
            { icon: MessageCircle, title: 'Systematische Ansprache', body: 'Relevanz, Vertrauen und Begleitung zur Commitment-Entscheidung.' },
          ].map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF', color: i === 2 ? '#F05A1A' : '#1A5FD4' }}>
                  <Icon size={16} />
                </div>
                <div className="mt-3 text-2xl font-bold" style={{ color: '#1A5FD4' }}>{i + 1}</div>
                <h4 className="mt-2 text-sm font-bold" style={{ color: '#0D0D0B' }}>{c.title}</h4>
                <p className="mt-1 text-xs text-gray-500">{c.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Programm & Timeline */}
      {s.programs.length > 0 && (
        <section className="px-8 py-10">
          <h2 className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>Ihr Programm & Timeline</h2>
          <p className="mt-1 text-sm text-gray-500">Die integrierte Timeline mit allen Phasen.</p>
          <div className="mt-5 space-y-3">
            {(s.programs[0]?.pricing ?? []).slice(0, 3).map((p, i) => {
              const colors = ['#0E9DDD', '#0F1E3A', '#F05A1A']
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: colors[i] ?? '#1A5FD4' }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold" style={{ color: '#0D0D0B' }}>Phase {i + 1}: {p.title || 'Phase'}</h4>
                    <p className="text-xs text-gray-500 truncate">{p.description || 'Beschreibung der Phase'}</p>
                  </div>
                </div>
              )
            })}
            {(!s.programs[0]?.pricing || s.programs[0].pricing.length === 0) && (
              <>
                {['Alignment', 'Soft Launch', 'Launch'].map((label, i) => {
                  const colors = ['#0E9DDD', '#0F1E3A', '#F05A1A']
                  return (
                    <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: colors[i] }}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: '#0D0D0B' }}>Phase {i + 1}: {label}</h4>
                        <p className="text-xs text-gray-500">Beschreibung der Phase</p>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </section>
      )}

      {/* Ökonomische Ergebnisse */}
      <section className="px-8 py-10 text-center" style={{ backgroundColor: '#FAFAF8' }}>
        <h2 className="text-3xl font-bold" style={{ color: '#0D0D0B' }}>
          Ökonomische <span style={{ color: '#1A5FD4' }}>Ergebnisse</span>
        </h2>
        <p className="mt-2 text-sm text-gray-500">Die messbaren Ziele, die wir gemeinsam erreichen wollen</p>
        <div className="mx-auto mt-6 grid gap-4 md:grid-cols-3">
          {(s.economic.length ? s.economic : [
            { icon: 'target', title: 'Outcome 1', description: 'Was wir messen' },
            { icon: 'users', title: 'Outcome 2', description: 'Was wir messen' },
            { icon: 'trending-up', title: 'Outcome 3', description: 'Was wir messen' },
          ]).slice(0, 6).map((e, i) => {
            const Icon = (ICONS[(e.icon ?? 'target') as keyof typeof ICONS]) ?? Target
            return (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                  <Icon size={16} />
                </div>
                <h4 className="mt-3 text-base font-bold" style={{ color: '#0D0D0B' }}>{e.title || `Outcome ${i + 1}`}</h4>
                {e.description && <p className="mt-1 text-xs text-gray-500">{e.description}</p>}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
