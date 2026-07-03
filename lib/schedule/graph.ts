import { getRefreshToken, saveConnection, markRevoked } from './store'
import { WORK, membersFor } from './config'

const TENANT = process.env.MS_TENANT_ID || 'organizations'
const CLIENT_ID = process.env.MS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
export const REDIRECT_URI = process.env.MS_REDIRECT_URI || 'https://www.eilersfriends.com/api/schedule/oauth/callback'
const BASE_SCOPE = 'offline_access openid email profile https://graph.microsoft.com/Calendars.ReadWrite'
export const SCOPE = BASE_SCOPE + ' https://graph.microsoft.com/Mail.Send'

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
  let t: { access_token: string; refresh_token?: string } | null = null
  try {
    t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: rt, scope: SCOPE })
  } catch {
    // Fallback: alte Verbindungen ohne Mail.Send-Consent behalten Kalender-Zugriff
    try { t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: rt, scope: BASE_SCOPE }) }
    catch { await markRevoked(slug).catch(() => {}); return null }
  }
  if (t.refresh_token) await saveConnection(slug, t.refresh_token, null).catch(() => {})
  return t.access_token
}

// Für Team-Owner: Token des ersten verbundenen Mitglieds (Team-Slug hat selbst keine Verbindung)
async function accessTokenForOwner(slug: string): Promise<string | null> {
  const direct = await accessTokenFor(slug)
  if (direct) return direct
  for (const p of membersFor(slug)) { const t = await accessTokenFor(p.slug); if (t) return t }
  return null
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
  const at = await accessTokenForOwner(slug)
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
        if (s && e) busy.push({ start: s, end: e })
      }
    }
  }
  return busy
}

export type SlotOpts = { durationMin: number; bufferBeforeMin?: number; bufferAfterMin?: number; blockedDayKeys?: Set<string> }
function pad2(n: number) { return String(n).padStart(2, '0') }

export async function freeSlots(slug: string, opts: SlotOpts): Promise<{ slots: string[]; connected: boolean }> {
  const durationMin = opts.durationMin
  const bufBefore = (opts.bufferBeforeMin ?? 0) * 60000
  const bufAfter = (opts.bufferAfterMin ?? 0) * 60000
  const blockedDays = opts.blockedDayKeys ?? new Set<string>()
  const now = Date.now()
  const startISO = new Date(now).toISOString().slice(0, 19)
  const endISO = new Date(now + WORK.horizonDays * 864e5).toISOString().slice(0, 19)
  const busy = await busyFor(slug, startISO, endISO)
  if (busy === null) return { slots: [], connected: false }
  const earliest = now + WORK.leadHours * 3600e3
  const out: string[] = []
  for (let dd = 0; dd <= WORK.horizonDays && out.length < 300; dd++) {
    const probe = new Date(now + dd * 864e5)
    const bp = berlinParts(probe, WORK.tz)
    if (!WORK.days.includes(bp.wd)) continue
    const dayKey = `${bp.y}-${pad2(bp.m)}-${pad2(bp.day)}`
    if (blockedDays.has(dayKey)) continue
    for (let h = WORK.startHour * 60; h + durationMin <= WORK.endHour * 60; h += WORK.granularityMin) {
      const s = wallToUTC(bp.y, bp.m, bp.day, Math.floor(h / 60), h % 60, WORK.tz).getTime()
      const e = s + durationMin * 60000
      if (s < earliest) continue
      const hit = busy.some(b => (s - bufBefore) < b.end && (e + bufAfter) > b.start)
      if (!hit) out.push(new Date(s).toISOString())
    }
  }
  return { slots: out, connected: true }
}

export async function createBooking(slug: string, startISO: string, durationMin: number, opts: { subject: string; bodyHtml: string; attendeeName: string; attendeeEmail: string }): Promise<{ ok: boolean; error?: string; joinUrl?: string | null; webLink?: string | null; eventId?: string | null }> {
  const at = await accessTokenForOwner(slug)
  if (!at) return { ok: false, error: 'not_connected' }
  const m = membersFor(slug)
  const start = new Date(startISO)
  const end = new Date(start.getTime() + durationMin * 60000)
  const attendees = [
    { emailAddress: { address: opts.attendeeEmail, name: opts.attendeeName }, type: 'required' },
    ...m.slice(1).map(p => ({ emailAddress: { address: p.email, name: p.name }, type: 'required' })),
  ]
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: opts.subject,
      body: { contentType: 'html', content: opts.bodyHtml },
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

export async function updateEventTime(slug: string, eventId: string, startISO: string, durationMin: number): Promise<{ ok: boolean; joinUrl?: string | null; error?: string }> {
  const at = await accessTokenForOwner(slug)
  if (!at) return { ok: false, error: 'not_connected' }
  const start = new Date(startISO)
  const end = new Date(start.getTime() + durationMin * 60000)
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: { dateTime: start.toISOString(), timeZone: 'UTC' }, end: { dateTime: end.toISOString(), timeZone: 'UTC' } }),
  })
  const data = await res.json().catch(() => ({} as Record<string, unknown>))
  if (!res.ok) { const e = (data as { error?: { message?: string } }).error; return { ok: false, error: e?.message || 'update_failed' } }
  const d = data as { onlineMeeting?: { joinUrl?: string } }
  return { ok: true, joinUrl: d.onlineMeeting?.joinUrl || null }
}

export async function cancelEvent(slug: string, eventId: string): Promise<{ ok: boolean; error?: string }> {
  const at = await accessTokenForOwner(slug)
  if (!at) return { ok: false, error: 'not_connected' }
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${at}` },
  })
  if (!res.ok && res.status !== 404) { const d = await res.json().catch(() => ({})); return { ok: false, error: (d as { error?: { message?: string } }).error?.message || 'cancel_failed' } }
  return { ok: true }
}

export async function sendMailAs(slug: string, to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const at = await accessTokenForOwner(slug)
  if (!at) return { ok: false, error: 'not_connected' }
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }),
  })
  if (!res.ok) { const d = await res.json().catch(() => ({})); return { ok: false, error: (d as { error?: { message?: string } }).error?.message || 'send_failed' } }
  return { ok: true }
}
