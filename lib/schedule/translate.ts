// Auto-Übersetzung von Event-Typ Name+Beschreibung (DE-Basis) nach EN+ES via Claude.
// Best-effort: ohne Key oder bei Fehler -> null (Save läuft trotzdem durch).
type Tr = Record<string, { name?: string; description?: string }>

export async function translateEventType(name: string, description: string): Promise<Tr | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !name.trim()) return null
  const model = process.env.VOICE_AGENT_MODEL || 'claude-haiku-4-5'
  const sys = 'Du übersetzt kurze Kalender-Termin-Typen aus dem Deutschen. Eigennamen (SalesMade, Academy, Personennamen) bleiben unverändert. Ton natürlich, knapp. Antworte NUR mit JSON.'
  const user = `Übersetze folgenden Termin-Typ ins Englische (en) und Spanische (es).
NAME: ${name}
BESCHREIBUNG: ${description || '(leer)'}
Antworte exakt als JSON: {"en":{"name":"...","description":"..."},"es":{"name":"...","description":"..."}}. Leere Beschreibung -> "".`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 500, system: sys, messages: [{ role: 'user', content: user }] }),
    })
    const data = await res.json()
    if (!res.ok) return null
    const text: string = Array.isArray(data?.content) ? data.content.filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('') : ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return null
    const parsed = JSON.parse(m[0]) as Tr
    const out: Tr = {}
    for (const loc of ['en', 'es']) {
      const v = parsed[loc]
      if (v && typeof v.name === 'string') out[loc] = { name: v.name, description: typeof v.description === 'string' ? v.description : '' }
    }
    return Object.keys(out).length ? out : null
  } catch { return null }
}
