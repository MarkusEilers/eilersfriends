import Link from 'next/link'
import { buildPageTree, LANGS, type PageNode, type LangState } from '@/lib/pagetree/tree'

export const dynamic = 'force-dynamic'

const AREAS: { key: PageNode['area']; label: string; hint: string }[] = [
  { key: 'public', label: 'Öffentliche Seiten', hint: 'Website, Landingpages, Checkout, Blog' },
  { key: 'portal', label: 'Kundenbereich', hint: 'nur mit Login' },
  { key: 'system', label: 'System & Weiterleitungen', hint: 'Login, Token-Links, Bestätigungen' },
]
const KIND: Record<PageNode['kind'], string> = { code: 'Code', lp: 'Landingpage', blog: 'Blog' }
const fmt = (s: string | null) => s ? new Date(s).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

function Chip({ lang, s }: { lang: string; s: LangState }) {
  const cls = s.state === 'full' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s.state === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : s.state === 'missing' ? 'bg-red-50 text-red-600 border-red-200'
    : 'bg-gray-50 text-gray-400 border-gray-200'
  const title = s.state === 'full' ? 'vollständig' : s.state === 'partial' ? `teilweise (${s.pct} %)` : s.state === 'missing' ? 'fehlt' : 'nicht übersetzbar (Text fest im Code)'
  return <span title={title} className={`inline-flex min-w-[42px] justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${cls}`}>{lang.toUpperCase()}{s.state === 'partial' ? ` ${s.pct}` : ''}</span>
}

/** Page-Tree: alle Seiten mit Version, letzter Änderung und Sprachstand. */
export default async function PageTreePage() {
  const { nodes, generatedAt, deployedSha } = await buildPageTree()
  const gaps = nodes.filter((n) => n.area === 'public' && (n.status ?? 'published') === 'published' && (['en', 'es'] as const).some((l) => n.langs[l].state === 'partial' || n.langs[l].state === 'missing'))
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Page-Tree</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        Alle Seiten mit Version, letzter Änderung und Sprachstand. Landingpages und Blog protokollieren jede Bearbeitung (eine Version je Bearbeitungssitzung).
        Code-Seiten zählen ihre Änderungen aus der Git-Historie (Stand {fmt(generatedAt)}{deployedSha ? ` · live: ${deployedSha}` : ''}).
        Öffentliche Sprachen: DE, EN, ES. RU ist angelegt, aber nicht freigeschaltet.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <Chip lang="de" s={{ state: 'full' }} /> vollständig <Chip lang="en" s={{ state: 'partial', pct: 60 }} /> teilweise <Chip lang="es" s={{ state: 'missing' }} /> fehlt <Chip lang="ru" s={{ state: 'code' }} /> Text fest im Code
      </div>
      {gaps.length > 0 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"><b>{gaps.length} veröffentlichte Seiten</b> sind in EN oder ES noch nicht vollständig.</p>}

      {AREAS.map((a) => {
        const list = nodes.filter((n) => n.area === a.key)
        if (!list.length) return null
        return (
          <section key={a.key} className="mt-8">
            <h2 className="text-lg font-bold text-gray-900">{a.label} <span className="text-sm font-normal text-gray-400">· {a.hint} · {list.length}</span></h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr><th className="p-3">Seite</th><th className="p-3">Art</th><th className="p-3">Version</th><th className="p-3">Letzte Änderung</th><th className="p-3">Sprachen</th></tr>
                </thead>
                <tbody>
                  {list.map((n) => {
                    const segs = n.path.split('/').filter(Boolean)
                    const depth = Math.max(0, segs.length - 1)
                    return (
                      <tr key={n.kind + n.path + n.title} className="border-t border-gray-100 align-top">
                        <td className="p-3">
                          <div style={{ paddingLeft: depth * 18 }}>
                            <div className="flex items-baseline gap-2">
                              {depth > 0 && <span className="text-gray-300">└</span>}
                              <span className="font-mono text-[13px] font-semibold text-gray-900">/{segs[segs.length - 1] ?? ''}</span>
                              {n.status && n.status !== 'published' && <span className="rounded bg-gray-100 px-1.5 text-[10px] font-bold uppercase text-gray-500">{n.status}</span>}
                            </div>
                            <div className="text-xs text-gray-500">{n.title !== n.path ? n.title : ''}{n.note ? <span className="text-gray-400"> · {n.note}</span> : null}</div>
                            <div className="mt-1 flex gap-3 text-xs">
                              {n.viewHref && <a href={n.viewHref} target="_blank" className="font-semibold text-[#1A5FD4]">ansehen ↗</a>}
                              {n.editHref && <Link href={n.editHref} className="font-semibold text-[#1A5FD4]">bearbeiten</Link>}
                              <span className="font-mono text-gray-400">{n.path}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-gray-600">{KIND[n.kind]}</td>
                        <td className="p-3">
                          <details>
                            <summary className="cursor-pointer font-semibold">v{n.version}</summary>
                            <ul className="mt-2 space-y-1 text-xs text-gray-600">
                              {n.history.length ? n.history.slice(0, 6).map((h, i) => (
                                <li key={i}><span className="font-mono text-gray-400">{typeof h.version === 'number' ? `v${h.version}` : h.version}</span> · {fmt(h.date)}{h.who ? ` · ${h.who}` : ''}<div className="text-gray-500">{h.what}</div></li>
                              )) : <li className="text-gray-400">Noch keine protokollierte Änderung.</li>}
                            </ul>
                          </details>
                        </td>
                        <td className="p-3 whitespace-nowrap text-gray-600">{fmt(n.lastChange)}</td>
                        <td className="p-3"><div className="flex flex-wrap gap-1">{LANGS.map((l) => <Chip key={l} lang={l} s={n.langs[l]} />)}</div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
