# ASK-Engine (Stand 17.11.2026)

Ein Rechenkern, jeder Funnel ist Konfiguration.

- Funnel-Struktur: `lib/ask/funnels/<slug>.ts` + Eintrag in `lib/ask/registry.ts`
- Rechnen nur auf dem Server: `lib/ask/engine.ts` (Stufe = Mittel der Antworten, erste rote Stufe = Engpass Nr. 1)
- Kalibrierung (Schwellen je Stufe): DB `ask_calibration`, Admin `/admin/ask`, ohne Deploy
- Teilnahmen: DB `ask_submissions` (Antworten/Ergebnis im Klartext, Kontakt AES-256-GCM)

## Ablauf
1. `/check/<slug>` — Fragenstrecke (Zwischenstand in sessionStorage `ask:<slug>`)
2. `POST /api/ask/<slug>/submit` — Kurzergebnis sofort, Teilnahme anonym gespeichert, Lead-Scoring `quiz_complete`
3. `POST /api/ask/<slug>/contact` — E-Mail + Firma (+ Mobil optional), Bestätigungs-Mail
4. `GET /api/ask/confirm?t=<token>` — DOI: Kontakt + Firma im CRM, Nachricht an Markus, weiter zum Report
5. `/check/<slug>/report/<token>` — voller Report, Druckfassung über Print-Stylesheet, noindex

Token: 32 Hex (ID) + 24 Zeichen HMAC, ohne Punkt (Pfade mit Punkt umgehen die Middleware).

## Einbinden
Landingpage-Baustein `story_ask_teaser`, Inhalt `{ "funnel": "engpass" }` (optional `headline`, `sub`, `button`).
Antworten aus dem Teaser wandern in den vollen Funnel mit. Vorschau-Seite: LP `ask-demo` (Entwurf).

## Offen (Welle 2)
Mail-Folgen nach dem Report, Benchmark aus echten Teilnahmen (ab 15 je Gruppe), vorausgefüllte Links, echtes PDF.
