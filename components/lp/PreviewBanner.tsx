import { pageUrl } from '@/lib/lp/public-path'

/** Hinweis über einer noch nicht veröffentlichten Seite — nur Eilers+Friends sieht ihn. Mit Sprachwechsel, der in der Vorschau bleibt. */
export function PreviewBanner({ status, editHref, slug, templateKey, locale = 'de' }: { status: string; editHref?: string; slug?: string; templateKey?: string | null; locale?: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-xs font-semibold text-amber-950">
      <span>VORSCHAU · Status „{status}“ — diese Seite ist öffentlich noch nicht sichtbar.</span>
      {slug && (
        <span className="flex items-center gap-1">
          {['de', 'en', 'es'].map((l) => (
            <a key={l} href={pageUrl(slug, templateKey, status, l)}
              className={`rounded px-1.5 py-0.5 ${l === locale ? 'bg-amber-950 text-amber-300' : 'underline'}`}>{l.toUpperCase()}</a>
          ))}
        </span>
      )}
      {editHref && <a href={editHref} className="underline">Bearbeiten</a>}
    </div>
  )
}
