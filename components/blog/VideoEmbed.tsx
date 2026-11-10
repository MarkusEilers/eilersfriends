'use client'

import { useState } from 'react'

/**
 * YouTube-Video mit Vorschaltbild: Bis zum Klick wird nichts von YouTube geladen (DSGVO).
 * Danach läuft das Video über youtube-nocookie.com.
 */
export function VideoEmbed({ id, eyebrow, title, sub, image, playLabel = 'Video abspielen', note }: {
  id: string; eyebrow?: string; title?: string; sub?: string; image?: string; playLabel?: string; note?: string
}) {
  const [on, setOn] = useState(false)
  if (on) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`}
          title={title ?? 'Video'} className="absolute inset-0 h-full w-full" allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <button type="button" onClick={() => setOn(true)} aria-label={`${playLabel}: ${title ?? ''}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl text-left" style={{ background: '#0D0D0B' }}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale transition-opacity group-hover:opacity-65" />
      )}
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(13,13,11,.15) 0%,rgba(13,13,11,.85) 100%)' }} />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_8px_30px_rgba(26,95,212,.55)] transition-transform group-hover:scale-105 sm:h-20 sm:w-20" style={{ background: '#1A5FD4' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#fff" /></svg>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-white sm:p-7">
        {eyebrow && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8FB0EC]">{eyebrow}</span>}
        {title && <span className="text-[20px] font-bold leading-tight tracking-[-0.02em] sm:text-[26px]">{title}</span>}
        {sub && <span className="text-[14px] text-white/80">{sub}</span>}
        {note && <span className="mt-1 text-[11px] text-white/55">{note}</span>}
      </span>
    </button>
  )
}
