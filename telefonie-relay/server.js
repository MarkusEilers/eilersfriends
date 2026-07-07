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
// Sprachausgabe von ConversationRelay. Ohne ElevenLabs-Setup in Twilio bleibt
// Google/Amazon – bereits streaming und deutlich besser als Gather/Say.
const TTS_PROVIDER = process.env.TTS_PROVIDER || ""; // "" | "ElevenLabs" | "google" | "amazon"
const TTS_VOICE = process.env.TTS_VOICE || "";       // z. B. de-DE-Wavenet-C oder ElevenLabs-Voice-ID
const TTS_LANGUAGE = process.env.TTS_LANGUAGE || "de-DE";
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
async function fetchGreeting(dw, callerId) {
  try {
    const r = await fetch(`${AGENT_BASE}/agent`, {
      method: "POST",
      headers: xhdr(),
      body: JSON.stringify({ dw, messages: [], callerId }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j?.reply) return String(j.reply);
    }
  } catch (e) {
    console.warn("greeting fetch failed:", e?.message || e);
  }
  return WELCOME_FALLBACK;
}

// Eine Dialogantwort vom echten Brain holen
async function fetchReply(dw, messages, callerId) {
  try {
    const r = await fetch(`${AGENT_BASE}/agent`, {
      method: "POST",
      headers: xhdr(),
      body: JSON.stringify({ dw, messages, callerId }),
    });
    if (r.ok) {
      const j = await r.json();
      return String(j?.reply || "");
    }
    console.warn("agent non-200:", r.status);
  } catch (e) {
    console.warn("reply fetch failed:", e?.message || e);
  }
  return "Entschuldigung, da ist gerade etwas schiefgelaufen. Bitte hinterlassen Sie Ihren Namen und eine Rückrufnummer – das Team meldet sich.";
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
  const greeting = await fetchGreeting(dw, caller);

  const ttsAttrs =
    (TTS_PROVIDER ? ` ttsProvider="${esc(TTS_PROVIDER)}"` : "") +
    (TTS_VOICE ? ` voice="${esc(TTS_VOICE)}"` : "");

  res.type("text/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://${host}/relay" language="${TTS_LANGUAGE}" ttsLanguage="${TTS_LANGUAGE}" transcriptionLanguage="${TTS_LANGUAGE}"${ttsAttrs} interruptible="true" welcomeGreeting="${esc(greeting)}">
      <Parameter name="caller_number" value="${esc(caller)}" />
      <Parameter name="dw" value="${dw}" />
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
    tts: TTS_PROVIDER || "default",
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
  const session = { dw: 0, caller: "", messages: [] };
  let busy = false;

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "setup") {
      session.caller = msg.customParameters?.caller_number || msg.from || "";
      session.dw = parseInt(msg.customParameters?.dw ?? "0", 10) || 0;
      lastCall[session.dw] = new Date().toISOString();
      console.log(`🔌 Session DW ${session.dw} (${session.caller || "unbekannt"})`);
      return;
    }

    // Finaler User-Turn
    if (msg.type === "prompt" && msg.voicePrompt) {
      if (busy) return;
      busy = true;
      session.messages.push({ role: "user", content: msg.voicePrompt });
      const reply = await fetchReply(session.dw, session.messages, session.caller);
      session.messages.push({ role: "assistant", content: reply });
      try {
        ws.send(JSON.stringify({ type: "text", token: reply, last: true }));
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
    `🚀 Telefonie-Relay auf :${PORT}\n   Agent: ${AGENT_BASE}\n   Key: ${VOICE_API_KEY ? "✅" : "❌ FEHLT"}  TTS: ${TTS_PROVIDER || "default"}  Host: ${PUBLIC_HOST || "(request-host)"}`
  )
);
