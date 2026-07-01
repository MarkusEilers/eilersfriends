import { getRefreshToken, saveConnection, markRevoked } from './store'
import { WORK, membersFor } from './config'

const TENANT = process.env.MS_TENANT_ID || 'organizations'
const CLIENT_ID = process.env.MS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
export const REDIRECT_URI = process.env.MS_REDIRECT_URI || 'https://www.eilersfriends.com/api/schedule/oauth/callback'
export const SCOPE = 'offline_access openid email profile https://graph.microsoft.com/Calendars.ReadWrite'

export function graphConfigured(): boolean { return Boolean(CLIENT_ID && CLIENT_SECRET) }

export function authorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code', redirect_uri: REDIRECT_URI,
    response_mode: 'query', scope: SCOPE, state, prompt: 'select_account',
  })
  return `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${p.toString()}`
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI, ...body }).toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'token error')
  return data as { access_token: string; refresh_token?: string }
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; email: string | null }> {
  const t = await tokenRequest({ grant_type: 'authorization_code', code, scope: SCOPE })
  let email: string | null = null
  try {
    const me = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${t.access_token}` } }).then(r => r.json())
    email = me.mail || me.userPrincipalName || null
  } catch { /* ignore */ }
  return { accessToken: t.access_token, refreshToken: t.refresh_token || '', email }
}

async function accessTokenFor(slug: string): Promise<string | null> {
  const rt = await getRefreshToken(slug)
  if (!rt) return null
  try {
    const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: rt, scope: SCOPE })
    if (t.refresh_token) await saveConnection(slug, t.refresh_token, null).catch(() => {})
    return t.access_token
  } catch { await markRevoked(slug).catch(() => {}); return null }
}

type Busy = { start: number; end: number }

function tzOffsetMin(d: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const p: Record<string, string> = {}; for (const x of dtf.formatToParts(d)) p[x.type] = x.value
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return (asUTC - d.getTime()) / 60000
}
function wallToUTC(y: number, m: number, day: number, h: number, min: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, day, h, min)
  const off = tzOffsetMin(new Date(guess), tz)
  return new Date(guess - off * 60000)
}
function berlinParts(d: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })
  const p: Record<string, string> = {}; for (const x of dtf.formatToParts(d)) p[x.type] = x.value
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return { y: +p.year, m: +p.month, day: +p.day, wd }
}

async function busyFor(slug: string, startISO: string, endISO: string): Promise<Busy[] | null> {
  const at = await accessTokenFor(slug)
  if (!at) return null
  const m = membersFor(slug)
  const res = await fetch('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
    method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedules: m.map(p => p.email), startTime: { dateTime: startISO, timeZone: 'UTC' }, endTime: { dateTime: endISO, timeZone: 'UTC' }, availabilityViewInterval: WORK.granularityMin }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const busy: Busy[] = []
  for (const sched of (data.value || [])) {
    for (const it of (sched.scheduleItems || [])) {
      if (['busy', 'tentative', 'oof', 'workingElsewhere'].includes(it.status)) {
        const s = new Date((it.start?.dateTime || '') + (/(Z|[+-]\d\d:?\d\d)$/.test(it.start?.dateTime || '') ? '' : 'Z')).getTime()
        const e = new Date((it.end?.dateTime || '') + (/(Z|[+-]\d\d:?\d\d)$/.test(it.end?.dateTime || '') ? '' : 'Z')).getTime()
        if (s && e) busy.push({ start: s - WORK.bufferMin * 60000, end: e + WORK.bufferMin * 60000 })
      }
    }
  }
  return busy
}

export async function freeSlots(slug: string, durationMin: number): Promise<{ slots: string[]; connected: boolean }> {
  const now = Date.now()
  const startISO = new Date(now).toISOString().slice(0, 19)
  const endISO = new Date(now + WORK.horizonDays * 864e5).toISOString().slice(0, 19)
  const busy = await busyFor(slug, startISO, endISO)
  if (busy === null) return { slots: [], connected: false }
  const earliest = now + WORK.leadHours * 3600e3
  const out: string[] = []
  for (let dd = 0; dd <= WORK.horizonDays && out.length < 200; dd++) {
    const probe = new Date(now + dd * 864e5)
    const bp = berlinParts(probe, WORK.tz)
    if (!WORK.days.includes(bp.wd)) continue
    for (let h = WORK.startHour * 60; h + durationMin <= WORK.endHour * 60; h += WORK.granularityMin) {
      const s = wallToUTC(bp.y, bp.m, bp.day, Math.floor(h / 60), h % 60, WORK.tz).getTime()
      const e = s + durationMin * 60000
      if (s < earliest) continue
      const blocked = busy.some(b => s < b.end && e > b.start)
      if (!blocked) out.push(new Date(s).toISOString())
    }
  }
  return { slots: out, connected: true }
}

export async function createBooking(slug: string, startISO: string, durationMin: number, name: string, email: string, note: string): Promise<{ ok: boolean; error?: string; joinUrl?: string | null; webLink?: string | null; eventId?: string | null }> {
  const at = await accessTokenFor(slug)
  if (!at) return { ok: false, error: 'not_connected' }
  const m = membersFor(slug)
  const start = new Date(startISO)
  const end = new Date(start.getTime() + durationMin * 60000)
  const attendees = [
    { emailAddress: { address: email, name }, type: 'required' },
    ...m.slice(1).map(p => ({ emailAddress: { address: p.email, name: p.name }, type: 'required' })),
  ]
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: `Eilers+Friends · Termin mit ${name}`,
      body: { contentType: 'text', content: note || 'Gebucht über eilersfriends.com/schedule' },
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      attendees, isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness',
    }),
  })
  const data = await res.json().catch(() => ({} as Record<string, unknown>))
  if (!res.ok) { const e = (data as { error?: { message?: string } }).error; return { ok: false, error: e?.message || 'create_failed' } }
  const d = data as { id?: string; webLink?: string; onlineMeeting?: { joinUrl?: string }; onlineMeetingUrl?: string }
  return { ok: true, joinUrl: d.onlineMeeting?.joinUrl || d.onlineMeetingUrl || null, webLink: d.webLink || null, eventId: d.id || null }
}
