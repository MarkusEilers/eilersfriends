/**
 * enrichSystemPrompt — appends a voice-profile snippet and optional framework
 * context to the base system prompt. Pattern adapted from GTM Engine.
 *
 * Voice files are embedded as TS strings (no FS access in serverless lambdas).
 */

const MARKUS_VOICE = `\nVOICE — Markus Eilers (Empathisch · Business-Savvy · Curiosity statt Verdikt):
- Pattern: Du gehst selbst rein bevor du beim Leser landest. "Bei mir hat es sich angefühlt, als ob..."
- Wit gerne auf Branchen-Kosten, nie auf Personen-Kosten.
- Zahlen mit Methodik. "Spart bis zu" ohne Methodik ist Marketing-Floskel.
- Verboten: "ehrliche Rechnung", "nahtlos", "ganzheitlich", "synergetisch", "Stellschrauben".
- Headline-Regel: Aussage + Konsequenz in einer Zeile. Keine Frage-Headlines, keine "Wie X dich Y bringt".
- Wenn etwas pessimistisch klingt: zeig die Tür raus im selben Satz.\n`

const WELSH_VOICE = `\nVOICE — Justin Welsh (Dense + Witty + Direct):
- Hook in den ersten 7 Worten oder es ist tot.
- 1 Punkt pro Zeile. Punkte trennen, nicht Kommas.
- Aufzählungen mit Parallelstruktur.\n`

const BRAUN_VOICE = `\nVOICE — Jeremy Braun (Poke-the-Bear · Permission-First):
- Frage zuerst, bevor du behauptest.
- Permission-to-Opt-Out in der Eröffnung.
- Neutrale Poke-Frage: Ja UND Nein müssen plausibel sein.\n`

const KENNEDY_VOICE = `\nVOICE — Dan Kennedy (Magnetic Close · Reason-Why):
- Risk-Reversal echt, nicht kosmetisch.
- Reason-WHY für jede Forderung.
- P.S. trägt eine zweite Headline.\n`

const VOICES: Record<string, string> = {
  markus: MARKUS_VOICE,
  welsh: WELSH_VOICE,
  braun: BRAUN_VOICE,
  kennedy: KENNEDY_VOICE,
}

const BEEF_RADAR_FRAMEWORK = `\nFRAMEWORK — Beef-Radar:
3 Spalten: WHAT (Feature/Baustein), HOW (direkter Effekt + Wellen-Effekt im Workflow), WHY (messbarer Impact mit Zahl).
Idealsetup: pro WHAT mind. 1 HOW und 1 WHY. WHY immer mit Zahl. Wenn der Effekt nicht in einem Satz sagbar — Baustein neu denken oder raus.\n`

const BULLETPROOF_FRAMEWORK = `\nFRAMEWORK — Bulletproof Delivery Plan:
3-5 benannte Phasen, jede mit Input + Output + Dauer (Wochen) + 2-3 Steps.
Naming: gleiche Grammatik, gleiche Silbenanzahl. Beispiel: "Aufräumen · Aufstellen · Abliefern".\n`

const FRAMEWORKS: Record<string, string> = {
  'beef-radar': BEEF_RADAR_FRAMEWORK,
  'bulletproof-delivery': BULLETPROOF_FRAMEWORK,
}

export function enrichSystemPrompt(
  base: string,
  opts: { voice?: string; framework?: string; locale?: string } = {},
): string {
  let result = base
  if (opts.voice && VOICES[opts.voice]) result += VOICES[opts.voice]
  if (opts.framework && FRAMEWORKS[opts.framework]) result += FRAMEWORKS[opts.framework]
  if (opts.locale === 'en') {
    result += '\nWrite the response in English.'
  } else {
    result += '\nSchreib die Antwort auf Deutsch.'
  }
  return result
}
