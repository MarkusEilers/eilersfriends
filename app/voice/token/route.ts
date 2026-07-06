import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { voiceAuthorized } from '@/lib/voice/auth'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function b64url(x: Buffer | string) { return Buffer.from(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }

async function isAdmin() { try { const s = await auth(); return !!s?.user && (s.user.role === 'admin' || s.user.role === 'coach') } catch { return false } }

export async function GET(req: NextRequest) {
  if (!voiceAuthorized(req) && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKeySid = process.env.TWILIO_API_KEY_SID
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET
  const appSid = process.env.TWILIO_TWIML_APP_SID
  const missing: string[] = []
  if (!accountSid) missing.push('TWILIO_ACCOUNT_SID')
  if (!apiKeySid) missing.push('TWILIO_API_KEY_SID')
  if (!apiKeySecret) missing.push('TWILIO_API_KEY_SECRET')
  if (!appSid) missing.push('TWILIO_TWIML_APP_SID')
  if (missing.length) return NextResponse.json({ configured: false, missing })

  const identity = req.nextUrl.searchParams.get('identity') || 'cockpit'
  const now = Math.floor(Date.now() / 1000)
  const header = { typ: 'JWT', alg: 'HS256', cty: 'twilio-fpa;v=1' }
  const payload = {
    jti: `${apiKeySid}-${now}`, iss: apiKeySid, sub: accountSid, nbf: now, exp: now + 3600,
    grants: { identity, voice: { outgoing: { application_sid: appSid }, incoming: { allow: true } } },
  }
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const sig = b64url(crypto.createHmac('sha256', apiKeySecret as string).update(signingInput).digest())
  return NextResponse.json({ configured: true, token: `${signingInput}.${sig}`, identity })
}
