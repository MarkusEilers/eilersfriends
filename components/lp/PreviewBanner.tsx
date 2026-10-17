/** Hinweis über einer noch nicht veröffentlichten Seite — nur Eilers+Friends sieht ihn. */
export function PreviewBanner({ status, editHref }: { status: string; editHref?: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-xs font-semibold text-amber-950">
      <span>VORSCHAU · Status „{status}“ — diese Seite ist öffentlich noch nicht sichtbar.</span>
      {editHref && <a href={editHref} className="underline">Bearbeiten</a>}
    </div>
  )
}
