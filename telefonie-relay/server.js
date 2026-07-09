/**
 * EilersFriends OS – Telefonie-Relay (Fly.io)
 * ---------------------------------------------------------------------------
 * DÜNNE BRÜCKE. Dieser Server hält KEINE Dialog-Logik. Er verbindet Twilio
 * ConversationRelay (WebSocket, Streaming-STT/TTS) mit dem echten Brain der
 * Website unter  <AGENT_BASE>/agent  (runAgent: Claude + Tools + Wissen +
 * Personas + Team-Benachrichtigung). Single source of truth.
 *
 * Warum überhaupt ein eigener Server? Vercel (serverless) kann keine
 * dauerhaften WebSockets halten. ConversationRelay braucht genau das.
 *
 * Ablauf eines Anrufs:
 *   easybell → BYOC-Trunk → Twilio  →  POST /voice/inbound  (dieser Server)
 *     → antwortet mit <Connect><ConversationRelay url="wss://HOST/relay">
 *   Twilio öffnet WS zu /relay, streamt Sprache; pro User-Turn holen wir die
 *   Antwort synchron von <AGENT_BASE>/agent und streamen sie zurück.
 */

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
// Öffentlicher Hostname dieses Servers (Fly), z. B. eilersfriends-voice.fly.dev
const PUBLIC_HOST = process.env.PUBLIC_HOST || "";
// Basis der Website-Voice-Endpunkte
const AGENT_BASE = (process.env.AGENT_BASE || "https://www.eilersfriends.com/voice").replace(/\/$/, "");
const VOICE_API_KEY = process.env.VOICE_API_KEY || "";
const TTS_LANGUAGE = process.env.TTS_LANGUAGE || "de-DE";
// ── Turn-Taking / STT (versteht alles, reagiert schnell, unterbrechbar) ──────
// Deepgram nova-2 versteht Deutsch gut; speechTimeout = ms Wartezeit nach
// Sprech-Ende (600-5000), niedriger = schneller, aber Nummern nicht abschneiden.
const STT_PROVIDER = process.env.STT_PROVIDER || "Deepgram";
const STT_MODEL = process.env.STT_MODEL || "nova-2-general";
const SPEECH_TIMEOUT = process.env.SPEECH_TIMEOUT || "800";
const INTERRUPTIBLE = process.env.INTERRUPTIBLE || "speech";   // none|dtmf|speech|any
const REPORT_INPUT = process.env.REPORT_INPUT || "speech";     // none|dtmf|speech|any

// ── Stimmen (ElevenLabs, umschaltbar) + Rueckfallebene ──────────────────────
// Primaer zwei Library-Stimmen (A/B), zusaetzlich Matilda (Default-ElevenLabs).
// Umschalten: TTS_VOICE_STRATEGY = a | b | matilda | day  (oder ?voice=a|b|matilda
// an der Inbound-URL). "day" = Mo/Mi/Fr -> A, sonst B.
// Wenn ElevenLabs kein Budget mehr hat (75-Min-Limit) oder nicht erreichbar ist,
// faellt ConversationRelay auf eine Twilio-eigene deutsche Stimme zurueck (immer da).
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const VOICE_A = process.env.TTS_VOICE_A || "SiMvlSW9cKKHDYT4BzOp";
const VOICE_B = process.env.TTS_VOICE_B || "E77N7V3flAUuuy7eDa10";
const VOICE_MATILDA = process.env.TTS_VOICE_MATILDA || "XrExE9yKIg1WjnnlVkGX";
// Namen je Stimme (konfigurierbar). Ei ~ "AI": Eilisabet/Eilexander ehren Eilers UND A.I.
const NAME_A = process.env.TTS_NAME_A || "Eilisabet";       // Stimme A (Lola, weiblich)
const NAME_B = process.env.TTS_NAME_B || "Eilexander";      // Stimme B (Axel, maennlich)
const NAME_MATILDA = process.env.TTS_NAME_MATILDA || "Eilisabet"; // Matilda (weiblich)
const IDENTITY = { a: { name: NAME_A, gender: "f" }, b: { name: NAME_B, gender: "m" }, matilda: { name: NAME_MATILDA, gender: "f" } };
const VOICE_STRATEGY = (process.env.TTS_VOICE_STRATEGY || "a").toLowerCase();
const FALLBACK_PROVIDER = process.env.TTS_FALLBACK_PROVIDER || "Google";
const FALLBACK_VOICE_F = process.env.TTS_FALLBACK_VOICE_F || "de-DE-Chirp3-HD-Leda";   // weiblich
const FALLBACK_VOICE_M = process.env.TTS_FALLBACK_VOICE_M || "de-DE-Chirp3-HD-Charon"; // maennlich
const EL_VOICES = { a: VOICE_A, b: VOICE_B, matilda: VOICE_MATILDA };

function pickVoiceKey(override) {
  const o = String(override || "").toLowerCase();
  if (EL_VOICES[o]) return o;
  if (VOICE_STRATEGY === "day") {
    const d = new Date().getDay(); // 0 So .. 6 Sa
    return [1, 3, 5].includes(d) ? "a" : "b";
  }
  return EL_VOICES[VOICE_STRATEGY] ? VOICE_STRATEGY : "a";
}

let _elBudget = { ok: false, at: 0 };
async function elevenlabsHasBudget() {
  if (!ELEVENLABS_API_KEY) return false;
  if (Date.now() - _elBudget.at < 60000) return _elBudget.ok; // 60s Cache
  let ok = false;
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": ELEVENLABS_API_KEY } });
    if (r.ok) { const j = await r.json(); ok = ((j.character_limit ?? 0) - (j.character_count ?? 0)) > 400; }
  } catch { ok = false; }
  _elBudget = { ok, at: Date.now() };
  return ok;
}

async function ttsAttrsFor(override) {
  const key = pickVoiceKey(override);
  const ident = IDENTITY[key];
  if (await elevenlabsHasBudget()) {
    return { attrs: ` ttsProvider="ElevenLabs" voice="${esc(EL_VOICES[key])}"`, engine: "elevenlabs", assistant: ident };
  }
  // ElevenLabs aus/Budget leer -> Twilio-Stimme, geschlechtsgleich zum Namen
  const fv = ident.gender === "m" ? FALLBACK_VOICE_M : FALLBACK_VOICE_F;
  return { attrs: ` ttsProvider="${esc(FALLBACK_PROVIDER)}" voice="${esc(fv)}"`, engine: "twilio-fallback", assistant: ident };
}
const WELCOME_FALLBACK =
  process.env.WELCOME_FALLBACK ||
  "Grüß Gott bei Eilers und Friends! Ich bin die Assistentin des Hauses. Worum geht es bei Ihrem Anruf?";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const STARTED_AT = Date.now();
const lastCall = {};

const xhdr = () => ({ "Content-Type": "application/json", "x-api-key": VOICE_API_KEY });

// DW aus der letzten Ziffer der angerufenen Nummer (To)
const dwFromCalled = (to = "") => {
  const d = String(to).replace(/\D/g, "");
  return d ? parseInt(d[d.length - 1], 10) : 0;
};

// Eröffnungssatz vom echten Brain holen (leere History => Persona-Greeting)
async function fetchGreeting(dw, callerId, assistant) {
  try {
    const r = await fetch(`${AGENT_BASE}/agent`, {
      method: "POST",
      headers: xhdr(),
      body: JSON.stringify({ dw, messages: [], callerId, assistant }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j?.reply || j?.speech) return String(j.speech || j.reply);
    }
  } catch (e) {
    console.warn("greeting fetch failed:", e?.message || e);
  }
  return WELCOME_FALLBACK;
}

// Eine Dialogantwort vom echten Brain holen
async function fetchReply(dw, messages, callerId, assistant) {
  try {
    const r = await fetch(`${AGENT_BASE}/agent`, {
      method: "POST",
      headers: xhdr(),
      body: JSON.stringify({ dw, messages, callerId, assistant }),
    });
    if (r.ok) {
      const j = await r.json();
      const text = String(j?.reply || "");
      return { text, speech: String(j?.speech || text) };
    }
    console.warn("agent non-200:", r.status);
  } catch (e) {
    console.warn("reply fetch failed:", e?.message || e);
  }
  const fb = "Entschuldigung, da ist gerade etwas schiefgelaufen. Bitte hinterlassen Sie Ihren Namen und eine Rückrufnummer – das Team meldet sich.";
  return { text: fb, speech: fb };
}

// Anruf am Ende ins CRM protokollieren (best effort)
async function logCall(dw, callerId, messages) {
  if (!messages.length) return;
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Anrufer" : "Assistentin"}: ${m.content}`)
    .join("\n");
  try {
    await fetch(`${AGENT_BASE}/lead`, {
      method: "POST",
      headers: xhdr(),
      body: JSON.stringify({ type: "anruf", dw, phone: callerId, transcript, meta: { channel: "conversationrelay" } }),
    });
  } catch { /* ignore */ }
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
}

// ---------------------------------------------------------------------------
// TwiML: Twilio Inbound-Webhook zeigt HIERHIN (Voice-URL des BYOC/der Nummer)
// ---------------------------------------------------------------------------
async function inboundTwiml(req, res) {
  const caller = req.body.From || req.body.Caller || "";
  const dw = dwFromCalled(req.body.To || "");
  lastCall[dw] = new Date().toISOString();
  const host = PUBLIC_HOST || req.get("host");
  const { attrs: ttsAttrs, engine, assistant } = await ttsAttrsFor(req.query.voice);
  const greeting = await fetchGreeting(dw, caller, assistant);
  console.log(`📞 DW ${dw} · Stimme: ${engine} · ${assistant.name}`);

  res.type("text/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://${host}/relay" language="${TTS_LANGUAGE}" ttsLanguage="${TTS_LANGUAGE}" transcriptionLanguage="${TTS_LANGUAGE}" transcriptionProvider="${STT_PROVIDER}" speechModel="${STT_MODEL}" speechTimeout="${SPEECH_TIMEOUT}"${ttsAttrs} interruptible="${INTERRUPTIBLE}" reportInputDuringAgentSpeech="${REPORT_INPUT}" welcomeGreeting="${esc(greeting)}">
      <Parameter name="caller_number" value="${esc(caller)}" />
      <Parameter name="dw" value="${dw}" />
      <Parameter name="assistant_name" value="${esc(assistant.name)}" />
      <Parameter name="assistant_gender" value="${esc(assistant.gender)}" />
    </ConversationRelay>
  </Connect>
</Response>`
  );
}
app.post("/voice/inbound", inboundTwiml);
app.post("/inbound", inboundTwiml); // Alias

// Health für Monitoring
app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    uptime_s: Math.round((Date.now() - STARTED_AT) / 1000),
    agent_base: AGENT_BASE,
    api_key: !!VOICE_API_KEY,
    tts: { strategy: VOICE_STRATEGY, a: VOICE_A, b: VOICE_B, matilda: VOICE_MATILDA, elevenlabs_key: !!ELEVENLABS_API_KEY, fallback: `${FALLBACK_PROVIDER}/${FALLBACK_VOICE_F}|${FALLBACK_VOICE_M}`, names: { a: NAME_A, b: NAME_B } },
    last_call_per_dw: lastCall,
  })
);
app.get("/", (_req, res) => res.type("text").send("EilersFriends Telefonie-Relay – ok"));

// ---------------------------------------------------------------------------
// WebSocket /relay  (Twilio ConversationRelay verbindet sich hierher)
// ---------------------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/relay" });

wss.on("connection", (ws) => {
  const session = { dw: 0, caller: "", messages: [], assistant: undefined };
  let busy = false;

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "setup") {
      session.caller = msg.customParameters?.caller_number || msg.from || "";
      session.dw = parseInt(msg.customParameters?.dw ?? "0", 10) || 0;
      const an = msg.customParameters?.assistant_name, ag = msg.customParameters?.assistant_gender;
      if (an) session.assistant = { name: an, gender: ag === "m" ? "m" : "f" };
      lastCall[session.dw] = new Date().toISOString();
      console.log(`🔌 Session DW ${session.dw} (${session.caller || "unbekannt"})`);
      return;
    }

    // Finaler User-Turn
    if (msg.type === "prompt" && msg.voicePrompt) {
      if (busy) return;
      busy = true;
      session.messages.push({ role: "user", content: msg.voicePrompt });
      const { text, speech } = await fetchReply(session.dw, session.messages, session.caller, session.assistant);
      session.messages.push({ role: "assistant", content: text });
      try {
        ws.send(JSON.stringify({ type: "text", token: speech, last: true }));
      } catch { /* socket closed */ }
      busy = false;
      return;
    }

    if (msg.type === "error") {
      console.warn("relay error event:", msg.description || msg);
    }
  });

  ws.on("close", () => {
    console.log(`💾 Session Ende DW ${session.dw} (${session.messages.length} Turns)`);
    logCall(session.dw, session.caller, session.messages);
  });
});

server.listen(PORT, () =>
  console.log(
    `🚀 Telefonie-Relay auf :${PORT}\n   Agent: ${AGENT_BASE}\n   Key: ${VOICE_API_KEY ? "✅" : "❌ FEHLT"}  Stimme: ${VOICE_STRATEGY} (EL-Key ${ELEVENLABS_API_KEY ? "✅" : "❌"}, Fallback ${FALLBACK_PROVIDER}/${FALLBACK_VOICE_F}|${FALLBACK_VOICE_M})  Host: ${PUBLIC_HOST || "(request-host)"}`
  )
);
