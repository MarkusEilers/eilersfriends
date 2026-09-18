# Decision-Matrix · Plattform × Zweck

Diese Matrix steuert den Skill. Jede Kombination Plattform × Zweck mappt auf: Framework, Länge, Hook-Typ-Empfehlung, CTA-Stärke, Garantie-Bedarf, Template-Pool, Voice-Profile-Routing.

**Stand:** Mai 2026 · Welle 2.5 komplett · 13 Plattformen · 7 Zwecke · 6 Voice-Profile · HVCO-Sub-Flow für Multi-Channel-Sequenzen

---

## Plattform-Map (10 Plattformen, 5 in Welle 1.5/2 ausgebaut)

| Plattform | Primär-Framework | Länge | Voice-Profile primär | Template-File |
|---|---|---|---|---|
| **LinkedIn-Post** | Welsh-3-Akt | 80-220 Wörter | Welsh | `04_Channel-Templates/linkedin-50-templates.md` |
| **Newsletter** | Welsh-3-Akt-Newsletter | 600-900 Wörter | Welsh + Graziosi + Kern | `04_Channel-Templates/newsletter-50-templates.md` |
| **Cold-E-Mail** | Braun-Poke-the-Bear | <90 Wörter | Braun | `05_Master-Prompts/03-cold-email-DE.md` + `07_Voice-Profiles/02-braun-voice-profile.md` |
| **YouTube-Shorts** | Hook → Problem → Solution → CTA · Loop-Ending | 20-35 Sek (70-130 Wörter Skript) | Kern (Pattern-Interrupt) + Braun (Permission) | `04_Channel-Templates/youtube-shorts-50-templates.md` |
| **Instagram-Reels** | Hook → Problem → Solution → CTA · 4 Hook-Mechanismen | 15-30 Sek (Virality) / 30-90 Sek (Story) | Kern + Braun + Graziosi | `04_Channel-Templates/instagram-reels-50-templates.md` |
| **X/Twitter-Thread** | 8-12 Tweets · 3-Akt-Arc (Setup, Argument, Payoff) | <250 Zeichen/Tweet | Welsh + Kern (Cliffhanger) | `04_Channel-Templates/twitter-threads-50-templates.md` |
| **Blog-Artikel** | Inverted Pyramid · AI-extractable Sections · Question-Format-H2s | 1.400-3.500 Wörter (je nach Typ) | Welsh + Kennedy (Long-Form) | `04_Channel-Templates/blog-50-templates.md` |
| **LinkedIn-Carousel** | Hook-Slide + 6-10 Content-Slides + CTA-Slide · PAS/AIDA/BAB | 7-12 Slides | Welsh + Kennedy (Stack) | `04_Channel-Templates/carousels-50-templates.md` |
| **Long-Form / Sales-Letter** | Kennedy-Magnetic-Close (9-Teile) | 1.500-3.500 Wörter | Kennedy + Kern | `03_Frameworks/kennedy-magnetic-close.md` + `07_Voice-Profiles/05-kennedy-voice-profile.md` |
| **Sales-Call-Discovery / Ad-Copy** | Braun-Permission-Frame / Kennedy-Drei-Headline-Stack | je nach Format | Braun / Kennedy | (Welle 3) |
| **HVCO-Email-FollowUp** | Suby-Fletcher Magic Lantern (5 Beats) | 90-230 Wörter pro Touch je nach Variante | Welsh + Graziosi + Kennedy + Braun je Beat | `08_HVCO-FollowUp/hvco-email-sequences.md` + `05_Master-Prompts/04-hvco-followup-DE.md` |
| **HVCO-WhatsApp-SMS** | Magic Lantern (Ping-Brücke) | SMS ≤160 / WhatsApp ≤350 Zeichen | Braun (Permission-First) | `08_HVCO-FollowUp/hvco-whatsapp-sms-sequences.md` |
| **HVCO-LinkedIn-DM** | Magic Lantern (Connection-First) | 130-180 Wörter pro DM | Braun + Welsh (Reader-Frage) | `08_HVCO-FollowUp/hvco-linkedin-dm-sequences.md` |

---

## Zweck-Map (7 Zwecke)

| Zweck | Hook-Typ-Empfehlung | CTA-Stärke | Garantie-Bedarf | Risiko-Toleranz |
|---|---|---|---|---|
| **Awareness / Reichweite** | Beobachtung, Konflikt | Soft (Konversation) | nein | mittel |
| **Engagement / Conversation** | Frage, Story | Medium (Mini-Handlung) | nein | hoch |
| **Lead-Gen** | Werkzeug, Konkrete-Zahl, Liste | Medium-Hard (Opt-In ohne Druck) | optional | mittel |
| **Conversion** | Story, Konflikt, Werkzeug | Hard (Handlung, Ort, Deadline) | ja (Risk-Reversal) | niedrig |
| **Authority / Trust** | Beobachtung, Lehre, Mentales Modell | Soft-to-Medium | nein | mittel |
| **Education / Onboarding** | Liste, Drei-Sätze, Werkzeug-Tutorial | Soft (nächster Lern-Schritt) | nein | niedrig |
| **Retention / Reaktivierung** | Story, Reader-Frage, Update | Medium | optional | mittel |

---

## Plattform × Zweck — die wichtigsten Kombinationen

### LinkedIn-Post

| × Awareness | Welsh-3-Akt · Beobachtung/Konflikt-Hook · Soft-CTA · Template-Pool: A1-A10, B11-B20 |
| × Engagement | Welsh-3-Akt · Frage/Story-Hook · Medium-CTA · Template-Pool: D29-D36, E37-E41 |
| × Lead-Gen | Welsh-3-Akt · Konkrete-Zahl/Liste · Medium-Hard-CTA · Template-Pool: C21-C28, F42-F46 |
| × Conversion | Welsh-3-Akt + verkürzte Kennedy-Logik · Story/Konkrete-Zahl · Hard-CTA · Template-Pool: D29-D32, C23-C26, WL-10 |
| × Authority | Welsh-3-Akt · Beobachtung/Lehre · Soft-Medium · Template-Pool: G47-G50, WL-6 (Identity), FK-3 (Reframe) |

### Newsletter

| × Authority | Welsh-3-Akt-NL · Beobachtung / Mentales Modell · Template-Pool: N1-N10, N41-N45 |
| × Engagement | Welsh-3-Akt-NL · Reader-Frage / Drei-Sätze · Template-Pool: N36-N40, N46-N50 |
| × Lead-Gen | Welsh-3-Akt-NL · Werkzeug-Tutorial (Kern-RIA-Mechanik FK-2) · Template-Pool: N11-N20 |
| × Conversion | Welsh-3-Akt-NL + Kennedy-Risk-Reversal-Schluss · Geschichte-mit-Lehre (DG-1) · Template-Pool: N21-N28 |
| × Retention | Welsh-3-Akt-NL · Update-Format · Template-Pool: N46-N50 |

### Cold-E-Mail

| × Lead-Gen | Braun-Poke-the-Bear · neutrale Frage zu verstecktem Schmerz · Permission-to-Opt-Out · JB-1, JB-2 |
| × Conversion | Braun + zweiter Touch · konkrete Diagnose-Einladung · JB-4 (How-it-Works-Mid) |
| × Reaktivierung | Braun-Detach · Re-Engagement-Mail · JB-6 |

### YouTube-Shorts

| × Awareness | Pattern-Interrupt / Mid-Action-Start · Loop-Ending · Template-Pool: YT-1 bis YT-10 |
| × Engagement | Frage-Hook · Comment-Prompt-CTA · Template-Pool: YT-37 bis YT-41 |
| × Lead-Gen | Werkzeug-Tutorial · "DM für Vorlage"-CTA · Template-Pool: YT-42 bis YT-46 |
| × Authority | Confession / Pivot · Counter-Intuitive · Template-Pool: YT-21 bis YT-36 |
| × Conversion | Numbered-Promise + harter CTA + Link-in-Description · Template-Pool: YT-11 bis YT-20 |

### Instagram-Reels

| × Awareness | Tension/Threat-Hook · Save-CTA · Template-Pool: IG-1 bis IG-12 |
| × Engagement | Identity-Hook · Reply-Prompt · Template-Pool: IG-35 bis IG-44 |
| × Lead-Gen | Shortcut/Promise-Hook · DM-CTA · Template-Pool: IG-13 bis IG-24 |
| × Authority | Proof/Specificity-Hook · Newsletter-Link · Template-Pool: IG-25 bis IG-34 |
| × Conversion | Identity + harter Link-in-Bio-CTA · Template-Pool: IG-35 + IG-39 + IG-41 |

### X/Twitter-Thread

| × Awareness | Counter-intuitive Hook · Reply-CTA · Template-Pool: TW-1 bis TW-10 |
| × Engagement | Question-Hook · Reply mit Mini-Aktion · Template-Pool: TW-39 bis TW-46 |
| × Lead-Gen | Specific-Outcome + Mystery · Bookmark-Bait · Template-Pool: TW-11 bis TW-20 |
| × Authority | Confession/Pivot · Data-Heavy · Template-Pool: TW-21 bis TW-28, TW-48 (Data-Heavy) |
| × Conversion | Numbered Promise + harter CTA im letzten Tweet · Template-Pool: TW-29 bis TW-38 |

### Blog-Artikel

| × Awareness | Opinion / Thought-Leadership · Template-Pool: BLOG-41 bis BLOG-46 |
| × Authority | Pillar-Page / Definitive-Guide · Template-Pool: BLOG-1 bis BLOG-8 |
| × Lead-Gen | How-To / Step-by-Step · Lead-Magnet-CTA · Template-Pool: BLOG-9 bis BLOG-18 |
| × Education | Listicle / FAQ · Template-Pool: BLOG-19 bis BLOG-28, BLOG-47 bis BLOG-50 |
| × Conversion | Case-Study / Comparison · "Diagnose-Call"-CTA · Template-Pool: BLOG-29 bis BLOG-40 |

### LinkedIn-Carousel

| × Awareness | Mythbuster / Counter-Intuitive · Save-CTA · Template-Pool: CAR-37 bis CAR-42 |
| × Engagement | Quote / Insight-Heavy · Comment-Prompt · Template-Pool: CAR-47 bis CAR-50 |
| × Lead-Gen | Tutorial / How-To · DM-CTA · Template-Pool: CAR-1 bis CAR-12 |
| × Authority | Case-Study / Deep-Dive · Newsletter-Link · Template-Pool: CAR-43 bis CAR-46 |
| × Conversion | PAS oder BAB + harter CTA · Template-Pool: CAR-23 bis CAR-36 |

### Long-Form / Sales-Letter

| × Conversion | Kennedy-Magnetic-Close (komplettes 9-Teile-Skelett) · Risk-Reversal Pflicht · DK-1 bis DK-8 + Kern-Backstory FK-7 |
| × Lead-Gen | Kern-Results-in-Advance (FK-2) + harter Werkzeug-Lead-Magnet | 

### HVCO-Follow-Up (Multi-Channel)

| × Lead-Gen | Sprint (5/7d) · Email-only · für Calculator/Scorecard mit hohem Intent · Beats 1-5 komprimiert · ML-S1 bis ML-S5 |
| × Conversion | Standard (7/14d, Default) · Email + WhatsApp + LinkedIn · für AI-Playbooks/Whitepaper · alle 5 Beats vollständig · ML-D1 bis ML-D7 |
| × Authority | Long-Game (12/30d) · Email + 2 WhatsApp + 3 LinkedIn · für Top-of-Funnel-HVCO + Enterprise-Cycles · Beats mehrfach geschichtet · ML-L1 bis ML-L12 |
| × Retention | Standard mit Re-Engagement-Variante · Zoom-Out-CTA auf Quartals-Brief statt Audit-Call |

---

## Voice-Profile-Routing (Priorität bei Plattform-Auswahl)

Wenn der User eine Plattform-Zweck-Combo wählt, prüft der Skill **zuerst** das matchende Voice-Profile auf einen passenden Template-Code, **dann** die generischen Templates aus dem 50er-Pool.

| Plattform | Primär-Voice-Profile | Sekundär | Routing-Logik |
|---|---|---|---|
| LinkedIn-Post | Welsh (`01-welsh-voice-profile.md`) | Kern (FK-1, FK-3 für Authority) | Welsh-Cluster zuerst (WL-1 bis WL-10), dann LinkedIn-50 |
| Newsletter | Welsh + Graziosi (DG-1 Anchor-Story) + Kern (FK-2 RIA) | — | Bei Lead-Gen: Kern RIA. Bei Conversion: Graziosi-Anchor + Kennedy-Close. Sonst: Welsh-3-Akt. |
| Cold-E-Mail | Braun (`02-braun-voice-profile.md`) | — | Immer Braun. JB-1 bis JB-8 abdecken alle Cold-Mail-Use-Cases. |
| YouTube-Shorts | Kern (Pattern-Interrupt FK-1) + Braun (Permission/Detach) | Welsh (Listicle für Numbered-Promise) | Bei Mid-Action: Kern. Bei Numbered: Welsh-Style. Bei Confession: Kern/Graziosi. |
| Instagram-Reels | Kern + Braun + Graziosi | Welsh (Identity-Hook) | Bei Tension/Threat: Kern. Bei Shortcut/Promise: Welsh + Kern. Bei Proof: alle. Bei Identity: Welsh + Graziosi (DG-6). |
| X/Twitter-Thread | Welsh (Listicle-Disziplin) + Kern (Cliffhanger-Stacking FK-5) | Kennedy (für Data-Heavy/Bookmark-Bait) | Hook-Tweet primär Welsh, Cliffhanger zwischen Tweets primär Kern. |
| Blog | Welsh (Klarheit) + Kennedy (für Long-Form-Sales-Letter-Adaption) | Kern (für Case-Studies mit Story) | Pillar: Welsh-Disziplin. Sales-Page-artiger Blog: Kennedy. Case-Study: Graziosi + Kern. |
| LinkedIn-Carousel | Welsh + Kennedy (Stack-Logik für PAS/AIDA/BAB) | — | Hook-Slide primär Welsh. Content-Slides primär Welsh/Kennedy. CTA-Slide primär Welsh. |
| Long-Form / Sales-Letter | Kennedy (`05-kennedy-voice-profile.md`) | Kern (FK-7 Backstory, FK-6 5-Element-Offer) | Komplettes Kennedy-9-Teile-Skelett + Kern-Backstory + Reason-WHY. |

---

## Sprach-Default

- User spricht Deutsch → DE primär, EN auf Wunsch parallel
- User spricht Englisch → EN primär, DE auf Wunsch parallel
- User: Mischung → nachfragen
- "Komplett zweisprachig" = beide Sprachen vollständig, NICHT übersetzt — adaptiert

---

## Skill-Decision-Logik (Pseudo-Code für die AI)

```
1. read voice-charter (DE+EN), forbidden-words, self-check
2. ask language → save as lang
3. ask platform → save as platform
4. ask purpose → save as purpose
5. lookup matrix[platform][purpose] → framework, hook_type, cta_strength, length, template_pool, voice_profile_routing
6. read framework_file
7. read voice_profile_file(s) per routing
8. read template_pool_file
9. ask substrate (audience, topic, observation, desired_outcome)
10. propose 3 hooks: 
    - 1st preference: voice-profile templates (WL-/JB-/FK-/DG-/DK-)
    - 2nd preference: matching 50er-template
    - 3rd preference: custom hook from hook-bank-master.md
11. user picks hook
12. propose 2-3 CTAs matching cta_strength
13. user picks CTA
14. draft using framework + voice profile + hook + cta + substrate + voice-charter
15. run 9-point self-check silently
16. if any "no" → revise, re-check
17. deliver: headline/subject + body + 2-3 voice-polish hints + variant offer
```

---

## Wartung

- Neue Plattform: Zeile in Plattform-Map ergänzen + Framework + Template-File anlegen
- Neuer Zweck: Spalte in Zweck-Map ergänzen
- Performance-Daten aus echten Outputs in Template-Pool-Empfehlungen einspeisen (welche Codes performen, welche nicht)
- Voice-Profile-Routing alle 90 Tage gegenchecken — Performance-Feedback bestimmt Priorität
