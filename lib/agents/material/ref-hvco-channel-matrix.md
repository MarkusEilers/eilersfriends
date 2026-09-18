# HVCO Channel-Matrix · Sequenz × Touch × Channel

**Mai 2026 · Welle 2.5 · Quick-Reference für den Skill**

Diese Matrix ist die Lookup-Tabelle, mit der der Skill pro Sequenz-Variante entscheidet: **Welcher Channel an welchem Tag mit welchem Beat-Code?**

Framework-Details: `knowledge/suby-fletcher-magic-lantern.md` · Templates: `knowledge/hvco-email-sequences.md`, `knowledge/hvco-whatsapp-sms-sequences.md`, `knowledge/hvco-linkedin-dm-sequences.md`

---

## SPRINT · 5 Touches / 7 Tage

| Touch | Tag | Channel | Beat | Template-Code | Pflicht/Optional |
|---|---|---|---|---|---|
| 1 | 0 (sofort) | Email | 1 · Setup | ML-S1 | Pflicht |
| 2 | 1 AM | Email | 2 · Backstory | ML-S2 | Pflicht |
| 3 | 3 PM | WhatsApp/SMS | 3 · Epiphany-Ping | ML-WA-S1 | Optional (nur bei Opt-In) — sonst Email-Variante ML-S3-E |
| 4 | 5 AM | Email | 4 · Hidden Benefit + Soft-CTA | ML-S4 | Pflicht |
| 5 | 7 AM | Email + LinkedIn-DM | 5 · Zoom-Out | ML-S5 + ML-LI-1 Variante A | Email Pflicht, LinkedIn optional |

**Channel-Mix Default:** 4 Email + 1 WhatsApp + 1 LinkedIn-DM
**Channel-Mix Minimum:** 5 Email (wenn keine Side-Channel-Permission)

---

## STANDARD · 7 Touches / 14 Tage · DEFAULT

| Touch | Tag | Channel | Beat | Template-Code | Pflicht/Optional |
|---|---|---|---|---|---|
| 1 | 0 (sofort) | Email | 1 · Setup | ML-D1 | Pflicht |
| 2 | 1 AM | Email | 2 · Backstory | ML-D2 | Pflicht |
| 3 | 3 | WhatsApp/SMS | 3 · Epiphany-Ping | ML-WA-D1 | Optional (nur bei Opt-In) — sonst Email-Variante ML-D3 |
| 4 | 5 | Email | 3 · Epiphany | ML-D4 | Pflicht |
| 5 | 8 | LinkedIn-DM | 3-Sub · Sub-Insight | ML-LI-1 Variante A | Optional (nur bei Connection) |
| 6 | 11 | Email + optional WhatsApp | 4 · Hidden Benefit | ML-D5 + (optional ML-WA-D2 als Audit-Reminder) | Email Pflicht |
| 7 | 14 | Email | 5 · Zoom-Out | ML-D7 | Pflicht |

Zusatz-Touch in Email zwischen Touch 6 und 7: **ML-D6** (Soft-CTA "30 Minuten") — zählt als Email-Touch innerhalb der Email-Schiene und ist NICHT als eigenständiger Cross-Channel-Touch zu verstehen.

**Channel-Mix Default:** 5-6 Email + 1-2 WhatsApp + 1 LinkedIn-DM
**Channel-Mix Minimum:** 7 Email (wenn keine Side-Channel-Permission)

---

## LONG-GAME · 12 Touches / 30 Tage

| Touch | Tag | Channel | Beat | Template-Code | Pflicht/Optional |
|---|---|---|---|---|---|
| 1 | 0 | Email | 1 · Setup mit Identity-Hook | ML-L1 | Pflicht |
| 2 | 1 | Email | 2 · Backstory (= ML-D2) | ML-L2 (≡ ML-D2) | Pflicht |
| 3 | 3 | Email | 2 · Proof-Schicht | ML-L3 | Pflicht |
| 4 | 5 | Email + optional WhatsApp | 3 · Epiphany (= ML-D4) + optional Question-Hook | ML-L4 (≡ ML-D4) + optional ML-WA-L1 | Email Pflicht |
| 5 | 8 | Email | 3 · Reader-Question | ML-L5 | Pflicht |
| 6 | 11 | Email + LinkedIn-DM | 4 · Hidden Benefit Teil 1 (= ML-D5) + Sub-Insight | ML-L6 (≡ ML-D5) + ML-LI-1 Variante B | Email Pflicht, LinkedIn optional |
| 7 | 15 | Email | 4 · Hidden Benefit Teil 2 | ML-L7 | Pflicht |
| 8 | 19 | Email + LinkedIn-DM | 5 · Soft-CTA (= ML-D6) + Anschluss-Frage | ML-L8 (≡ ML-D6) + ML-LI-2 | Email Pflicht, LinkedIn optional |
| 9 | 22 | Email + optional WhatsApp | 5 · Social Proof | ML-L9 + optional ML-WA-L2 | Email Pflicht |
| 10 | 25 | Email | 5 · Objection-Handling | ML-L10 | Pflicht |
| 11 | 28 | Email + LinkedIn-DM | 5 · Echte Verknappung + Zoom-Out-Anker | ML-L11 + ML-LI-3 | Email Pflicht, LinkedIn optional |
| 12 | 30 | Email | 5 · Final Zoom-Out (= ML-D7) | ML-L12 (≡ ML-D7) | Pflicht |

**Channel-Mix Default:** 7 Email + 2 WhatsApp + 3 LinkedIn-DM = 12 distinct Touches
**Channel-Mix Minimum:** 12 Email (wenn keine Side-Channel-Permission)

---

## Channel-Activation-Logik (Pseudo-Code für Skill)

```python
def select_channels(sequence_variant, permissions):
    base = {
        "sprint":   ["email"] * 4 + ["whatsapp"] * 1 + ["linkedin"] * 1,
        "standard": ["email"] * 5 + ["whatsapp"] * 1 + ["linkedin"] * 1,
        "long":     ["email"] * 7 + ["whatsapp"] * 2 + ["linkedin"] * 3,
    }

    active = ["email"]  # Email immer aktiv durch HVCO-Opt-In

    if permissions.get("whatsapp_optin"):
        active.append("whatsapp")
    else:
        # WhatsApp-Touches durch Email-Varianten ersetzen
        sequence = upgrade_whatsapp_to_email(base[sequence_variant])

    if permissions.get("linkedin_connection_reach"):
        active.append("linkedin")
    else:
        # LinkedIn-Touches weglassen (Email reicht für letzten Touch)
        sequence = drop_linkedin_touches(base[sequence_variant])

    return sequence, active
```

---

## CTA-Timing (nicht-verhandelbar)

| Sequenz | Erster CTA frühestens an Touch | Härte des CTA bei erstem Auftritt |
|---|---|---|
| Sprint | Touch 4 | Soft ("einfach antworten") |
| Standard | Touch 4 | Soft ("einfach antworten") · Hard erst Touch 6 |
| Long-Game | Touch 8 | Soft · Hard erst Touch 11 |

Wer früher verkauft, hat Spam. Suby/Fletcher beide explizit zur 97/3-Regel: 97% der Audience ist nicht ready im Moment des Downloads. Die Sequenz nurtured. Die ersten 3-7 Touches sind reine Value-Lieferung.

---

## Zoom-Out-Pattern (Markus' Pflicht-Schluss)

Letzter Email-Touch jeder Sequenz endet mit:

```
Das Playbook zeigt Dir Stage 1: [konkrete Outcome aus Stage 1].
Das ist sauber. Das funktioniert.
Aber das ist Stage 1.

Stage 2 ist die, in der [konkretes Folge-Problem].
Stage 3 ist die, in der [konkretes Skalen-Problem].
Stage 4 ist die, in der [konkretes Strategie-Problem].

Wenn Du wissen willst, wie Stage 2 für Eure Situation aussieht:
30 Minuten, kein Pitch. Wenn es nicht passt, nehme ich Dich aus der Liste.
[Audit-Termin buchen]
```

Stage 2-4 müssen vom User im Substrat-Block konkret benannt werden — generische Floskeln ("Stage 2 ist Komplexität") werden vom Skill aktiv abgewiesen.

---

## HVCO-Typ × Variante (Empfehlungs-Matrix)

| HVCO-Typ | Empfohlene Variante | Begründung |
|---|---|---|
| AI-Infused Playbook / Strategy-Brief | Standard (7/14d) | Default · ausreichend Touch-Punkte für Story-Beats |
| Webinar-Replay | Sprint (5/7d) | Hot-State-Audience, Replay-Deadline drückt |
| Free Audit / Scorecard | Sprint (5/7d) | Hochintentioniert, schneller Conversion-Cycle |
| Calculator | Sprint (5/7d) | Hochintentioniert, ROI-Logik motiviert schnellen Action-Step |
| Whitepaper / Industry-Report | Long-Game (12/30d) | Top-of-Funnel, lange Lese-Zyklen |
| Discovery-Call (Pre-Call-Sequenz) | Sprint (5/7d) | Termin ist gesetzt, Sequenz bridge-d zum Call |
| Enterprise-Sales-Lead-Magnet | Long-Game (12/30d) | Decision-Cycle 3-6 Monate, Story-First nötig |
