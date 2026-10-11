'use client'

import { useState, useTransition } from 'react'
import { createInviteLink } from '@/lib/actions/rollouts-admin'

/** Erzeugt einen Einladungslink und kopiert ihn — verschickt wird nichts. */
export function InviteButton({ userId, companyId, hasLogin }: { userId: string; companyId: string; hasLogin: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  if (url) {
    return (
      <span className="flex items-center gap-1.5">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="w-56 rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600" />
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true) }} className="text-[11px] font-semibold text-blue-700">{copied ? 'kopiert' : 'kopieren'}</button>
      </span>
    )
  }
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => setUrl((await createInviteLink(userId, companyId)).url))}
      className="rounded-md border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
      {hasLogin ? 'Passwort-Link' : 'Einladungslink'}
    </button>
  )
}
