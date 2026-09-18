# HVCO Follow-Up · WhatsApp / SMS Sequences

**Mai 2026 · Welle 2.5 · Permission-First-Design · DSGVO-konform**

WhatsApp und SMS sind in B2B-HVCO-Follow-Ups die schärfsten Kanäle — und die mit dem höchsten Risiko, wenn sie falsch eingesetzt werden. Dieses File definiert, wann sie laufen, welche Touch-Codes verfügbar sind und welche Anti-Patterns absolut tabu sind.

**Framework-Referenz:** `03_Frameworks/suby-fletcher-magic-lantern.md`

---

## 1. Permission · Pflicht-Bedingungen

WhatsApp/SMS läuft NUR, wenn ALLE drei Bedingungen erfüllt sind:

1. **Telefonnummer optional im HVCO-Formular** erfragt (nicht Pflichtfeld).
2. **Separates Opt-In-Häkchen** für "Ich möchte zu diesem Playbook 1-2 kurze Nachrichten per WhatsApp/SMS erhalten. Jederzeit per STOP abbestellbar."
3. **Aktive Einwilligung** durch Häkchen-Setzen.

Wenn nur eine Bedingung fehlt: Kanal komplett aus der Sequenz. Kein Workaround. Kein "Wir haben die Nummer ja eh". Kein "1x ist sicher okay". DSGVO Art. 7, CASL §6, TCPA. Bußgeld-Risiko in 5- bis 6-stelligen Bereichen.

**Soft-Opt-In-Variante (für bestehende Kunden):** Wenn der Lead bereits Kunde war oder ein vorheriges WhatsApp-Gespräch initiiert hat, darf der Channel ohne neues Opt-In genutzt werden — aber nur in dem geschäftlichen Kontext, den er kennt.

---

## 2. Frequenz-Disziplin

| Sequenz-Variante | Max. WhatsApp/SMS-Touches |
|---|---|
| Sprint (5/7d) | 1 (an Tag 3 PM) |
| Standard (7/14d) | 1-2 (Tag 3 + optional Tag 11) |
| Long-Game (12/30d) | 2 (Tag 5 + Tag 22) |

**Niemals:**
- Zwei WhatsApp/SMS in derselben 48-Stunden-Periode
- WhatsApp/SMS am Wochenende, an Feiertagen, vor 8:00 oder nach 18:00 Empfänger-Zeit
- WhatsApp/SMS in der ersten 24 Stunden nach Download (zu früh, wirkt wie Stalking)

---

## 3. Length-Disziplin

- **SMS**: max. 160 Zeichen (1 Segment). Wenn mehr nötig: kürzen.
- **WhatsApp**: max. 350 Zeichen. Länger kostet Reply-Rate.
- **Kein Link-Shortener** (TinyURL, bit.ly). Die wirken wie Spam. Stattdessen: eigene Subdomain (z.B. `audit.celero.one`).

---

## 4. Was WhatsApp/SMS NICHT trägt

- Story-Beats (das ist Email-Aufgabe)
- Pitch oder Verkauf
- Mehrere Fragen
- Mehrere CTAs
- Markenname am Anfang (wirkt wie Marketing-Bot)
- Emoji-Reihen (max. 1 Emoji wenn überhaupt, im B2B-Default: keiner)

---

## 5. Templates · Sprint-Sequenz (1 WhatsApp/SMS-Touch)

### ML-WA-S1 · Sprint Tag 3 PM — Ping-Brücke

**WhatsApp-Variante (350 Zeichen):**
```
~Vorname~, Markus hier.

Kurze Frage zum Playbook: Hast Du Seite 4 schon gelesen?
Die eine Beobachtung dort entscheidet, ob die anderen 25 Seiten
für Euch funktionieren.

Wenn ja: was war Dein erster Gedanke?
Wenn nein: kein Stress. Ist auch im Playbook-PDF Seite 4.

STOP, falls keine weiteren Nachrichten gewünscht.
```
(327 Zeichen)

**SMS-Variante (160 Zeichen):**
```
~Vorname~, kurze Frage:
Hast Du Seite 4 im Playbook schon
gelesen? Die eine Beobachtung
dort entscheidet alles.
STOP=keine weiteren. -Markus
```
(157 Zeichen)

**Beat:** ML-3 Epiphany (Mini-Trigger zum Lesen) · **Zweck:** Re-Aktivierung des Playbook-Downloads (typisch 35-45% lesen das PDF nie ohne Push)

---

## 6. Templates · Standard-Sequenz (1-2 WhatsApp/SMS-Touches)

### ML-WA-D1 · Standard Tag 3 — Ping-Brücke (gleich wie ML-WA-S1)

Identisch zum Sprint-Touch oben. Wirkt nach Email-Touches 1 + 2 als Cross-Channel-Brücke.

### ML-WA-D2 · Standard Tag 11 (optional) — Audit-Reminder

**WhatsApp-Variante:**
```
~Vorname~, eine Notiz von Markus.

Im Newsletter heute habe ich Dir ein 30-Min-Audit angeboten
(kein Pitch, kein Funnel). 3 Slots noch diese Woche offen.

Wenn passt: audit.celero.one
Wenn nicht: ignorier diese Nachricht, ist okay.

STOP=keine weiteren.
```
(298 Zeichen)

**SMS-Variante:**
```
~Vorname~, 3 Audit-Slots
diese Woche offen. 30 Min,
kein Pitch. audit.celero.one
Ignorier wenn nicht passt.
STOP=Schluss. -Markus
```
(155 Zeichen)

**Beat:** ML-5 Soft-CTA (Audit-Reminder) · **Zweck:** Verstärkt Email-Touch 6, fängt die ab, die Email-Inbox am Tag 11 nicht aktiv lesen.

---

## 7. Templates · Long-Game-Sequenz (2 WhatsApp/SMS-Touches)

### ML-WA-L1 · Long-Game Tag 5 — Question-Hook

**WhatsApp-Variante:**
```
~Vorname~, Markus hier.

Eine Frage, die ich gerade in mehreren Erst-Diagnosen stelle:
Welche Software habt Ihr im Einsatz, die das Execution-Problem
lösen sollte — und es trotzdem nicht löst?

Eine Zeile reicht. Bekommst dafür im Gegenzug einen Insider-
Brief mit Eurem System eingeordnet.

STOP=keine weiteren.
```
(338 Zeichen)

**SMS-Variante:**
```
~Vorname~, kurze Frage:
Welche Software soll bei Euch
Execution lösen, tut's nicht?
Antwort eine Zeile, Du bekommst
Insider-Brief. STOP=Schluss.
```
(159 Zeichen)

**Beat:** ML-3 Epiphany (Dialog-Phase) · **Zweck:** Cross-Channel-Verstärkung von Email-Touch 5 (Reader-Question), höhere Reply-Rate als Email allein.

---

### ML-WA-L2 · Long-Game Tag 22 — Social-Proof-Ping

**WhatsApp-Variante:**
```
~Vorname~, eine Sache zum Audit.

Hannah, Personalleiterin in Eurer Branche, hat nach 30 Min
142.000 € Re-Disposition pro Quartal entdeckt. Hat niemand
in ihrer Org vorher gesehen.

Wenn Du Deine Zahl wissen willst: audit.celero.one
Wenn nicht: ignorier, ist okay.

STOP=keine weiteren.
```
(345 Zeichen)

**SMS-Variante:**
```
~Vorname~, eine Zahl:
142.000 € pro Quartal Re-Disp.
hat Personalleiterin nach 30 Min
Audit entdeckt. Deine? audit.celero.one
STOP=Schluss. -Markus
```
(160 Zeichen)

**Beat:** ML-5 Soft-Push mit Social Proof · **Zweck:** Verstärkt Email-Touch 9, fängt die Audit-Buchung in der zweiten Sequenz-Hälfte ab.

---

## 8. Anti-Patterns · was diese Templates NIE sagen

- **"Hi, ich hoffe diese Nachricht erreicht Sie gut"** (Cold-Mail-Klischee, kostet 80% Reply auf WhatsApp)
- **"Schnelle Frage:"** (Kennedy-Hallmark, jeder erkennt es)
- **"Hattest Du Zeit, das Playbook zu lesen?"** (impliziert Pflicht, klassisches Just-Checking-In)
- **"Wollte mich mal melden..."** (Berater-Floskel, sofortiger Vertrauensverlust)
- **"Aufmerksam machen auf..."** (überflüssig, zu förmlich für WhatsApp)
- **Mehrere Fragen in einer Message** (kostet Reply-Rate exponentiell)
- **Calendly-Link in WhatsApp ohne Vorwarnung** (wirkt wie Spam-Bot)
- **Voice-Memos / Sprachnachrichten ohne Opt-In dafür**
- **Status-Updates ("Wir sind jetzt mit X gestartet")** — niemand bestellt das in WhatsApp

---

## 9. Reply-Behandlung (für den User, nicht für den Skill)

Wenn der Lead auf WhatsApp/SMS antwortet:

| Reply-Typ | Was tun |
|---|---|
| "Ja" / "Habe gelesen" / kurze Bestätigung | Innerhalb 4h: 1 Folge-Frage, persönlich, ohne Pitch. |
| Inhaltliche Antwort (sagt etwas Konkretes) | Innerhalb 4h: zurück in Email-Channel wechseln, dort ausführlich antworten. WhatsApp dann nur noch für Termin-Bestätigungen. |
| "STOP" / "Bitte keine weiteren" | Sofort Channel-Opt-Out im CRM markieren. Keine Bestätigung-Message senden (kostet Reply-Counter). Email-Sequenz läuft weiter, WhatsApp ist aus. |
| Calendly-Link wird angeklickt + Termin gebucht | WhatsApp-Sequenz beenden, Termin-Bestätigung kommt aus Calendly + 1 persönliche WhatsApp 24h vor Termin. |

---

## 10. Channel-Switching-Logik (für Skill)

Der Skill empfiehlt WhatsApp/SMS-Touches **nur dann**, wenn:

1. User bestätigt: "Wir haben Opt-In für Messaging-Channel"
2. User bestätigt: "Wir haben CRM-Integration, die STOP-Replies trackt"
3. HVCO-Typ ist nicht Top-of-Funnel-Whitepaper (zu früh in der Customer-Journey)

Wenn eine der drei Bedingungen "Nein": Skill liefert reine Email-Sequenz und sagt dem User in einem Satz: "WhatsApp/SMS-Touches habe ich aus der Sequenz genommen — Permission/CRM/HVCO-Stage erfüllt nicht alle drei Voraussetzungen."

---

## 11. Wartung

Bei Anpassungen an Permission-Regeln (DSGVO-Updates, TCPA, CASL): zuerst dieses File aktualisieren, dann Framework-File `suby-fletcher-magic-lantern.md` Section 6.
