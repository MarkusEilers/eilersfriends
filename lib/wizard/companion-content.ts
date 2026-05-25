/**
 * Companion content per wizard step — Hook, Warum, Wie, AI-Help.
 * Quelle: print-step-anatomies (uploads/01-08_*.md) konsolidiert.
 */

export interface StepCompanion {
  key: string
  hook: string
  why: string
  how: string
  ai: string
}

export const STEP_COMPANIONS: Record<string, StepCompanion> = {
  '01-beef-radar': {
      "key": "01-beef-radar",
      "hook": "Du verkaufst Features. Der Kunde kauft Effekte. Beef-Radar uebersetzt das eine ins andere — auf einer Karte mit fünf Zeilen.",
      "why": "Ein Angebot ohne Beef-Radar klingt nach allen anderen Angeboten in der Inbox Deines Kunden. Er kann es nicht unterscheiden, nicht weitererzaehlen, nicht im Vorstandsraum verteidigen. Wenn ein CFO in die Runde fragt „Was bringt uns das konkret?\", entscheidet sich der Deal nicht am Vertrieb, sondern an der Substanz Deines Angebots.",
      "how": "Wir gehen die Top-5 Bausteine Deines Angebots durch. Pro Baustein vier Felder: WAS (das Feature), WIE (direkter Effekt + Wellen-Effekt im Workflow), WARUM (messbarer Impact mit Zahl). Wenn Du den Effekt nicht in einem Satz sagen kannst, gehoert der Baustein neu gedacht oder raus.",
      "ai": "Die AI nimmt Deine Angebots-Beschreibung + ICP + Preisspanne und schlaegt 5-9 Karten in den drei Spalten vor — mit konkreten Zahlen und Wellen-Effekten. Du editierst direkt. „Suggest More\" appendet weitere Karten, ohne Dein Eingegebenes zu überschreiben."
  },
  '02-doppelschmerz': {
      "key": "02-doppelschmerz",
      "hook": "Heute-Probleme machen Dein Angebot relevant. Morgen-Probleme machen es strategisch. Strategische Angebote haben einen anderen Preis als Pflaster.",
      "why": "Die meisten B2B-Angebote loesen Heute-Probleme. Genau das macht sie austauschbar. Wenn Du parallel das morgen-Problem zeigst, das in 12-24 Monaten kommt — Regulatorik, Marktverschiebung, Tech-Shift — wirst Du vom Pflaster zur Strecke. Strecken werden seltener verglichen und seltener vom Wettbewerber angegriffen.",
      "how": "3-5 Heute-Schmerzen sammeln, jeden mit Topic + Reality. 2-3 Morgen-Probleme, jeden mit Trigger + Zeitfenster. Beides auf einer Seite, miteinander verlinkt — jeder Heute-Schmerz optional an ein Morgen-Problem gekoppelt.",
      "ai": "Die AI nimmt Dein Angebot + den Branchen-Kontext und schlaegt beide Listen vor — fokussiert auf belegte Trends, nicht auf Marketing-Floskeln. Bullshit-Detector blinkt, wenn der Trigger zu vage ist („steigende Anforderungen\" reicht nicht)."
  },
  '03-sichtbarer-pfad': {
      "key": "03-sichtbarer-pfad",
      "hook": "Sobald Dein Kunde den Weg sehen kann, schrumpft die Entscheidung. Er schaut nicht mehr auf den Berg — er schaut auf den ersten Schritt.",
      "why": "Ohne Pfad muss Dein Kunde Dir vertrauen. Das ist ein hoher Preis. Mit Pfad muss er nur den Plan vorlegen — und der Plan verkauft weiter, wenn Du nicht im Raum bist. Genau das willst Du: Angebote, die sich im Vorstand selbst verteidigen.",
      "how": "3 bis 5 benannte Phasen, jede mit Input, Output, Dauer in Wochen. Naming-Regel: gleiche Grammatik, gleiche Silbenanzahl, im Slack-Chat teilbar — „Aufraeumen · Aufstellen · Abliefern\". Drei Woerter, eine Reise.",
      "ai": "Die AI nimmt Dein Angebot + Starting-Pain + End-Goal und schlaegt Phasen-Namen mit gleicher Grammatik vor. Du editierst direkt — die Phasen-Namen sind Dein wichtigster Hebel und werden am haeufigsten iteriert."
  },
  '04-phasen-währung': {
      "key": "04-phasen-währung",
      "hook": "Pricing wird gegen Realist verteidigt. Garantie gegen Pessimist. Optimist ist Up-Side, kein Versprechen. Drei Zahlen pro Phase, eine Tabelle.",
      "why": "Aus „wir helfen Ihnen\" wird „in Phase 2 verschieben wir die Annahmequote um 12 Punkte — gemessen Woche 8\". Der Unterschied ist nicht Marketing — der Unterschied ist Verteidigbarkeit. Verteidigbare Zahlen werden im Vorstand uebernommen. Marketing-Zahlen werden vom CFO zerlegt.",
      "how": "Pro Phase aus Schritt 3 eine Hauptwährung. Baseline (wo der Kunde heute steht) + Drei-Punkt-Korridor (Pessimist / Realist / Optimist) + Mess-Zeitpunkt (Woche X Review). Optional 1-2 Sekundaer-Währungen pro Phase.",
      "ai": "Die AI nimmt die Phasen aus Schritt 3 + Deine Branchen-Baselines und schlaegt für jede Phase eine Hauptwährung mit realistischen Korridoren vor — angekoppelt an Methodik, nicht an Wunsch-Denken."
  },
  '05-beweis-stapel': {
      "key": "05-beweis-stapel",
      "hook": "Eine Hypothese ohne Methodik ist eine Marketing-Floskel mit Zahl. Eine Hypothese mit Methodik wird im Vorstand uebernommen.",
      "why": "Beweise sind die Spur, die Dein Kunde zur Vorstandstür mitnimmt. Ohne sie kann er Deinen Pitch nicht weitererzaehlen. Mit ihr traegt sich Dein Angebot selbst — auch wenn Du nicht im Raum bist. Plus: Mindestens 2 aus A oder B im Top-3 (kein „bis zu\"-Spielraum, sondern echte Belege).",
      "how": "3 bis 7 Beweise nach Klassen: A=Named Customer, B=Customer-Avg, C=Hypothese mit Methodik, D=Branchen-Benchmark, E=Testimonial. Jeden mit Quelle, Datum, und — bei Hypothesen — Rechen-Methodik (z.B. „3 FTE × 4h/Wo × 47 Wo × 90 €/h\").",
      "ai": "Die AI nimmt Deine Phasen + Währungen + Customer-Cases und baut den Stapel vor — sortiert nach Klasse, mit Methodik-Vorschlaegen für Hypothesen. Du editierst und ergaenzt."
  },
  '06-booster': {
      "key": "06-booster",
      "hook": "Wenn jemand fragt „geht da nicht was am Preis?\", antwortest Du nicht mit %, sondern mit „wir machen Y mit drauf\". Booster sind die Antwort auf den Preis-Druck.",
      "why": "Booster loesen ein angrenzendes Problem, das der Kunde im Pitch nicht erwartet hat. Echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts. Bonus ist nicht „mehr für gleichen Preis\" — Bonus ist „zweites Problem geloest, mit €-Anker und Margin-Schutz\". Damit haeltst Du Pricing-Power stabil.",
      "how": "1-3 Booster, pro Booster: Name + wahrgenommener Wert in € + echter Lieferaufwand + Anker (was triggered den Booster im Pitch). Beispiel: Pre-Kickoff Audit-Workshop, Wert 4.500 €, Aufwand halber Tag (sowieso in Woche 1 gemacht).",
      "ai": "Die AI nimmt Dein Angebot + Margin-Ziele und schlaegt 2-3 Booster vor — fokussiert auf Sachen, die Du schon hast aber noch nicht als Booster verpackst. Hidden value, low effort."
  },
  '07-wort-garantie': {
      "key": "07-wort-garantie",
      "hook": "Wenn Du beim Aufschreiben Deiner Garantie zögerst, ist die Garantie zu gross — oder Dein Pfad zu schwach. Beides ist Diagnose, kein Versagen.",
      "why": "Eine Wort-Garantie oeffnet Türen, die Pricing nicht oeffnet. CFOs, Procurement, neue Stakeholder suchen Risiko-Reduktion. „100 % Zufriedenheits-Garantie\" ist ein Marketing-Schwur. „Wenn Phase 2 die Annahmequote nicht um 8 Punkte hebt, laeuft Phase 3 ohne Rechnung\" ist ein Verkäufer-Versprechen — angeklemmt an Phase und Währung aus Schritten 3+4.",
      "how": "Typ (Refund / Office-Hours / Continuation) + Trigger-Bedingung + Konsequenz + Liefer-Anker (welche Phase und welche Währung tragen sie) + Espresso-Test bestanden (kannst Du sie beim Espresso aussprechen ohne Marketing-Sound?).",
      "ai": "Die AI nimmt Deine Phasen + Währungen + Risiko-Profil und schlaegt 1-2 Garantie-Optionen vor — kalibriert gegen den Pessimist-Korridor, damit Du sie tatsaechlich verteidigen kannst."
  },
  '08-letzten-20-prozent': {
      "key": "08-letzten-20-prozent",
      "hook": "Die letzten 20 % entscheiden, ob Dein Angebot wahrgenommen wird oder verklebt. Drei Mikro-Entscheidungen — Name, Headline, CTA — die aus dem Substanz-Stapel der Schritte 1-7 ein lesbares Angebot machen.",
      "why": "Espresso-Test (Slack, Espresso, Google, Domain, 3-Jahre) muss mindestens 4 von 5 bestehen, sonst hat Dein Angebot keine Erinnerungs-Spur. Naming ist Ringen, kein Genie-Blitz — wir iterieren, bis der Test sitzt.",
      "how": "3 Name-Optionen mit Stil-Variation („[Substantiv] für [Branche]\" / „[Verb]-[Substantiv]\" / „[Adjektiv] [Substantiv]\") + Espresso-Test-Score (0-5) + Empfehlung markieren. 2-3 Headline-Optionen. 1 klarer CTA für den nächsten Mikro-Schritt des Kunden.",
      "ai": "Die AI nimmt ALLE Antworten aus Schritten 1-7 als Kontext und liefert 3 Name-Optionen + 3 Headlines + 1 CTA — kalibriert auf Deinen ICP und Deine Beweise. Du iterierst, bis der Espresso-Test bei 4/5 sitzt."
  },

}

export function getCompanion(stepKey: string): StepCompanion | null {
  return STEP_COMPANIONS[stepKey] ?? null
}
