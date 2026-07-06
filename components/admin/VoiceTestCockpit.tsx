'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Send, Volume2, Loader2, Radio } from 'lucide-react'

const DWS: { dw: number; name: string }[] = [
  { dw: 0, name: 'Zentrale (AI-Empfang)' }, { dw: 1, name: 'Sales AI' }, { dw: 2, name: 'Customer Relationship' },
  { dw: 3, name: 'Infos' }, { dw: 4, name: 'Daniel (SDR)' }, { dw: 5, name: 'Aljona' },
  { dw: 6, name: 'Cosima' }, { dw: 7, name: 'Markus' }, { dw: 8, name: 'Reserve → Zentrale' },
]
type Msg = { role: 'user' | 'assistant'; content: string }

export function VoiceTestCockpit() {
  const [engine, setEngine] = useState<'browser' | 'twilio'>('browser')
  const [dw, setDw] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceName] = useState('')
  const [mode, setMode] = useState('')
  const [twStatus, setTwStatus] = useState<'idle' | 'connecting' | 'live' | 'ended' | 'error'>('idle')
  const [twMsg, setTwMsg] = useState('')
  const recRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const deviceRef = useRef<any>(null)
  const callRef = useRef<any>(null)

  useEffect(() => {
    function load() { const v = window.speechSynthesis?.getVoices?.() || []; const de = v.filter(x => x.lang?.toLowerCase().startsWith('de')); setVoices(de.length ? de : v); if (!voiceName && de[0]) setVoiceName(de[0].name) }
    load(); if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load
  }, [voiceName])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [messages])

  function speak(t: string) { try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'de-DE'; const v = voices.find(x => x.name === voiceName); if (v) u.voice = v; s.speak(u) } catch { /* */ } }

  // ---------- Browser-Simulation ----------
  async function callAgent(next: Msg[]) {
    setBusy(true)
    try {
      const res = await fetch('/voice/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dw, messages: next }) })
      const d = await res.json(); const reply = d.reply || '…'; setMode(d.mode || '')
      setMessages(m => [...m, { role: 'assistant', content: reply }]); speak(reply)
    } catch { setMessages(m => [...m, { role: 'assistant', content: '(Fehler beim Agenten)' }]) } finally { setBusy(false) }
  }
  function startCall(d: number) {
    setDw(d); setMessages([]); setMode('')
    if (engine === 'browser') setTimeout(() => callAgent([]), 50)
    else startTwilio(d)
  }
  function hangup() {
    stopMic(); window.speechSynthesis?.cancel()
    if (engine === 'twilio') { try { callRef.current?.disconnect(); deviceRef.current?.destroy() } catch { /* */ } setTwStatus('idle'); setTwMsg('') }
    setDw(null); setMessages([])
  }
  function send(t: string) { const msg = t.trim(); if (!msg || dw == null) return; const next: Msg[] = [...messages, { role: 'user', content: msg }]; setMessages(next); setText(''); callAgent(next) }
  function startMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Spracherkennung wird in diesem Browser nicht unterstützt (Chrome empfohlen).'); return }
    const rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = false; rec.continuous = false
    rec.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript || ''; if (t) send(t) }
    rec.onend = () => setListening(false); rec.onerror = () => setListening(false)
    recRef.current = rec; setListening(true); rec.start()
  }
  function stopMic() { try { recRef.current?.stop() } catch { /* */ } setListening(false) }

  // ---------- Twilio WebRTC (echte Stimme) ----------
  async function startTwilio(d: number) {
    setTwStatus('connecting'); setTwMsg('Verbinde …')
    try {
      const tok = await fetch('/voice/token').then(r => r.json())
      if (!tok.configured) { setTwStatus('error'); setTwMsg('Twilio noch nicht konfiguriert: ' + (tok.missing || []).join(', ')); return }
      const { Device } = await import('@twilio/voice-sdk')
      const device = new Device(tok.token, { logLevel: 1 }); deviceRef.current = device
      const call = await device.connect({ params: { To: String(d), dw: String(d) } }); callRef.current = call
      call.on('accept', () => { setTwStatus('live'); setTwMsg('Verbunden — sprich einfach.') })
      call.on('disconnect', () => { setTwStatus('ended'); setTwMsg('Anruf beendet.') })
      call.on('error', (e: any) => { setTwStatus('error'); setTwMsg('Fehler: ' + (e?.message || e)) })
    } catch (e: any) { setTwStatus('error'); setTwMsg('Fehler: ' + (e?.message || e)) }
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-white p-1 text-xs font-semibold">
        {(['browser', 'twilio'] as const).map(en => (
          <button key={en} onClick={() => { hangup(); setEngine(en) }} className={'rounded-full px-3 py-1.5 ' + (engine === en ? 'text-white' : 'text-gray-600')} style={engine === en ? { backgroundColor: '#1A5FD4' } : undefined}>
            {en === 'browser' ? 'Browser-Simulation' : 'Twilio (echte Stimme)'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Durchwahl anrufen</p>
          <div className="grid grid-cols-1 gap-2">
            {DWS.map(x => (
              <button key={x.dw} onClick={() => startCall(x.dw)} disabled={busy && dw === x.dw}
                className={'flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ' + (dw === x.dw ? 'border-transparent text-white' : 'border-gray-200 text-gray-700 hover:border-blue-300')}
                style={dw === x.dw ? { backgroundColor: '#1A5FD4' } : undefined}>
                <span><span className="tabular-nums opacity-60">DW {x.dw}</span> · {x.name}</span>
                <Phone size={14} />
              </button>
            ))}
          </div>
          {engine === 'browser' && (
            <div className="mt-4">
              <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400"><Volume2 size={12} /> Stimme (Browser)</label>
              <select value={voiceName} onChange={e => setVoiceName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
                {voices.length === 0 && <option>Standard</option>}
                {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
              <p className="mt-1 text-[10px] text-gray-400">Platzhalter-Stimme. Twilio-Modus nutzt die echte Twilio-Stimme (Polly, de-DE).</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          {dw == null ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">Wähle links eine Durchwahl und starte den „Anruf".</div>
          ) : engine === 'twilio' ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <span className={'mb-3 flex h-14 w-14 items-center justify-center rounded-full ' + (twStatus === 'live' ? 'animate-pulse bg-green-600' : twStatus === 'error' ? 'bg-red-500' : 'bg-[#1A5FD4]') + ' text-white'}><Radio size={22} /></span>
              <p className="text-sm font-bold text-gray-900">Twilio-Anruf DW {dw} · {DWS.find(x => x.dw === dw)?.name}</p>
              <p className="mt-1 text-sm text-gray-500">{twMsg || (twStatus === 'connecting' ? 'Verbinde …' : '')}</p>
              <button onClick={hangup} className="mt-5 inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"><PhoneOff size={13} /> Auflegen</button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Anruf DW {dw} · {DWS.find(x => x.dw === dw)?.name}{mode ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{mode === 'claude' ? 'Claude' : mode === 'greeting' ? 'Begrüßung' : 'Skript-Fallback'}</span> : null}</p>
                <button onClick={hangup} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"><PhoneOff size={13} /> Auflegen</button>
              </div>
              <div ref={scrollRef} className="mb-3 h-72 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
                {messages.map((m, i) => (
                  <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <span className={'max-w-[80%] rounded-2xl px-3 py-2 text-sm ' + (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm')}>{m.content}</span>
                  </div>
                ))}
                {busy && <div className="flex justify-start"><span className="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-sm text-gray-400 shadow-sm"><Loader2 size={13} className="animate-spin" /> …</span></div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={listening ? stopMic : startMic} className={'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ' + (listening ? 'animate-pulse bg-red-600' : 'bg-[#1A5FD4]')} title="Sprechen">{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(text) }} placeholder="…oder tippen" className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
                <button onClick={() => send(text)} disabled={busy || !text.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-40"><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
