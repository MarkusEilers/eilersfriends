/**
 * Pre-Send-Validation für Email-Templates.
 * 
 * Wenn ein Template {{variable}} enthält, das NICHT in den variables aufgelöst
 * werden kann, wird die Mail markiert statt gesendet — und der Admin
 * bekommt eine Notification, damit er manuell korrigieren kann.
 */

export interface ValidationResult {
  ok: boolean
  output: string
  missing: string[]
}

/**
 * Rendert ein Template wie renderTemplate(), aber gibt zusätzlich an,
 * welche Variablen NICHT aufgelöst werden konnten.
 *
 * Variablen werden aus dem Format {{varName}} extrahiert.
 * Eine Variable gilt als "missing" wenn:
 *   - sie nicht im variables-Object steht
 *   - oder ein leerer String ist
 */
export function validateAndRender(template: string, variables: Record<string, string | undefined | null>): ValidationResult {
  const missing: string[] = []
  const output = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = variables[key]
    if (v === undefined || v === null || v === '') {
      if (!missing.includes(key)) missing.push(key)
      return `{{${key}}}` // keep placeholder visible in output
    }
    return String(v)
  })
  return { ok: missing.length === 0, output, missing }
}

/**
 * Wendet validateAndRender auf Subject + Body an und gibt back, ob alle
 * Variablen aufgelöst werden konnten + welche fehlen.
 */
export function validateEmailParts(
  parts: { subject: string; html: string; text?: string },
  variables: Record<string, string | undefined | null>,
): { ok: boolean; missing: string[]; rendered: { subject: string; html: string; text?: string } } {
  const s = validateAndRender(parts.subject, variables)
  const h = validateAndRender(parts.html, variables)
  const t = parts.text ? validateAndRender(parts.text, variables) : null
  const missing = Array.from(new Set([...s.missing, ...h.missing, ...(t?.missing ?? [])]))
  return {
    ok: missing.length === 0,
    missing,
    rendered: {
      subject: s.output,
      html: h.output,
      text: t?.output,
    },
  }
}
