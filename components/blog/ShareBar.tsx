'use client'

import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Leiste unter dem Kopf: Anhören (wenn es eine Audiofassung gibt) und Teilen. */
export function ShareBar({ audio, minutes }: { audio?: string | null; minutes?: number | null }) {
  const t = useTranslations('blogUi.share')
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [el] = useState(() => (typeof window !== 'undefined' && audio ? new Audio(audio) : null))
  const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''
  function toggle() {
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) } else { el.play().catch(() => {}); setPlaying(true) }
  }
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600">
      {audio ? (
        <button onClick={toggle} className="inline-flex items-center gap-2 font-semibold text-gray-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white">{playing ? <Pause size={13} /> : <Play size={13} />}</span>
          {minutes ? t('listenWithMinutes', { minutes }) : t('listen')}
        </button>
      ) : <span>{minutes ? t('readingTime', { minutes }) : ''}</span>}
      <span className="flex items-center gap-2">
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">{t('linkedin')}</a>
        <span className="text-gray-300">·</span>
        <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) }} className="hover:text-gray-900">
          {copied ? t('copied') : t('copyLink')}
        </button>
      </span>
    </div>
  )
}
