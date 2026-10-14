'use client'

import { useRef } from 'react'

export function ViewAsSelect({ groups, current, action, dark }: {
  groups: { label: string; options: { value: string; label: string }[] }[]
  current: string; action: (fd: FormData) => Promise<void>; dark: boolean
}) {
  const form = useRef<HTMLFormElement>(null)
  // Auswahl per Wert vergleichen — Reihenfolge der JSON-Felder kann abweichen
  const norm = (v: string) => { try { const o = JSON.parse(v); return [o.companyId, o.teamKey ?? '', o.userId ?? ''].join('|') } catch { return '' } }
  const sel = groups.flatMap((g) => g.options).find((o) => norm(o.value) === norm(current))?.value ?? ''
  return (
    <form ref={form} action={action}>
      <input type="hidden" name="next" value="/dashboard/guide" />
      <select name="value" defaultValue={sel} onChange={() => form.current?.requestSubmit()}
        className={`rounded-md border px-2 py-1 text-xs ${dark ? 'border-white/40 bg-purple-700 text-white' : 'border-purple-200 bg-white text-purple-900'}`}>
        <option value="">— Firma, Team oder Person wählen —</option>
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
    </form>
  )
}
