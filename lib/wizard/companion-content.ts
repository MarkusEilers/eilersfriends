/**
 * Companion content per wizard step — Hook · Why · How · AI-Help.
 * Voice: observational, non-accusatory, business-savvy (Markus-Voice-Charter).
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
  '01-was-in-die-box': {
      "key": "01-was-in-die-box",
      "hook": "Fünf. Nicht vierzehn. Fünf Bausteine, die das Angebot tragen. Drei werden gemerkt, fünf gehen, sieben ist die Schmerzgrenze.",
      "why": "Typische B2B-Angebote sammeln vierzehn Features. Was im Pitch der Top 5 nicht überlebt, gehört nicht ins Hauptangebot — sondern in den Nachschlag, oder raus. Die Liste der Fünf ist die erste Substanzprüfung: wenn die Schärfe hier fehlt, wird sie in jedem folgenden Schritt fehlen.",
      "how": "Top 5 Bausteine, Services oder Lizenzen. Pro Eintrag: Name (max 4 Worte) + Beschreibung was er LEISTET, nicht was er IST. Workshop, Audit, Library, Channel, Review — konkret. Nicht \"Beratung\", \"Begleitung\", \"Unterstützung\".",
      "ai": "Die AI nimmt das Welcome-Profile (Summary, Value Proposition, Audience) und schlägt Bausteine vor — ausschließlich auf Basis der echten Angebots-Beschreibung, nie generisch. Wenn das Profile zu dünn ist, fragt die AI nach statt zu raten."
  },
  '01-beef-radar': {
      "key": "01-beef-radar",
      "hook": "Typische B2B-Angebote verkaufen Features. Kunden kaufen Effekte. Beef-Radar übersetzt das eine ins andere — auf einer Karte mit fünf Zeilen.",
      "why": "Ein Angebot ohne Beef-Radar klingt nach allen anderen Angeboten in der Inbox. Es lässt sich schwer unterscheiden, schwer weitererzählen, schwer im Vorstandsraum verteidigen. Wenn ein CFO fragt „Was bringt uns das konkret?\", entscheidet das selten der Vertrieb. Eher die Substanz.",
      "how": "Wir gehen die Top-5 Bausteine eines Angebots durch. Pro Baustein vier Felder: WAS (das Feature), WIE (direkter Effekt + Wellen-Effekt im Workflow), WARUM (messbarer Impact mit Zahl). Wenn der Effekt nicht in einem Satz sagbar ist, gehört der Baustein neu gedacht oder raus.",
      "ai": "Die AI nimmt das Welcome-Profile (Angebot, ICP, Branche) und schlägt 5-9 Karten in den drei Spalten vor — mit konkreten Zahlen und Wellen-Effekten. „Suggest More\" appendet weitere Karten, ohne bestehende zu überschreiben."
  },
  '02-doppelschmerz': {
      "key": "02-doppelschmerz",
      "hook": "Heute-Probleme machen Angebote relevant. Morgen-Probleme machen sie strategisch. Strategische Angebote haben einen anderen Preis als Pflaster.",
      "why": "Typische B2B-Angebote adressieren das Heute. Genau das macht sie austauschbar. Wer parallel das Morgen-Problem zeigt — Regulatorik, Marktverschiebung, Tech-Shift — wechselt vom Pflaster zur Strecke. Strecken werden seltener verglichen und seltener vom Wettbewerb angegriffen.",
      "how": "3-5 Heute-Schmerzen sammeln, jeden mit Topic + Reality. 2-3 Morgen-Probleme, jeden mit Trigger + Zeitfenster. Beides auf einer Seite, miteinander verlinkt — jeder Heute-Schmerz optional an ein Morgen-Problem gekoppelt.",
      "ai": "Die AI nimmt das Welcome-Profile + Branchen-Kontext und schlägt beide Listen vor — fokussiert auf belegte Trends, nicht auf Marketing-Floskeln. Bullshit-Detector blinkt, wenn der Trigger zu vage ist („steigende Anforderungen\" reicht nicht)."
  },
  '03-sichtbarer-pfad': {
      "key": "03-sichtbarer-pfad",
      "hook": "Sobald ein Käufer den Weg sehen kann, schrumpft die Entscheidung. Er schaut nicht mehr auf den Berg — er schaut auf den ersten Schritt.",
      "why": "Ohne Pfad muss der Käufer vertrauen. Das ist ein hoher Preis. Mit Pfad muss er nur den Plan vorlegen — und der Plan verkauft weiter, wenn der Anbieter nicht im Raum ist. Genau das wollen wir: Angebote, die sich im Vorstand selbst verteidigen.",
      "how": "3 bis 5 benannte Phasen, jede mit Input, Output, Dauer in Wochen. Naming-Regel: gleiche Grammatik, gleiche Silbenanzahl, im Slack-Chat teilbar — „Aufräumen · Aufstellen · Abliefern\". Drei Wörter, eine Reise.",
      "ai": "Die AI nimmt das Welcome-Profile + Starting-Pain + End-Goal und schlägt Phasen-Namen mit gleicher Grammatik vor. Die Phasen-Namen sind der wichtigste Hebel — werden oft mehrfach iteriert."
  },
  '04-phasen-währung': {
      "key": "04-phasen-währung",
      "hook": "Pricing wird gegen Realist verteidigt. Garantie gegen Pessimist. Optimist ist Up-Side, kein Versprechen. Drei Zahlen pro Phase, eine Tabelle.",
      "why": "Aus „wir helfen Ihnen\" wird „in Phase 2 verschieben wir die Annahmequote um 12 Punkte — gemessen Woche 8\". Der Unterschied ist nicht Marketing — der Unterschied ist Verteidigbarkeit. Verteidigbare Zahlen werden im Vorstand übernommen. Marketing-Zahlen werden vom CFO zerlegt.",
      "how": "Pro Phase aus Schritt 3 eine Hauptwährung. Baseline (wo der Kunde heute steht) + Drei-Punkt-Korridor (Pessimist / Realist / Optimist) + Mess-Zeitpunkt (Woche X Review). Optional 1-2 Sekundär-Währungen pro Phase.",
      "ai": "Die AI nimmt die Phasen aus Schritt 3 + Branchen-Baselines und schlägt für jede Phase eine Hauptwährung mit realistischen Korridoren vor — angekoppelt an Methodik, nicht an Wunsch-Denken."
  },
  '05-beweis-stapel': {
      "key": "05-beweis-stapel",
      "hook": "Eine Hypothese ohne Methodik ist eine Marketing-Floskel mit Zahl. Eine Hypothese mit Methodik wird im Vorstand übernommen.",
      "why": "Beweise sind die Spur, die Käufer zur Vorstandstür mitnehmen. Ohne sie lässt sich der Pitch nicht weitererzählen. Mit ihr trägt sich das Angebot selbst — auch wenn der Anbieter nicht im Raum ist. Mindestens 2 aus A oder B im Top-3 — kein „bis zu\"-Spielraum, sondern echte Belege.",
      "how": "3 bis 7 Beweise nach Klassen: A=Named Customer, B=Customer-Avg, C=Hypothese mit Methodik, D=Branchen-Benchmark, E=Testimonial. Jeden mit Quelle, Datum und — bei Hypothesen — Rechen-Methodik (z.B. „3 FTE × 4h/Wo × 47 Wo × 90 €/h\").",
      "ai": "Die AI nimmt Phasen + Währungen + bekannte Customer-Cases und baut den Stapel vor — sortiert nach Klasse, mit Methodik-Vorschlägen für Hypothesen."
  },
  '06-booster': {
      "key": "06-booster",
      "hook": "Wenn jemand fragt „geht da nicht was am Preis?\", ist die beste Antwort selten ein Rabatt — eher ein Booster mit Anker.",
      "why": "Booster lösen ein angrenzendes Problem, das im Pitch nicht erwartet wurde. Echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts. Bonus ist nicht „mehr für gleichen Preis\" — Bonus ist „zweites Problem gelöst, mit €-Anker und Margin-Schutz\". So bleibt Pricing-Power stabil.",
      "how": "1-3 Booster, pro Booster: Name + wahrgenommener Wert in € + echter Lieferaufwand + Anker (was triggert den Booster im Pitch). Beispiel: Pre-Kickoff Audit-Workshop, Wert 4.500 €, Aufwand halber Tag (sowieso in Woche 1).",
      "ai": "Die AI nimmt das Angebot + Margin-Ziele und schlägt 2-3 Booster vor — fokussiert auf Sachen, die schon da sind aber nicht als Booster verpackt. Hidden value, low effort."
  },
  '07-wort-garantie': {
      "key": "07-wort-garantie",
      "hook": "Wenn beim Aufschreiben der Garantie gezögert wird, ist die Garantie zu groß — oder der Pfad zu schwach. Beides ist Diagnose, kein Versagen.",
      "why": "Eine Wort-Garantie öffnet Türen, die Pricing nicht öffnet. CFOs, Procurement, neue Stakeholder suchen Risiko-Reduktion. „100 % Zufriedenheits-Garantie\" ist ein Marketing-Schwur. „Wenn Phase 2 die Annahmequote nicht um 8 Punkte hebt, läuft Phase 3 ohne Rechnung\" ist ein Verkäufer-Versprechen — angedockt an Phase und Währung aus Schritten 3+4.",
      "how": "Typ (Refund / Office-Hours / Continuation) + Trigger-Bedingung + Konsequenz + Liefer-Anker (welche Phase und welche Währung tragen sie) + Espresso-Test (kann man sie beim Espresso aussprechen ohne Marketing-Sound?).",
      "ai": "Die AI nimmt Phasen + Währungen + Risiko-Profil und schlägt 1-2 Garantie-Optionen vor — kalibriert gegen den Pessimist-Korridor, damit sie tatsächlich verteidigbar bleiben."
  },
  '08-letzten-20-prozent': {
      "key": "08-letzten-20-prozent",
      "hook": "Die letzten 20 % entscheiden, ob ein Angebot wahrgenommen wird oder verklebt. Drei Mikro-Entscheidungen aus dem Substanz-Stapel der Schritte 1-7.",
      "why": "Espresso-Test (Slack, Espresso, Google, Domain, 3-Jahre) muss mindestens 4 von 5 bestehen, sonst hat das Angebot keine Erinnerungs-Spur. Naming ist Ringen, kein Genie-Blitz — wir iterieren, bis der Test sitzt.",
      "how": "3 Name-Optionen mit Stil-Variation („[Substantiv] für [Branche]\" / „[Verb]-[Substantiv]\" / „[Adjektiv] [Substantiv]\") + Espresso-Test-Score (0-5) + Empfehlung markieren. 2-3 Headline-Optionen. 1 klarer CTA für den nächsten Mikro-Schritt.",
      "ai": "Die AI nimmt ALLE Antworten aus Schritten 1-7 als Kontext und liefert 3 Name-Optionen + 3 Headlines + 1 CTA — kalibriert auf ICP und Beweise. Wir iterieren, bis der Espresso-Test bei 4/5 sitzt."
  },

}

export function getCompanion(stepKey: string): StepCompanion | null {
  return STEP_COMPANIONS[stepKey] ?? null
}
