import { NextRequest } from 'next/server'
import { runAgent } from '@/lib/voice/agent-core'
import { getCallSession, saveCallSession } from '@/lib/voice/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function esc(s: string) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string)) }
function twiml(inner: string) { return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } }) }
const VOICE = 'Polly.Vicki' // deutsche Twilio-Stimme (Amazon Polly)

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const callSid = String(form?.get('CallSid') || 'test')
  const speech = String(form?.get('SpeechResult') || '').trim()
  const dw = Number(req.nextUrl.searchParams.get('dw') || form?.get('dw') || 0)

  let history = await getCallSession(callSid).catch(() => [])
  let reply = ''
  if (!history.length && !speech) {
    const r = await runAgent(dw, []); reply = r.reply; history = [{ role: 'assistant', content: reply }]
  } else if (speech) {
    history = [...history, { role: 'user', content: speech }]
    const r = await runAgent(dw, history); reply = r.reply
    history = [...history, { role: 'assistant', content: reply }]
  } else {
    reply = 'Ich bin noch dran — was kann ich für Sie tun?'
  }
  await saveCallSession(callSid, dw, history).catch(() => {})

  const action = `/voice/twiml?dw=${dw}`
  return twiml(
    `<Gather input="speech" language="de-DE" speechTimeout="auto" action="${action}" method="POST">` +
    `<Say language="de-DE" voice="${VOICE}">${esc(reply)}</Say>` +
    `</Gather>` +
    `<Say language="de-DE" voice="${VOICE}">Ich habe nichts mehr gehört. Bis bald!</Say>`
  )
}

// Twilio testet die URL teils per GET
export async function GET() { return twiml(`<Say language="de-DE" voice="${VOICE}">Voice-Test bereit.</Say>`) }
