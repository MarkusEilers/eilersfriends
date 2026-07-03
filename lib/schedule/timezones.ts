// Client-safe: 24 große Städte + IANA-Zeitzone. Keine Server-Imports.
export type TzCity = { label: string; tz: string }

export const TZ_CITIES: TzCity[] = [
  { label: 'Honolulu', tz: 'Pacific/Honolulu' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Denver', tz: 'America/Denver' },
  { label: 'Mexico City', tz: 'America/Mexico_City' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'São Paulo', tz: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Madrid', tz: 'Europe/Madrid' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Athen', tz: 'Europe/Athens' },
  { label: 'Istanbul', tz: 'Europe/Istanbul' },
  { label: 'Moskau', tz: 'Europe/Moscow' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Karatschi', tz: 'Asia/Karachi' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'Bangkok', tz: 'Asia/Bangkok' },
  { label: 'Singapur', tz: 'Asia/Singapore' },
  { label: 'Shanghai', tz: 'Asia/Shanghai' },
  { label: 'Tokio', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Auckland', tz: 'Pacific/Auckland' },
]

// "UTC+02:00" für eine Zeitzone (aktueller Offset)
export function tzOffsetLabel(tz: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || ''
    return part.replace('GMT', 'UTC') || 'UTC'
  } catch { return '' }
}

// Kurzer Stadt-/Zonennamen aus IANA ableiten (Fallback, falls nicht in der Liste)
export function cityFromTz(tz: string): string {
  const known = TZ_CITIES.find(c => c.tz === tz)
  if (known) return known.label
  const seg = tz.split('/').pop() || tz
  return seg.replace(/_/g, ' ')
}

export function detectTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin' } catch { return 'Europe/Berlin' }
}
