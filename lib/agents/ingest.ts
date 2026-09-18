import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MATERIAL, type MaterialDef } from './material'
import { upsertPack } from './knowledge'

/**
 * Das Skill-Material in die Wissensdatenbank uebernehmen.
 *
 * Nichts wird umgeschrieben. Die Dateien werden an ihren eigenen Ueberschriften
 * zerlegt, damit ein Baustein einzeln waehlbar ist — eine Vorlage, ein Hook,
 * ein Sound-Marker. Dateien, die nur als Ganzes einen Sinn ergeben (das
 * Kernregelwerk, die Verbotsliste, eine Rollenbeschreibung), bleiben ganz.
 *
 * Der Lauf ist idempotent: jedes Paket wird ersetzt, nicht ergaenzt. Ein
 * zweiter Aufruf aendert nichts, ein geaenderter Dateiinhalt schon.
 */

const DIR = join(process.cwd(), 'lib', 'agents', 'material')

export interface Stueck {
  key: string; title: string; body: string; tags: string[]; weight: number
}

/** Aus „### A3 · Der-leise-Unterschied" wird „a3-der-leise-unterschied". */
function slug(s: string, fallback: string): string {
  const v = s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return v || fallback
}

/**
 * Eine Datei in Bausteine zerlegen.
 *
 * `###` ist der Baustein, `##` der Abschnitt darueber, `#` der Titel der Datei.
 * Der Abschnitt wandert als Schlagwort mit, damit die Auswahl spaeter weiss,
 * dass „A3" ein Beobachtungs-Hook ist und „D7" ein Konflikt-Hook.
 */
export function zerlege(text: string, def: MaterialDef): Stueck[] {
  const lines = text.split('\n')

  // Nicht jede Datei baut drei Ebenen. Wo es keine `###` gibt, ist `##` der
  // Baustein — sonst faellt eine Datei wie die Vosler-Formelsammlung komplett
  // durch, weil ihre fuenfzig Formeln alle auf Ebene zwei stehen.
  const tief = lines.some((l) => /^#{3,4}\s+/.test(l))
  const reBaustein = tief ? /^#{3,4}\s+(.+)$/ : /^##\s+(.+)$/
  const reAbschnitt = tief ? /^##\s+(.+)$/ : /^(?!)/
  const out: Stueck[] = []
  let abschnitt = ''
  let cur: { title: string; lines: string[] } | null = null
  const seen = new Set<string>()

  const push = () => {
    if (!cur) return
    const body = cur.lines.join('\n').trim()
    if (body.length < 30) { cur = null; return }
    let key = slug(cur.title, `t${out.length + 1}`)
    while (seen.has(key)) key = `${key}-${out.length + 1}`
    seen.add(key)
    out.push({
      key, title: cur.title, body,
      tags: [...def.tags, ...(abschnitt ? [slug(abschnitt, 'abschnitt')] : [])],
      weight: def.weight ?? 50,
    })
    cur = null
  }

  for (const line of lines) {
    const h3 = reBaustein.exec(line)
    const h2 = reAbschnitt.exec(line)
    if (h3) { push(); cur = { title: h3[1].trim(), lines: [] }; continue }
    if (h2) { push(); abschnitt = h2[1].trim(); continue }
    if (/^#\s+/.test(line)) continue
    if (cur) cur.lines.push(line)
  }
  push()
  return out
}

/** Der Vorspann einer Datei — alles vor der ersten Unterueberschrift. */
function vorspann(text: string): string {
  const i = text.search(/^#{2,4}\s+/m)
  return (i < 0 ? text : text.slice(0, i)).replace(/^#\s+.*$/m, '').trim()
}

export interface IngestReport {
  packs: number; items: number
  dateien: Array<{ file: string; pack: string; stuecke: number }>
  fehler: string[]
}

export async function ingestMaterial(): Promise<IngestReport> {
  // Nach Paket buendeln: mehrere Dateien duerfen sich eines teilen, und
  // `replace` darf dann nur beim ersten greifen.
  const byPack = new Map<string, MaterialDef[]>()
  for (const d of MATERIAL) {
    const list = byPack.get(d.pack) ?? []
    list.push(d); byPack.set(d.pack, list)
  }

  const report: IngestReport = { packs: 0, items: 0, dateien: [], fehler: [] }

  for (const [pack, defs] of byPack) {
    const items: Stueck[] = []
    for (const def of defs) {
      let text: string
      try {
        text = readFileSync(join(DIR, def.file), 'utf8')
      } catch {
        report.fehler.push(`${def.file} nicht lesbar`)
        continue
      }

      if (def.whole) {
        items.push({
          key: slug(def.file.replace(/\.md$/, ''), 'ganz'),
          title: def.name, body: text.trim(), tags: def.tags, weight: def.weight ?? 50,
        })
        report.dateien.push({ file: def.file, pack, stuecke: 1 })
        continue
      }

      // Der Vorspann traegt oft die Gebrauchsanweisung („Verwendung: jede
      // Formel ist template-faehig…"). Ohne ihn liest sich ein Baustein wie
      // ein Zitat ohne Quelle.
      const kopf = vorspann(text)
      if (kopf.length > 80) {
        items.push({
          key: slug(`${def.file}-vorspann`, 'vorspann'),
          title: `${def.name} — wie es zu lesen ist`,
          body: kopf, tags: [...def.tags, 'vorspann'], weight: (def.weight ?? 50) + 20,
        })
      }
      const stuecke = zerlege(text, def)
      items.push(...stuecke)
      report.dateien.push({ file: def.file, pack, stuecke: stuecke.length })
    }

    if (!items.length) continue
    const first = defs[0]
    await upsertPack({
      key: pack, kind: first.kind, name: first.name,
      description: defs.map((d) => d.description).filter(Boolean).join(' · ') || null,
      replace: true,
      items: items.map((i) => ({
        key: i.key, title: i.title, body: i.body, tags: i.tags, weight: i.weight,
      })),
    })
    report.packs++
    report.items += items.length
  }

  return report
}
