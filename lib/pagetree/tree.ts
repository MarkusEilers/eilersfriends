import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { publicPath } from '@/lib/lp/public-path'
import { pageLogs, type LogEntry } from './log'
import { ensureLpI18n } from '@/lib/lp/i18n'
import { translationModes, defaultMode, type TranslateMode } from './settings'
import manifest from './code-pages.json'
import de from '@/lib/i18n/messages/de.json'
import en from '@/lib/i18n/messages/en.json'
import es from '@/lib/i18n/messages/es.json'
import ru from '@/lib/i18n/messages/ru.json'

/**
 * Page-Tree: jede Seite der Website mit Version, letzter Änderung und Sprachstand.
 * Quellen: Code-Seiten (Manifest aus der Git-Historie + Übersetzungsdateien),
 * Landingpages (Datenbank + Änderungsprotokoll), Blog-Beiträge (Datenbank).
 */

export const LANGS = ['de', 'en', 'es', 'ru'] as const
export type Lang = (typeof LANGS)[number]
export type LangState = { state: 'full' | 'partial' | 'missing' | 'code' | 'stale'; pct?: number; stale?: number; missing?: number }

export interface PageNode {
  path: string
  title: string
  kind: 'code' | 'lp' | 'blog'
  area: 'public' | 'portal' | 'system'
  status?: string
  version: number
  lastChange: string | null
  langs: Record<Lang, LangState>
  editHref?: string
  pageId?: string
  mode?: TranslateMode
  viewHref?: string
  history: { version: number | string; date: string; who?: string | null; what: string }[]
  note?: string
}

type Json = unknown
function flat(d: Json, p = '', o: Record<string, unknown> = {}) {
  if (d && typeof d === 'object' && !Array.isArray(d)) for (const [k, v] of Object.entries(d)) flat(v, p ? `${p}.${k}` : k, o)
  else if (Array.isArray(d)) d.forEach((v, i) => flat(v, `${p}[${i}]`, o))
  else o[p] = d
  return o
}
const FLAT: Record<Lang, Record<string, unknown>> = { de: flat(de), en: flat(en), es: flat(es), ru: flat(ru) }

function nsCoverage(ns: string[], lang: Lang): LangState {
  const keys = Object.keys(FLAT.de).filter((k) => ns.some((n) => k === n || k.startsWith(n + '.') || k.startsWith(n + '[')))
  if (!keys.length) return { state: 'code' }
  if (lang === 'de') return { state: 'full', pct: 100 }
  let ok = 0
  for (const k of keys) {
    const v = FLAT[lang][k], src = FLAT.de[k]
    if (src === '' || src === null) { ok++; continue }                          // auch im Deutschen leer
    if (v === undefined || v === null) continue
    if (v === '' && String(src).length > 6) continue                             // kurze Einheiten („Uhr“) dürfen leer sein
    // gleich wie Deutsch und erkennbar deutscher Text → gilt als nicht übersetzt (Namen und Fachbegriffe zählen als übersetzt)
    if (typeof src === 'string' && v === src && /[äöüß]|\b(und|der|die|das|mit|für|nicht|ist|zu|Sie|Du|Ihr|Euer)\b/.test(src)) continue
    ok++
  }
  const pct = Math.round((ok / keys.length) * 100)
  return { state: pct >= 97 ? 'full' : pct === 0 ? 'missing' : 'partial', pct }
}

type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

const SYSTEM = [/^\/auth/, /\[token\]/, /^\/verbunden/, /^\/checkout\/success/, /^\/salesmade$/, /^\/blog\/moderation/]
function areaOf(group: string, route: string): PageNode['area'] {
  if (group === 'portal') return 'portal'
  if (SYSTEM.some((re) => re.test(route))) return 'system'
  return 'public'
}
const fromLog = (l: LogEntry[] | undefined) => (l ?? []).map((e) => ({ version: e.version, date: e.changedAt, who: e.actor, what: e.notes.join(' · ') }))

export async function buildPageTree(): Promise<{ nodes: PageNode[]; generatedAt: string; deployedSha: string | null }> {
  const logs = await pageLogs().catch(() => new Map<string, LogEntry[]>())
  const nodes: PageNode[] = []

  // Landingpages — Übersetzung gilt je Sektion als aktuell, wenn sie nach der letzten Änderung des Grundtexts entstand
  await ensureLpI18n()
  const modes = await translationModes().catch(() => new Map<string, TranslateMode>())
  const has = (l: string) => sql.raw(`(s.content_i18n ? '${l}' AND s.content_i18n->'${l}' <> '{}'::jsonb)`)
  const fresh = (l: string) => sql.raw(`(COALESCE((s.i18n_changed_at->>'${l}')::timestamptz, 'epoch'::timestamptz) + interval '1 second' >= s.content_changed_at)`)
  const lp = rows(await db.execute(sql`
    SELECT p.id, p.slug, p.title, p.status, p.locale, p.template_key, greatest(p.updated_at, max(s.updated_at)) AS last,
      count(s.id) FILTER (WHERE s.is_visible) AS vis,
      count(s.id) FILTER (WHERE s.is_visible AND ${has('de')}) AS de_has, count(s.id) FILTER (WHERE s.is_visible AND ${has('de')} AND ${fresh('de')}) AS de_ok,
      count(s.id) FILTER (WHERE s.is_visible AND ${has('en')}) AS en_has, count(s.id) FILTER (WHERE s.is_visible AND ${has('en')} AND ${fresh('en')}) AS en_ok,
      count(s.id) FILTER (WHERE s.is_visible AND ${has('es')}) AS es_has, count(s.id) FILTER (WHERE s.is_visible AND ${has('es')} AND ${fresh('es')}) AS es_ok,
      count(s.id) FILTER (WHERE s.is_visible AND ${has('ru')}) AS ru_has, count(s.id) FILTER (WHERE s.is_visible AND ${has('ru')} AND ${fresh('ru')}) AS ru_ok
    FROM landing_pages p LEFT JOIN landing_page_sections s ON s.landing_page_id = p.id
    GROUP BY p.id ORDER BY p.slug`).catch(() => []))
  const lpPaths = new Set<string>()
  for (const r of lp) {
    const path = publicPath(String(r.slug), r.template_key as string | null)
    lpPaths.add(path)
    const vis = Number(r.vis) || 0, base = String(r.locale || 'de') as Lang
    const langs = {} as Record<Lang, LangState>
    for (const l of LANGS) {
      if (l === base) { langs[l] = { state: 'full', pct: 100 }; continue }
      const hasN = Number(r[`${l}_has`]) || 0, ok = Number(r[`${l}_ok`]) || 0
      const pct = vis ? Math.round((ok / vis) * 100) : 0
      const stale = hasN - ok, missing = vis - hasN
      langs[l] = { state: ok >= vis && vis > 0 ? 'full' : stale > 0 && missing === 0 ? 'stale' : ok === 0 && stale === 0 ? 'missing' : 'partial', pct, stale, missing }
    }
    const log = logs.get(`lp:${r.id}`)
    nodes.push({
      path, title: String(r.title), kind: 'lp', area: 'public', status: String(r.status),
      version: log?.[0]?.version ?? 1, lastChange: log?.[0]?.changedAt ?? (r.last ? String(r.last) : null), langs,
      editHref: `/admin/landing-pages/${r.id}`, viewHref: r.status === 'published' ? path : `${path}?preview=1`,
      pageId: String(r.id), mode: modes.get(`lp:${r.id}`) ?? defaultMode(String(r.status)),
      history: fromLog(log), note: base !== 'de' ? `Grundtext ${base.toUpperCase()}` : undefined,
    })
  }

  // Code-Seiten
  for (const p of manifest.pages) {
    if (lpPaths.has(p.route)) {
      const n = nodes.find((x) => x.path === p.route)
      if (n) n.note = [n.note, `Seitenrahmen im Code v${p.version}`].filter(Boolean).join(' · ')
      continue
    }
    const langs = {} as Record<Lang, LangState>
    for (const l of LANGS) langs[l] = p.namespaces.length ? nsCoverage(p.namespaces, l) : (l === 'de' ? { state: 'full', pct: 100 } : { state: 'code' })
    if (p.lpBacked && !p.namespaces.length) for (const l of LANGS) langs[l] = { state: 'full', pct: 100 }
    nodes.push({
      path: p.route, title: p.title ?? p.route, kind: 'code', area: areaOf(p.group, p.route),
      version: p.version, lastChange: p.lastChange, langs,
      viewHref: p.route.includes('[') ? undefined : p.route,
      history: p.history.map((h) => ({ version: h.sha, date: h.date, what: h.msg })),
      note: p.lpBacked ? 'Inhalte aus dem Landingpage-System' : p.namespaces.length ? undefined : 'Texte fest im Code (nur Deutsch)',
    })
  }

  // Blog
  const posts = rows(await db.execute(sql`
    SELECT b.id, b.slug, b.title, b.status, b.locale, b.updated_at,
      (SELECT array_agg(DISTINCT t.locale) FROM blog_posts t WHERE t.translation_of = b.id) AS tr
    FROM blog_posts b WHERE b.translation_of IS NULL ORDER BY b.updated_at DESC`).catch(() => []))
  for (const b of posts) {
    const have = new Set<string>([String(b.locale || 'de'), ...((b.tr as string[]) ?? [])])
    const langs = {} as Record<Lang, LangState>
    for (const l of LANGS) langs[l] = have.has(l) ? { state: 'full', pct: 100 } : { state: 'missing', pct: 0 }
    const log = logs.get(`blog:${b.id}`)
    nodes.push({
      path: `/blog/${b.slug}`, title: String(b.title), kind: 'blog', area: 'public', status: String(b.status),
      version: log?.[0]?.version ?? 1, lastChange: log?.[0]?.changedAt ?? String(b.updated_at), langs,
      editHref: `/admin/blog/${b.id}`, viewHref: b.status === 'published' ? `/blog/${b.slug}` : undefined, history: fromLog(log),
    })
  }

  nodes.sort((a, b) => a.path.localeCompare(b.path))
  return { nodes, generatedAt: manifest.generatedAt, deployedSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null }
}
