import { NextRequest } from 'next/server'
import { runAgent, speakable } from '@/lib/voice/agent-core'
import { getCallSession, saveCallSession } from '@/lib/voice/store'
import { logError } from '@/lib/errors/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function esc(s: string) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string)) }
function twiml(inner: string) { return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } }) }


export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const callSid = String(form?.get('CallSid') || 'test')
  const speech = String(form?.get('SpeechResult') || '').trim()
  const dw = Number(req.nextUrl.searchParams.get('dw') || form?.get('dw') || 0)
  const callerId = String(form?.get('From') || form?.get('Caller') || '')
  const retry = Number(req.nextUrl.searchParams.get('retry') || 0)
  const VOICE = String(req.nextUrl.searchParams.get('voice') || form?.get('voice') || process.env.VOICE_TWILIO_VOICE || 'Polly.Vicki-Neural')

  let reply = ''
  try {
    let history = await getCallSession(callSid).catch(() => [])
    if (!history.length && !speech) {
      const r = await runAgent(dw, [], { callerId }); reply = r.reply; history = [{ role: 'assistant', content: reply }]
    } else if (speech) {
      history = [...history, { role: 'user', content: speech }]
      const r = await runAgent(dw, history, { callerId }); reply = r.reply
      history = [...history, { role: 'assistant', content: reply }]
    } else {
      if (retry >= 2) return twiml(`<Say language="de-DE" voice="${VOICE}">Kein Problem, melden Sie sich einfach, wenn es passt. Bis bald!</Say>`)
      const nudge = retry === 0 ? 'Sind Sie noch dran? Erzählen Sie einfach kurz, worum es geht.' : 'Ich höre Sie leider nicht. Sagen Sie ein Wort, dann helfe ich weiter.'
      const a = `/voice/twiml?dw=${dw}&amp;voice=${encodeURIComponent(VOICE)}&amp;retry=${retry + 1}`
      return twiml(`<Gather input="speech" language="de-DE" speechTimeout="auto" timeout="8" action="${a}" method="POST"><Say language="de-DE" voice="${VOICE}">${esc(nudge)}</Say></Gather><Redirect method="POST">${a}</Redirect>`)
    }
    await saveCallSession(callSid, dw, history).catch(() => {})
  } catch (e) {
    await logError({ source: 'voice', message: 'twiml handler: ' + String((e as Error)?.message || e), url: '/voice/twiml' }).catch(() => {})
    reply = 'Entschuldigung, da ist gerade etwas schiefgelaufen. Bitte hinterlassen Sie Ihren Namen und eine Rückrufnummer, das Team meldet sich.'
  }

  const action = `/voice/twiml?dw=${dw}&amp;voice=${encodeURIComponent(VOICE)}`
  const nudgeAction = `/voice/twiml?dw=${dw}&amp;voice=${encodeURIComponent(VOICE)}&amp;retry=0`
  return twiml(
    `<Gather input="speech" language="de-DE" speechTimeout="auto" timeout="8" action="${action}" method="POST">` +
    `<Say language="de-DE" voice="${VOICE}">${esc(speakable(reply))}</Say>` +
    `</Gather>` +
    `<Redirect method="POST">${nudgeAction}</Redirect>`
  )
}

// Twilio testet die URL teils per GET
export async function GET() { return twiml(`<Say language="de-DE" voice="Polly.Vicki-Neural">Voice-Test bereit.</Say>`) }
