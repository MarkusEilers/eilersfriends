---
name: messaging-audit-broschuere
description: >
  Verwandelt die Ergebnisse eines SalesMade Messaging-/PMM-Audits (Kunden-Fassung,
  interne Analyse, ICP-Soll-Ist-Abgleich) in die druckfertige "Messaging Audit Broschüre"
  im EilersFriends-CI — A4, ~16 Seiten, PwC-Cover mit mittiger Schwinge, Kundenlogo auf
  allen Seiten, generierte Branchen-Motive, flache Score-Charts mit Benchmark-Ticks,
  Karopapier, Handschrift-Notizen und QR-CTA. Nutzt intern IMMER den aktuellsten
  eilersfriends-documentstyler. Trigger: "Messaging Audit Broschüre für {Firma}",
  "Audit-Broschüre bauen", "mach aus dem Audit die Kundenbroschüre", "Audit-Report
  designen", "EFGMA-Report für {Firma}".
---

# Messaging Audit Broschüre (EFGMA-Serie)

Du baust aus einem fertigen Messaging-Audit die übergabefähige Kundenbroschüre.
**Referenz-Implementierung: der OpenTAS-Report EFGMA001** (16 Seiten, 22.07.2026) —
dessen Aufbau ist der verbindliche Standard.

## Schritt 0 · Design-Grundlage laden (Pflicht, zuerst)

Lies IMMER den aktuellsten **eilersfriends-documentstyler**-Skill, bevor Du gestaltest:
`SKILL.md` + `references/css-base.md` + `references/design-guide.md` des installierten
Plugins. Der DocumentStyler ist die einzige Quelle für CSS-Tokens, Typo, Karopapier,
Marker-Annotationen, Full-Bleed-Regeln, Magenta-Bug-Workaround (Verläufe per PIL
einbacken!), Cover-Rezept und die **Kunden-Report-Variante** (Kundenlogo, Curtain,
Kapitel links, Benchmark-Ticks). Bei Konflikt gewinnt der DocumentStyler.

## Schritt 1 · Inhalte einsammeln

Erwartete Inputs (aus dem Skill `salesmade-prospect-audit` oder vom User hochgeladen):

1. **Kunden-Fassung** (`{firma}MessagingAudit.md`) — die Textgrundlage. Wird
   sinngemäß wörtlich übernommen, nicht neu geschrieben.
2. **Interne Analyse** (`{firma}AuditINTERN.md`) — NUR als Quelle für:
   Score-Zeile, Benchmark-Tabelle (Median + Bester je Dimension), Zählbasen.
   Interne Wertungen ("schlimmste WHAT-Momente", Beef-Hebel, Minenfelder,
   vermutete Einwände) erscheinen NIEMALS in der Broschüre.
3. **Soll-Ist-Abgleich** (`{firma}SollIstAbgleich.md`) — Quelle für die Gap-Tabelle.

Fehlt eine Datei: nachfragen. Fehlen Benchmark-Werte je Dimension: generisches
Datenbank-Bestniveau ansetzen und dem User die Annahme nennen.

## Schritt 2 · Assets beschaffen

- **Kundenlogo:** von der Website des Kunden laden (Header-Logo/og:image; bei SVG per
  cairosvg in hochauflösendes PNG wandeln). Wortmarke bevorzugen.
- **Dokument-ID:** `EFGMA` + fortlaufende dreistellige Nummer (EFGMA001 = OpenTAS).
  Beim User erfragen oder aus vorhandenen Reports fortzählen.
- **QR-Code:** `mailto:markus@eilersfriends.com?subject={Firma}%20Sparring`,
  Füllfarbe `--accent-dark`, weiße Kachel im CTA-Band.
- **Bilder generieren** (imagegen, gpt-image-2, quality high, im Hintergrund per
  nohup starten — dauert Minuten):
  - 1× Cover hochkant 1024×1536: Person aus der Branche des Kunden im Vordergrund
    scharf, Branchen-Umgebung als Bokeh ("Cinematic black and white documentary
    photograph, shot on 35mm film, shallow depth of field, film grain, monochrome,
    no text…").
  - 3× quer 1536×1024: Branchen-Szenen für Full-Bleed-Banner (Arbeitsumgebung,
    Detail-Szene, Menschen-Szene).
  - Alle Motive s/w, cinematisch; fertige Motive in die Plugin-Bildbibliothek legen.

## Schritt 3 · Seitenplan (Standard, ~16 Seiten A4)

| Seite | Inhalt |
|---|---|
| 1 | Cover: PwC-Schichtung (s/w-Foto → Schwinge in Akzent, EXAKT mittig, Satzspiegel-Rand links/rechts, hinter der Person → rembg-Cutout → Navy-Verlauf → 20 % Schwarz, alles per PIL eingebacken). EF-Logo weiß oben links; Kundenlogo oben rechts auf quadratischem Curtain, der oben am Dokumentrand abschließt, Logo an Originalposition. Titel (Standard): **"Eure Botschaften in der Außensicht."** — bei Sie-Kunden "Ihre Botschaften in der Außensicht." |
| 2 | Warum dieses Dokument + Score-Überblick: 7 flache Balken (grauer Track, Akzent-Füllung) mit **Benchmark-Ticks (Ink) + Legende mit Benchmark-Namen und -Werten** — Benchmarks nie weglassen |
| 3 | Was uns positiv aufgefallen ist + Full-Bleed-Banner unten. **Auf jedem Banner: Fußzeilen-Overlay in Weiß (Doc-ID / Seitenzahl / Schwinge) — Pflicht, kontrastreich über dem Navy-Verlauf. Achtung Clipping: die Kunden-Report-Seite hat `padding-bottom:0`, der Banner braucht deshalb `margin-bottom:0` (NICHT `-var(--m)` — das schiebt die Fußzeile hinter `overflow:hidden`). Nach dem Render Banner-Fuß im Screenshot prüfen.** |
| 4–9 | Die 7 Dimensionen: je Seite 1–2 Dimensionen. Pro Dimension: Score als 5-Segment-Anzeige (halbe Punkte = halbe Innenfüllung), Fließtext mit kursiven Original-Zitaten, passende Flat-Visualisierung (WHAT/HOW/WHY-Stapelbalken, Kachel-Raster, CTA-Treppe …), Fragen-Box (Tintbox, "Fragen, die wir Ihnen stellen würden", Gedankenstrich-Aufzählung) |
| 10 | Soll-Ist-Gap-Tabelle (EF-Tabellenstil) + Befund-Satz als Akzent-Box in Rasterbreite |
| 11 | Blick über den Zaun + Das Muster (+ Banner oder Handschrift-Notiz mit Kernsatz) |
| 12 | Headlines & Hooks nummeriert (Nummern-Spalte in Akzent-Dunkel) + Karopapier "Welche drei probieren Sie zuerst?" |
| 13 | HVCO-Ideen als Tintbox-Stapel mit nummerierten Labels |
| 14–15 | Nächste Schritte: Nummern-Quadrate AUSSERHALB der Boxen (Raster-Regel) + Zeithorizont-Greybox |
| 16 | CTA-Seite: Sparring-Angebot, Quellen (8pt, --n600), Akzent-CTA-Band randabfallend mit QR |

Reihenfolge/Umfang an den Inhalt anpassen — die Dramaturgie (Warum → Positiv →
Befunde → Einordnung → Chancen → Schritte → Tür) bleibt.

## Schritt 4 · Regeln, die Reports zuverlässig gut machen

- Kopfzeile Folgeseiten: Kapitel-Eyebrow LINKS, Kundenlogo RECHTS (optisch mittig zur
  Eyebrow, `top:~0.8mm` Ausgleich), KEIN "Eilers+Friends"-Schriftzug; erste Überschrift
  mit Respektabstand (`.pagehead{margin-bottom:13mm}`).
- Fußzeile: Dokument-ID links · `NN / NN` mittig · Schwinge rechts. Auf Banner-Seiten
  weiß im Bild.
- Eine Akzentfarbe pro Dokument (EF-Reports: Cyan-Welt). Kundenfarben nur im Kundenlogo.
- Alle Charts flat: keine Schatten, Verläufe, 3D. Zahlen tabellarisch rechtsbündig.
- Voice: Kein "aber", keine Scheinkontraste, keine Diagnosen — der Audit-Text ist
  bereits voice-geprüft, beim Kürzen nichts Verbotenes einschleppen.
- Interne Inhalte (Beef-Hebel, Einwände, Minenfelder, ungefilterte Wertungen) bleiben
  draußen — im Zweifel weglassen.
- Rendern mit Playwright (`page.pdf`, print_background, Ränder 0), danach JEDE Seite
  per Screenshot prüfen: Überläufe in die Fußzeile, Umbrüche ("70 / %"-Fehler →
  `&#8239;`), Pfeilziele, Bild-Ausschnitte (Gesichter sichtbar!).

## Schritt 5 · Liefern

PDF benennen `{Firma}-Messaging-Audit-{EFGMA-ID}.pdf`, per SendUserFile liefern
(eine Zeile Zusammenfassung). Neue generierte Motive + neue Design-Entscheidungen
danach in den documentstyler zurückspielen (Plugin-Update anbieten).
