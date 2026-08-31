/**
 * Die Pruef-Schicht.
 *
 * Drei Rollen, die im Modell seit Anfang angelegt sind und bisher keinen Prompt
 * hatten: Kritik, Voice-Check, Sounding Board. Sie schreiben keine Fakten. Sie
 * schreiben Befunde nach strategy_reviews — und der Mensch entscheidet.
 *
 * Warum das eine eigene Schicht ist und keine zusaetzliche Regel im
 * Fakten-Prompt: Wer schreibt und prueft in einem Durchgang, verteidigt seinen
 * eigenen Text. Zwei Beef-Fassungen sind an Fehlern gescheitert, die ein Pruefer
 * in zwei Saetzen gefunden haette — beim Schreiber selbst standen die Regeln
 * dagegen im Prompt und wurden trotzdem umgangen.
 */

import { getFacts } from './facts'
import { runAgent, type RunResult } from './run'
import { visibleItems } from './items'

/** Die zu pruefenden Fakten als lesbarer Gegenstand. */
export async function renderForReview(
  companyId: string, productId: string | null | undefined, keys: string[],
): Promise<string> {
  const facts = await getFacts(companyId, productId, keys)
  if (!facts.length) return ''
  return facts
    .map((f) => {
      const value = Array.isArray(f.value) ? visibleItems(f.value) : f.value
      return `### ${f.key}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`
    })
    .join('\n\n')
}

/**
 * Einen Pruefer auf ein Fakt-Buendel ansetzen.
 *
 * Der Pruefer bekommt den Gegenstand als Text, nicht als Fakten-Brief — er soll
 * lesen, was dasteht, nicht wissen, wie es zustande kam. Wer die Herleitung
 * kennt, verzeiht das Ergebnis.
 */
export async function review(input: {
  companyId: string; productId?: string | null
  agentKey: 'kritik-fakten' | 'voice-check' | 'sounding-board' | string
  keys?: string[]
  text?: string
  stepKey?: string; stepId?: string | null; userId?: string | null
}): Promise<RunResult & { subject?: string }> {
  const subject = input.text ?? (input.keys?.length
    ? await renderForReview(input.companyId, input.productId, input.keys)
    : '')
  if (!subject.trim()) return { ok: false, error: 'Nichts zu pruefen — weder Text noch belegte Fakten.' }

  const res = await runAgent({
    agentKey: input.agentKey, stepKey: input.stepKey ?? 'pruefung',
    companyId: input.companyId, productId: input.productId ?? null,
    stepId: input.stepId ?? null, userId: input.userId ?? null,
    extraInstruction: subject,
  })
  return { ...res, subject }
}
