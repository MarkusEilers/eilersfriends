import { Twitter } from 'lucide-react'

interface Tweet {
  handle: string
  name?: string
  body: string
  date?: string
  source?: 'twitter' | 'linkedin' | 'mastodon' | string
}

export function LpTweetWall({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const tweets: Tweet[] = Array.isArray(content.tweets) ? content.tweets : []
  // Kundenstimmen im Format { text, author, context } (Framework-Vorlage)
  const quotes: { text: string; author?: string; context?: string }[] = Array.isArray(content.quotes) ? content.quotes : []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        {content.eyebrow && (
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {content.eyebrow as string}
            </span>
          </div>
        )}
        {content.headline && (
          <h2 className="text-center text-3xl font-bold sm:text-4xl mb-3" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.subheadline && (
          <p className="mx-auto max-w-2xl text-center text-base text-gray-600 mb-12">
            {content.subheadline as string}
          </p>
        )}

        {quotes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {quotes.map((q, i) => (
              <figure key={i} className="rounded-2xl border bg-white" style={{ margin: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <blockquote className="hand" style={{ margin: 0, fontSize: 26, lineHeight: 1.15, color: '#124293' }}>„{q.text}“</blockquote>
                <figcaption style={{ marginTop: 'auto', fontSize: 14, lineHeight: 1.45, color: '#3A3633' }}>
                  {q.author && <b style={{ display: 'block', fontWeight: 600 }}>{q.author}</b>}
                  {q.context && <span style={{ color: '#7A746E' }}>{q.context}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Masonry-style columns */}
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {tweets.map((t, i) => (
            <figure
              key={i}
              className="mb-6 break-inside-avoid rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold uppercase"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {(t.name || t.handle).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {t.name && (
                    <p className="text-sm font-bold truncate" style={{ color: '#0D0D0B' }}>{t.name}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate">{t.handle}</p>
                </div>
                <Twitter size={14} className="text-gray-300 flex-shrink-0" />
              </div>
              <blockquote className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {t.body}
              </blockquote>
              {t.date && (
                <p className="mt-3 text-xs text-gray-400">{t.date}</p>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
