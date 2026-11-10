'use client'

import { useEffect, useState } from 'react'

/** Eingabefeld für Übungen im Beitrag. Bleibt nur im Browser des Lesers (localStorage), wird nirgends gesendet. */
export function NoteInput({ storeKey, label }: { storeKey: string; label: string }) {
  const [v, setV] = useState('')
  const key = `ef-note:${storeKey}`
  useEffect(() => { try { setV(localStorage.getItem(key) ?? '') } catch {} }, [key])
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-semibold text-[#3A3836]">{label}</span>
      <input
        value={v}
        onChange={(e) => { setV(e.target.value); try { localStorage.setItem(key, e.target.value) } catch {} }}
        className="w-full rounded-xl border border-[#D9D7D6] bg-white px-4 py-3 text-[16px] outline-none focus:border-[var(--ef-a,#1A5FD4)]"
        style={{ fontFamily: "'Permanent Marker', cursive", color: 'var(--ef-d,#124293)' }}
      />
    </label>
  )
}
