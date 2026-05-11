/**
 * Der CEO-Innerer-Monolog — das, was Founders sich nachts denken.
 * Vier ⚑-Pain-Flags + ein hervorgehobener Quote.
 */
import { Flag } from 'lucide-react'

const PAINS = [
  'Du siehst, dass Gespräche nicht funktionieren — aber Du warst nicht dabei und weißt nicht genau warum.',
  'Du willst Dein Team entwickeln, aber Du kannst nicht selbst der Coach sein. Du hast zu viel anderes zu tun.',
  'Du hast schon Trainings gebucht. Einmal. Für einen Tag. Drei Wochen später war alles wieder vergessen.',
  'Du fragst Dich: Liegt es an den Menschen, der Methode — oder gibt es einfach keine gute Lösung?',
]

export function CeoMonologue() {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-5xl">
        {/* Quote */}
        <div className="mb-12 rounded-3xl p-10 text-center" style={{ backgroundColor: '#0F1E3A' }}>
          <div className="mx-auto max-w-3xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#93B8F5' }}>
              Was uns CEOs, Gründer:innen und Sales-Leader sagen
            </span>
            <p className="mt-5 font-serif text-2xl leading-relaxed text-white sm:text-3xl" style={{ fontFamily: '"DM Serif Display", serif' }}>
              „Ich weiß, dass mein Team besser sein muss.
              <br className="hidden sm:block" />
              Aber ich weiß nicht, was genau fehlt —{' '}
              <span style={{ color: '#93B8F5' }}>und noch weniger, wie ich es ihnen beibringen soll.</span>"
            </p>
            <div className="mt-6 text-xs uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              Immer wieder.
            </div>
          </div>
        </div>

        {/* Pains */}
        <div className="grid gap-4 md:grid-cols-2">
          {PAINS.map((p, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl bg-white p-5 border"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#FFEBEC', color: '#EB0028' }}
              >
                <Flag size={16} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                {p}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
