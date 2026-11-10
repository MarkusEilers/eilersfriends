/**
 * Blog-Text mit Bausteinen. Der Inhalt bleibt Text (Markdown + einfache Bausteine), keine HTML-Seite.
 *
 * Absätze werden durch Leerzeilen getrennt. Bausteine:
 *   ## Zwischenüberschrift            (landet im Inhaltsverzeichnis)
 *   ### Unterüberschrift
 *   ![Bildunterschrift](/pfad/bild.jpg)
 *   - Liste  /  1. Nummerierte Liste
 *   > Zitat
 *   @Name: „Gesagter Satz“            Dialogzeile
 *   ~ Notiz in Handschrift (eigene Stimme)
 *   | Kopf | Kopf |  …                 Tabelle (erste Zeile = Kopf)
 *   :::kurz … :::                      Kasten „Kurz gesagt“
 *   :::fehler … ~ Notiz :::            Gegenbeispiel (orange) mit Handschrift-Notiz
 *   :::zitat … ~ Notiz :::             Großer Satz mit Handschrift-Notiz
 *   :::chat Name | Zeile 2 … :::       Nachrichten-Nachbau; „- “ alte Nachrichten, „> “ hervorgehoben, %Platzhalter% markiert
 *   :::zahl 3.000 | Text … :::         Große Zahl; „raster 3000 1“ zeichnet Kästchen; „24 % | Text“ Kennzahlen, „!1 | Text“ orange
 *   :::vergleich … --- … :::           Zwei Spalten: „Dachzeile | Name“, Text, „- Chip“, „= Ergebnis“; rechte Spalte blau
 *   :::formel Dachzeile … :::          Blauer Merkkasten: „[Teil] + [Teil]“ und „1. Punkt“
 *   :::todo … :::                      Checkliste mit Nummern
 *   :::weiter Dachzeile | /link … :::  Teaser auf den nächsten Beitrag (Titel, Text)
 *   :::glossar … :::                  Randnotiz „Begriff | Erklärung“ (ab xl rechts neben dem vorigen Absatz); {{Begriff}} im Text verweist darauf
 *   :::treppe Dachzeile … :::          Fragen als Treppe: „Ebene | „Frage“ | Notiz“
 *   :::schritte Dachzeile | Zusatz … ::: Blaue nummerierte Karte: „Titel | Text“
 *   :::balken … :::                    Balkenvergleich: „Name | Anzeige | von-bis | *“ (* = blau)
 *   :::kreise … :::                    100er-Punkte: „Anzahl | blau/grau/hell/orange | Legende“, „= 88 % | Text“
 *   :::crm Titel | Meta … :::          CRM-Liste: „| Spalte | … |“, ((Status)) als Pille, „+ Fußzeile“
 *   :::folie Titel | Fuß | 50 / 50 :::  Folienstapel, „~ Notiz“
 *   :::hud 77 % | Quelle … :::         Dunkles Display: Titel, Unterzeile, Zitat
 *   :::gipfel Dachzeile … :::          Stationen als Aufstieg, „! Station“ mit Ampel
 *   :::janein … :::                    Zwei Ausgänge: „JA | Text“, „NEIN | Text“
 *   :::dreieck Mitte … :::             Drei Ecken „Name | Text“
 *   :::funken Dachzeile … :::          Drei Karten „Label | Titel | Text | *“ (* = aktiv)
 *   :::stimmen … :::                   Stimmen „Name | „Satz“ | wie“
 *   :::menschen 1 von 2 | Text … :::   Figurenraster: „raster 20 10“, „7.272 | Befragte“, „quelle …“
 *   :::protokoll Titel … :::           Funk-/Chatprotokoll „01 | „Satz““
 *   :::anteil Dachzeile … :::          Gestapelter Balken „50 | grau/schraffiert/akzent | Text“, „klammer 75 | Text“
 *   :::notiz Dachzeile … :::           Übung: Text, „- Chip“, „? Frage“ = Eingabefeld (bleibt im Browser)
 *   :::fahrplan Dachzeile … :::        Spalten „A | Titel“, „01 | Schritt“, „---“, „vorher | …“, „nachher | …“
 *   :::video ID | Dachzeile … :::      YouTube erst nach Klick: „bild /pfad.jpg“, Titel, Unterzeile, „hinweis …“
 *   „^ Text“ in einem Baustein = Bildunterschrift darunter.
 * Inline: **fett**, ==blau hervorgehoben==, *kursiv*, [Link](url), ((Pille)), {{Begriff}}, %Platzhalter% (nur im Chat).
 */
import { Fragment, type ReactNode } from 'react'
import { VideoEmbed } from './VideoEmbed'
import { NoteInput } from './NoteInput'

const INK = '#0D0D0B'
// Farben über CSS-Variablen, damit Beiträge die Akzentfarbe der Autorin übernehmen (Aljona: Rot)
const BLUE = 'var(--ef-a,#1A5FD4)'
const DEEP = 'var(--ef-d,#124293)'
const TINT = 'var(--ef-t,#E8EFFB)'
const LIGHT = 'var(--ef-l,#CFE0FF)'
const MID = 'var(--ef-m,#8FB0EC)'
const ORANGE = '#FF6A1A'
const MARKER = "'Permanent Marker', cursive"

export const slugifyHeading = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60)

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
/** Inline-Auszeichnung → sicheres HTML */
export function inline(s: string, opts?: { placeholders?: boolean }) {
  let h = esc(s)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^)\s]+)\)/g, '<a href="$2" style="color:var(--ef-a,#1A5FD4);text-decoration:underline">$1</a>')
    .replace(/==(.+?)==/g, `<b style="color:${DEEP};font-weight:700">$1</b>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${INK};font-weight:600">$1</strong>`)
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\(\((.+?)\)\)/g, '<span style="background:var(--ef-t,#E8EFFB);color:var(--ef-d,#124293);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap">$1</span>')
    .replace(/\{\{([^}¦]+)¦([^}]*)\}\}/g, (_m, t: string, d: string) => `<span class="ef-term"${d ? ` title="${d.replace(/"/g, '&quot;')}"` : ''}>${t}</span>`)
  if (opts?.placeholders) h = h.replace(/%([A-Za-z_]+)%/g, '<span style="background:#FFE3D3;color:#C2410C;padding:0 4px;border-radius:4px;font-family:ui-monospace,monospace">%$1%</span>')
  return h
}
const H = ({ s, ph, className, style }: { s: string; ph?: boolean; className?: string; style?: React.CSSProperties }) =>
  <span className={className} style={style} dangerouslySetInnerHTML={{ __html: inline(s, { placeholders: ph }) }} />

type Block =
  | { t: 'h2' | 'h3' | 'p' | 'quote' | 'note'; text: string }
  | { t: 'img'; src: string; alt: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'say'; who: string; text: string }
  | { t: 'table'; rows: string[][] }
  | { t: 'box'; kind: string; arg: string; lines: string[] }

/** Zerlegt den Text in Bausteine. */
export function parseBlocks(content: string): Block[] {
  const out: Block[] = []
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  let para: string[] = []
  const flush = () => {
    if (!para.length) return
    const b = para.join('\n').trim()
    para = []
    if (!b) return
    const ls = b.split('\n')
    if (b.startsWith('## ')) return void out.push({ t: 'h2', text: b.slice(3).trim() })
    if (b.startsWith('### ')) return void out.push({ t: 'h3', text: b.slice(4).trim() })
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(b)
    if (img) return void out.push({ t: 'img', alt: img[1], src: img[2] })
    if (ls.every((l) => /^\s*[-*] /.test(l))) return void out.push({ t: 'ul', items: ls.map((l) => l.replace(/^\s*[-*] /, '')) })
    if (ls.every((l) => /^\s*\d+[.)] /.test(l))) return void out.push({ t: 'ol', items: ls.map((l) => l.replace(/^\s*\d+[.)] /, '')) })
    if (ls.every((l) => l.trim().startsWith('|'))) {
      const rows = ls.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
      return void out.push({ t: 'table', rows })
    }
    if (ls.every((l) => l.startsWith('>'))) return void out.push({ t: 'quote', text: ls.map((l) => l.replace(/^> ?/, '')).join(' ') })
    const say = /^@([^:]{1,40}):\s*([\s\S]+)$/.exec(b)
    if (say) return void out.push({ t: 'say', who: say[1].trim(), text: say[2].trim() })
    if (b.startsWith('~ ')) return void out.push({ t: 'note', text: b.slice(2).trim() })
    out.push({ t: 'p', text: b.replace(/\n/g, ' ') })
  }
  while (i < lines.length) {
    const l = lines[i]
    const m = /^:::(\w+)\s*(.*)$/.exec(l.trim())
    if (m && m[1]) {
      flush()
      const body: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++ }
      i++
      out.push({ t: 'box', kind: m[1].toLowerCase(), arg: m[2].trim(), lines: body })
      continue
    }
    if (!l.trim()) flush(); else para.push(l)
    i++
  }
  flush()
  return out
}

/** Überschriften fürs Inhaltsverzeichnis */
export function headingsOf(content: string | null) {
  return parseBlocks(content ?? '').filter((b) => b.t === 'h2').map((b) => ({ id: slugifyHeading((b as { text: string }).text), text: (b as { text: string }).text }))
}

const Eyebrow = ({ children, color = '#605D5D' }: { children: ReactNode; color?: string }) =>
  <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color }}>{children}</span>
const Caption = ({ text }: { text?: string }) => (text ? <figcaption className="mt-2.5 text-[13px] text-[#605D5D]">{text}</figcaption> : null)
const Note = ({ text, className = '' }: { text: string; className?: string }) =>
  <span className={`my-2 inline-block -rotate-2 text-[20px] leading-snug ${className}`} style={{ fontFamily: MARKER, color: DEEP }}>{text}</span>

function split(lines: string[]) {
  const caption = lines.find((l) => l.startsWith('^ '))?.slice(2).trim()
  const notes = lines.filter((l) => l.startsWith('~ ')).map((l) => l.slice(2).trim())
  const rest = lines.filter((l) => !l.startsWith('^ ') && !l.startsWith('~ '))
  return { caption, notes, rest }
}
const textOf = (ls: string[]) => ls.join(' ').replace(/\s+/g, ' ').trim()

function Box({ b }: { b: Extract<Block, { t: 'box' }> }) {
  const { caption, notes, rest } = split(b.lines)
  const nonEmpty = rest.filter((l) => l.trim())
  switch (b.kind) {
    case 'kurz':
      return (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F3F2F2] px-6 py-6 sm:px-7">
          <Eyebrow color={DEEP}>{b.arg || 'Kurz gesagt'}</Eyebrow>
          <H s={textOf(nonEmpty)} className="text-[18px] leading-[1.6]" style={{ color: INK }} />
        </div>
      )
    case 'fehler':
      return (
        <figure className="m-0">
          <div className="rounded-r-2xl border-l-4 px-6 py-5 text-[17px] leading-[1.6]" style={{ borderColor: ORANGE, background: '#FFF4EE', color: INK }}>
            <H s={textOf(nonEmpty)} />
            {notes.map((n, k) => <div key={k} className="mt-3"><Note text={n} /></div>)}
          </div>
          <Caption text={caption} />
        </figure>
      )
    case 'zitat': {
      // Optional: „:::zitat Dachzeile“, „- Chip“-Zeilen unter dem Satz, ==Hervorhebung== im Satz
      const chips = nonEmpty.filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
      const text = textOf(nonEmpty.filter((l) => !l.startsWith('- ')))
      return (
        <figure className="m-0">
          <div className="my-2 flex flex-col gap-2.5 border-y border-[#EFEDEC] py-7">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            <H s={text} className="text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] sm:text-[28px]" style={{ color: INK }} />
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((ch, k) => <H key={k} s={ch} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ background: TINT, color: DEEP }} />)}
              </div>
            )}
            {notes.map((n, k) => <div key={k} className="mt-4"><Note text={n} /></div>)}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'chat': {
      const [name, sub] = b.arg.split('|').map((s) => s.trim())
      return (
        <figure className="m-0">
          <div className="flex justify-center rounded-2xl bg-[#F4F2EE] p-4 sm:p-7">
            <div className="w-full max-w-[440px] overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,.08)]">
              <div className="flex items-center gap-2.5 border-b border-[#EEE] px-4 py-3.5">
                <span className="h-[34px] w-[34px] rounded-full bg-[#C9C6C3]" />
                <div className="flex flex-col"><span className="text-[14px] font-bold">{name}</span>{sub && <span className="text-[11px] text-[#605D5D]">{sub}</span>}</div>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {nonEmpty.map((l, k) => l.startsWith('> ')
                  ? <H key={k} s={l.slice(2)} ph className="self-start rounded-xl bg-[var(--ef-t,#E8EFFB)] px-3.5 py-2.5 text-[15px]" style={{ color: INK }} />
                  : <H key={k} s={l.replace(/^- /, '')} ph className="self-start rounded-xl bg-[#F3F2F2] px-3 py-2 text-[13px] text-[#9A9796]" />)}
              </div>
            </div>
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'zahl': {
      const [value, label] = b.arg.split('|').map((s) => s.trim())
      const grid = nonEmpty.find((l) => l.startsWith('raster '))
      const [total, hits] = (grid?.split(/\s+/).slice(1).map(Number) ?? [0, 0])
      const stats = nonEmpty.filter((l) => !l.startsWith('raster ') && l.includes('|'))
      const cells = Math.min(total || 0, 5000)
      const hitAt = new Set(Array.from({ length: Math.min(hits || 0, cells) }, (_, k) => Math.floor((cells * (0.59 + k * 0.13)) % cells)))
      return (
        <figure className="m-0">
          <div className="ef-dark flex flex-col gap-5 rounded-2xl p-6 text-white sm:p-8" style={{ background: INK }}>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="text-[64px] font-bold leading-[.9] tracking-[-0.05em] sm:text-[96px]">{value}</span>
              {label && <span className="max-w-[280px] text-[17px] leading-[1.4] text-[#C9C6C3]">{label}</span>}
            </div>
            {cells > 0 && (
              // Kästchen als Hintergrundmuster (5 px + 2 px Abstand) statt tausender Elemente; Treffer orange obenauf
              <div className="relative opacity-90" role="img" aria-label={`${cells} Kästchen, ${hits || 0} davon orange`}
                style={{ height: Math.ceil(cells / 88) * 7, backgroundImage: `linear-gradient(90deg,transparent 5px,${INK} 5px),linear-gradient(transparent 5px,${INK} 5px),linear-gradient(#4A4745,#4A4745)`, backgroundSize: '7px 7px,7px 7px,100% 100%' }}>
                {[...hitAt].map((k) => (
                  <span key={k} className="absolute h-[5px] w-[5px] rounded-[1px]" style={{ background: ORANGE, boxShadow: '0 0 0 3px rgba(255,106,26,.25)', left: `min(${(k % 88) * 7}px, calc(100% - 5px))`, top: Math.floor(k / 88) * 7 }} />
                ))}
              </div>
            )}
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-x-7 gap-y-2 text-[15px] text-[#C9C6C3]">
                {stats.map((s, k) => {
                  const [v, txt] = s.split('|').map((x) => x.trim())
                  const hot = v.startsWith('!')
                  return <span key={k}><b className="text-[22px]" style={{ color: hot ? ORANGE : '#fff' }}>{v.replace(/^!/, '')}</b> {txt}</span>
                })}
              </div>
            )}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'vergleich': {
      const cols: string[][] = [[]]
      for (const l of rest) { if (l.trim() === '---') cols.push([]); else cols[cols.length - 1].push(l) }
      return (
        <figure className="m-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {cols.map((c, k) => {
              const hot = k === cols.length - 1 && cols.length > 1
              const lines = c.filter((l) => l.trim())
              const [eb, name] = (lines[0] ?? '').split('|').map((s) => s.trim())
              const desc = lines.slice(1).filter((l) => !/^[-=] /.test(l))
              const chips = lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
              const res = lines.find((l) => l.startsWith('= '))?.slice(2)
              return (
                <div key={k} className="flex flex-col gap-3 rounded-2xl p-6" style={{ background: hot ? BLUE : '#F3F2F2', color: hot ? '#fff' : INK }}>
                  <Eyebrow color={hot ? LIGHT : '#605D5D'}>{eb}</Eyebrow>
                  {name && <span className="text-[24px] font-bold tracking-[-0.02em]">{name}</span>}
                  {desc.length > 0 && <H s={textOf(desc)} className="text-[14px] leading-[1.5]" style={{ color: hot ? 'rgba(255,255,255,.85)' : '#605D5D' }} />}
                  {(chips.length > 0 || res) && (
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {chips.map((ch, j) => hot
                        ? <span key={j} className="self-start rounded-[14px] bg-white px-3.5 py-2.5 text-[15px] font-semibold" style={{ color: INK }}>{ch}</span>
                        : <span key={j} className="rounded-[10px] bg-white px-2.5 py-1.5 text-[12px] text-[#605D5D]">{ch}</span>)}
                      {res && <span className="mt-1 text-[13px] font-bold">{res}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'formel': {
      const parts = nonEmpty.find((l) => l.includes('['))
      const items = nonEmpty.filter((l) => /^\d+[.)] /.test(l)).map((l) => l.replace(/^\d+[.)] /, ''))
      const tokens = parts ? parts.split(/(\[[^\]]+\])/).map((x) => x.trim()).filter(Boolean) : []
      return (
        <figure className="m-0">
          <div className="ef-dark flex flex-col gap-4 rounded-2xl p-6 text-white sm:p-8" style={{ background: BLUE }}>
            {b.arg && <Eyebrow color={LIGHT}>{b.arg}</Eyebrow>}
            {tokens.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-[20px] font-bold tracking-[-0.02em] sm:text-[24px]">
                {tokens.map((tk, k) => tk.startsWith('[')
                  ? <span key={k} className={k === 0 ? 'rounded-[10px] bg-white px-3.5 py-2' : 'rounded-[10px] border-2 border-white px-3.5 py-1.5'} style={k === 0 ? { color: DEEP } : undefined}>{tk.slice(1, -1)}</span>
                  : <span key={k}>{tk}</span>)}
              </div>
            )}
            {items.length > 0 && (
              <div className="grid gap-3 text-[14px] leading-[1.45] sm:grid-cols-3">
                {items.map((it, k) => <div key={k} className="rounded-[10px] bg-white/[.12] p-3"><b className="block text-[20px]">{k + 1}</b>{it}</div>)}
              </div>
            )}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'todo': {
      const items = nonEmpty.map((l) => l.replace(/^\d+[.)] |^- /, ''))
      return (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--ef-t,#E8EFFB)] px-6 py-6 sm:px-7">
          {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
          {items.map((it, k) => (
            <div key={k} className="grid grid-cols-[36px_1fr] items-start gap-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 text-[15px] font-bold" style={{ borderColor: BLUE, color: BLUE }}>{k + 1}</span>
              <H s={it} className="text-[17px] leading-[1.6]" style={{ color: INK }} />
            </div>
          ))}
        </div>
      )
    }
    case 'weiter': {
      const [eb, href] = b.arg.split('|').map((s) => s.trim())
      const inner = (
        <>
          <div className="flex flex-1 flex-col gap-1.5">
            <Eyebrow color={MID}>{eb}</Eyebrow>
            <span className="text-[22px] font-bold tracking-[-0.02em]">{nonEmpty[0]}</span>
            {nonEmpty[1] && <span className="text-[14px] text-[#C9C6C3]">{nonEmpty.slice(1).join(' ')}</span>}
          </div>
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full" style={{ background: BLUE }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </>
      )
      const cls = 'mt-1.5 flex items-center gap-5 rounded-2xl px-7 py-6 text-white no-underline'
      return href ? <a href={href} className={cls} style={{ background: INK }}>{inner}</a> : <div className={cls} style={{ background: INK }}>{inner}</div>
    }
    case 'glossar': {
      // Randnotiz: ab xl rechts neben dem vorigen Absatz, darunter als kleiner Kasten im Fluss
      const items = nonEmpty.map((l) => l.split('|').map((x) => x.trim())).filter((x) => x[0])
      return (
        <div className="relative xl:-mt-[22px] xl:h-0">
          <aside className="flex flex-col gap-3 border-l-2 border-[var(--ef-t,#E8EFFB)] pl-3.5 xl:absolute xl:bottom-0 xl:left-[calc(100%+32px)] xl:w-[180px]">
            <Eyebrow>{b.arg || 'Glossar'}</Eyebrow>
            {items.map(([term, def], k) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold" style={{ color: DEEP }}>{term}</span>
                <H s={def ?? ''} className="text-[13px] leading-[1.45] text-[#605D5D]" />
              </div>
            ))}
          </aside>
        </div>
      )
    }
    case 'treppe': {
      const steps = nonEmpty.map((l) => l.replace(/^\d+[.)] |^- /, '').split('|').map((x) => x.trim()))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-[var(--ef-t,#E8EFFB)] p-5 sm:p-7">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            {steps.map(([label, q, note], k) => (
              <div key={k} className="grid grid-cols-[40px_1fr] items-start gap-3 rounded-xl border-l-4 bg-white px-4 py-3.5 sm:grid-cols-[44px_1fr] sm:gap-3.5" style={{ borderColor: BLUE, marginLeft: `min(${k * 22}px, ${k * 3}vw)` }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white" style={{ background: BLUE }}>{k + 1}</span>
                <div className="flex flex-col gap-1">
                  <Eyebrow>{label}</Eyebrow>
                  {q && <H s={q} className="text-[16px] font-semibold leading-[1.45]" style={{ color: INK }} />}
                  {note && <H s={note} className="text-[14px] leading-[1.45] text-[#605D5D]" />}
                </div>
              </div>
            ))}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'schritte': {
      const [eb, sub] = b.arg.split('|').map((x) => x.trim())
      const steps = nonEmpty.map((l) => l.replace(/^\d+[.)] |^- /, '').split('|').map((x) => x.trim()))
      return (
        <figure className="m-0">
          <div className="ef-dark flex flex-col gap-3.5 rounded-2xl p-5 text-white sm:p-[30px]" style={{ background: BLUE }}>
            {(eb || sub) && (
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {eb && <Eyebrow color={LIGHT}>{eb}</Eyebrow>}
                {sub && <span className="text-[13px] text-[var(--ef-l,#CFE0FF)]">{sub}</span>}
              </div>
            )}
            {steps.map(([title, txt], k) => (
              <div key={k} className="grid grid-cols-[40px_1fr] items-start gap-3.5 rounded-xl bg-white/10 px-4 py-3.5 sm:grid-cols-[44px_1fr]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold" style={{ color: DEEP }}>{k + 1}</span>
                <div className="flex flex-col gap-1">
                  <H s={title} className="text-[17px] font-bold" />
                  {txt && <H s={txt} className="text-[15px] leading-[1.45] text-white/90" />}
                </div>
              </div>
            ))}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'balken': {
      // „Name | Anzeige | von-bis | *“ — Balkenlänge = bis, kräftiger Teil = von; * = hervorgehoben (blau)
      const rows = nonEmpty.map((l) => l.split('|').map((x) => x.trim()))
      const max = Math.max(100, ...rows.map((r) => Number((r[2] ?? '').split('-')[1] ?? (r[2] ?? '').split('-')[0]) || 0))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-4 rounded-2xl bg-[#F3F2F2] p-5 sm:p-7">
            {rows.map(([name, shown, range, hot], k) => {
              const [lo, hi] = (range ?? '').split('-').map(Number)
              const top = hi || lo || 0
              const solid = top ? Math.round(((lo || top) / top) * 100) : 100
              const [c1, c2] = hot ? [BLUE, 'var(--ef-m2,#A9C2F0)'] : ['#8E8B89', '#D9D7D6']
              return (
                <div key={k} className="grid grid-cols-[84px_1fr] items-center gap-3 sm:grid-cols-[120px_1fr] sm:gap-4">
                  <span className="text-[16px] font-bold" style={{ color: INK }}>{name}</span>
                  <div className="flex h-11 items-center gap-3.5">
                    <div className="h-11 rounded-[10px]" style={{ width: `${(top / max) * 82}%`, minWidth: 8, background: `linear-gradient(90deg,${c1} 0 ${solid}%,${c2} ${solid}% 100%)` }} />
                    <span className="whitespace-nowrap text-[18px] font-bold sm:text-[20px]" style={{ color: hot ? BLUE : '#8E8B89' }}>{shown}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'kreise': {
      // „Anzahl | Farbe | Legende“ (Farbe: blau, grau, hell, orange); „= 88 % | Verlust“ große Zahl
      const COL: Record<string, string> = { blau: BLUE, grau: '#C9C6C3', hell: '#E6E4E2', orange: ORANGE, schwarz: INK }
      const groups = nonEmpty.filter((l) => !l.startsWith('= ')).map((l) => l.split('|').map((x) => x.trim()))
      const big = nonEmpty.find((l) => l.startsWith('= '))?.slice(2).split('|').map((x) => x.trim())
      const dots = groups.flatMap(([n, c]) => Array.from({ length: Math.min(Number(n) || 0, 400) }, () => COL[c] ?? c))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-6 rounded-2xl bg-[#F3F2F2] p-5 sm:flex-row sm:items-center sm:gap-7 sm:p-7">
            <div className="grid flex-none grid-cols-[repeat(10,minmax(0,22px))] gap-1.5 sm:grid-cols-[repeat(10,26px)] sm:gap-2" role="img" aria-label={groups.map((g) => `${g[0]} ${g[2] ?? ''}`).join(', ')}>
              {dots.map((c, k) => <span key={k} className="aspect-square rounded-full" style={{ background: c }} />)}
            </div>
            <div className="flex flex-col gap-3.5 text-[15px] leading-[1.4]" style={{ color: INK }}>
              {groups.filter((g) => g[2]).map(([, c, label], k) => (
                <span key={k} className="flex items-start gap-2.5"><span className="mt-0.5 h-4 w-4 flex-none rounded-full border border-[#D9D7D6]" style={{ background: COL[c] ?? c }} /><H s={label} /></span>
              ))}
              {big && <><span className="mt-1.5 text-[44px] font-bold leading-none tracking-[-0.03em]">{big[0]}</span>{big[1] && <span className="-mt-1.5 text-[#605D5D]">{big[1]}</span>}</>}
            </div>
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'crm': {
      // Nachbau einer CRM-Liste: „| Kopf | … |“ Zeilen, ((Status)) als Pille, „+ Fußzeile“
      const [title, meta] = b.arg.split('|').map((x) => x.trim())
      const rows = nonEmpty.filter((l) => l.trim().startsWith('|')).map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
      const foot = nonEmpty.find((l) => l.startsWith('+ '))?.slice(2)
      const [head, ...body] = rows
      const cols = head?.length ?? 1
      const tpl = cols === 4 ? '1.6fr 1.3fr .7fr 1fr' : `repeat(${cols},1fr)`
      return (
        <figure className="m-0">
          <div className="overflow-hidden rounded-2xl border border-[#E6E4E2] bg-white shadow-[0_10px_30px_rgba(0,0,0,.05)]">
            {(title || meta) && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEDEC] px-4 py-4 sm:px-5">
                <span className="text-[15px] font-bold" style={{ color: INK }}>{title}</span>
                {meta && <span className="text-[13px] text-[#605D5D]">{meta}</span>}
              </div>
            )}
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                {head && (
                  <div className="grid bg-[#F3F2F2] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#605D5D] sm:px-5" style={{ gridTemplateColumns: tpl }}>
                    {head.map((c, k) => <span key={k}>{c}</span>)}
                  </div>
                )}
                {body.map((r, k) => (
                  <div key={k} className="grid items-center border-t border-[#F3F2F2] px-4 py-[11px] text-[14px] sm:px-5" style={{ gridTemplateColumns: tpl, color: INK }}>
                    {r.map((c, j) => <H key={j} s={c} style={j > 1 ? { color: '#605D5D' } : undefined} />)}
                  </div>
                ))}
              </div>
            </div>
            {foot && <div className="border-t border-[#F3F2F2] px-4 py-3 text-[13px] italic text-[#605D5D] sm:px-5">{foot}</div>}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'folie': {
      // Folienstapel: „:::folie Titel | Fußzeile | 50 / 50“
      const [title, foot, count] = b.arg.split('|').map((x) => x.trim())
      const widths = [92, 86, 95, 70, 88, 60]
      return (
        <figure className="m-0">
          <div className="flex justify-center rounded-2xl bg-[#F3F2F2] px-6 pb-8 pt-10 sm:p-9">
            <div className="relative aspect-[44/25] w-full max-w-[440px]">
              <div className="absolute inset-0 translate-x-6 -translate-y-[18px] rotate-[4deg] rounded-lg bg-white shadow-[0_6px_18px_rgba(0,0,0,.06)]" />
              <div className="absolute inset-0 translate-x-3 -translate-y-[9px] rotate-2 rounded-lg bg-white shadow-[0_6px_18px_rgba(0,0,0,.06)]" />
              <div className="absolute inset-0 flex flex-col gap-2 rounded-lg bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,.10)] sm:gap-2.5 sm:p-[22px]">
                <span className="text-[15px] font-bold sm:text-[18px]" style={{ color: INK }}>{title}</span>
                {widths.map((w, k) => <span key={k} className="h-1.5 rounded bg-[#E6E4E2] sm:h-2" style={{ width: `${w}%` }} />)}
                <div className="flex-1" />
                <div className="flex items-center justify-between text-[12px] text-[#605D5D] sm:text-[13px]">
                  <span>{foot}</span>{count && <span className="text-[18px] font-bold sm:text-[22px]" style={{ color: ORANGE }}>{count}</span>}
                </div>
              </div>
            </div>
          </div>
          {notes.map((n, k) => <div key={k} className="ml-7 mt-3"><Note text={n} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    case 'hud': {
      // Dunkles Display: „:::hud 77 % | GARTNER“, Zeilen: Titel, Unterzeile, Zitat
      const [value, label] = b.arg.split('|').map((x) => x.trim())
      const [title, sub, ...more] = nonEmpty
      return (
        <figure className="m-0">
          <div className="ef-dark relative flex flex-col items-center gap-7 overflow-hidden rounded-2xl p-7 sm:flex-row sm:gap-9 sm:p-9" style={{ background: INK }}>
            <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg,rgba(143,176,236,.05) 0 2px,transparent 2px 6px)' }} />
            <div className="relative flex h-[170px] w-[170px] flex-none flex-col items-center justify-center rounded-full border-[3px] sm:h-[200px] sm:w-[200px]" style={{ borderColor: BLUE, boxShadow: '0 0 40px rgba(26,95,212,.45)' }}>
              <span className="text-[52px] font-bold tracking-[-0.04em] text-white sm:text-[64px]">{value}</span>
              {label && <span className="text-[12px] tracking-[0.14em] text-[var(--ef-m,#8FB0EC)]">{label}</span>}
            </div>
            <div className="relative flex flex-col gap-3">
              {title && <span className="font-mono text-[28px] font-bold tracking-[0.08em] text-[var(--ef-m,#8FB0EC)] sm:text-[34px]">{title}</span>}
              {sub && <H s={sub} className="text-[18px] text-white" />}
              {more.length > 0 && <H s={textOf(more)} className="max-w-[300px] text-[15px] leading-[1.5] text-[#C9C6C3]" />}
            </div>
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'gipfel': {
      // Stationen als Aufstieg: eine Zeile je Station, „! Station“ = mit Ampel
      const st = nonEmpty.map((l) => ({ amp: l.startsWith('! '), label: l.replace(/^! /, '').trim() }))
      const n = st.length
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-3 rounded-2xl bg-[#F3F2F2] px-4 pb-5 pt-6 sm:px-7 sm:pt-7">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            <div className="grid items-end gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))`, height: 300 }}>
              {st.map((s, k) => (
                <div key={k} className="flex h-full flex-col items-center justify-end gap-2">
                  {s.amp && (
                    <span className="inline-flex flex-col gap-[3px] rounded-lg p-1" style={{ background: INK }}>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#444]" /><span className="h-2.5 w-2.5 rounded-full bg-[#444]" /><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
                    </span>
                  )}
                  <span className="text-center text-[10px] font-semibold leading-[1.25] sm:text-[12px]" style={{ color: INK, hyphens: 'auto' }}>{s.label}</span>
                  <div className="flex w-full justify-center rounded-t-lg pt-2 font-bold text-white" style={{ height: 44 + k * Math.round(156 / Math.max(1, n - 1)), background: k === n - 1 ? BLUE : 'var(--ef-m2,#BFD1F2)' }}>{k + 1}</div>
                </div>
              ))}
            </div>
          </div>
          {notes.map((nt, k) => <div key={k} className="ml-7 mt-3"><Note text={nt} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    case 'janein': {
      const opts = nonEmpty.map((l) => l.split('|').map((x) => x.trim()))
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {opts.map(([lab, txt], k) => (
            <div key={k} className="flex flex-col gap-1.5 rounded-[14px] border-2 px-[18px] py-4" style={k === 0 ? { background: '#ECFDF3', borderColor: '#22C55E' } : { background: '#fff', borderColor: '#9A9796', borderStyle: 'dashed' }}>
              <span className="text-[12px] font-bold tracking-[0.1em]" style={{ color: k === 0 ? '#15803D' : '#605D5D' }}>{lab}</span>
              <H s={txt ?? ''} className="text-[15px] leading-[1.45]" style={{ color: INK }} />
            </div>
          ))}
        </div>
      )
    }
    case 'dreieck': {
      // Drei Ecken: „Name | Text“ je Zeile (oben, links, rechts); Argument = Text in der Mitte
      const c = nonEmpty.slice(0, 3).map((l) => l.split('|').map((x) => x.trim()))
      const pts = [[280, 124], [96, 350], [464, 350]]
      return (
        <figure className="m-0">
          <div className="flex justify-center rounded-2xl px-3 pb-3 pt-6 sm:px-9" style={{ background: 'linear-gradient(180deg,#FAFAF8 0%,var(--ef-t,#E8EFFB) 100%)' }}>
            <svg viewBox="0 0 560 460" className="h-auto w-full max-w-[560px]" role="img" aria-label={c.map((x) => x[0]).join(', ')}>
              <defs><linearGradient id="efTri" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: MID }} /><stop offset="1" style={{ stopColor: BLUE }} /></linearGradient></defs>
              <polygon points="280,124 96,350 464,350" fill="#fff" fillOpacity=".7" stroke="url(#efTri)" strokeWidth="5" strokeLinejoin="round" />
              {b.arg && <text x="280" y="285" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2.5" fill="#605D5D">{b.arg.toUpperCase()}</text>}
              {c.map(([name, txt], k) => {
                const [x, y] = pts[k]
                const anchor = k === 0 ? 'middle' : k === 1 ? 'start' : 'end'
                const tx = k === 0 ? 280 : k === 1 ? 40 : 520
                const ty = k === 0 ? 40 : 418
                return (
                  <g key={k}>
                    <circle cx={x} cy={y} r="44" style={{ fill: BLUE }} fillOpacity=".14" /><circle cx={x} cy={y} r="30" style={{ fill: BLUE }} />
                    <text x={x} y={y + 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">{k + 1}</text>
                    <text x={tx} y={ty} textAnchor={anchor} fontSize="22" fontWeight="700" fill={INK}>{name}</text>
                    {txt && <text x={tx} y={ty + 22} textAnchor={anchor} fontSize="15" fill="#605D5D">{txt}</text>}
                  </g>
                )
              })}
            </svg>
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'video': {
      // „:::video <YouTube-ID> | Dachzeile“, Zeilen: „bild /pfad.jpg“, Titel, Unterzeile; lädt YouTube erst nach Klick
      const [id, eb] = b.arg.split('|').map((x) => x.trim())
      const img = nonEmpty.find((l) => l.startsWith('bild '))?.slice(5).trim()
      const [title, ...sub] = nonEmpty.filter((l) => !l.startsWith('bild ') && !l.startsWith('hinweis '))
      const hint = nonEmpty.find((l) => l.startsWith('hinweis '))?.slice(8).trim()
      return (
        <figure className="m-0">
          <VideoEmbed id={id} eyebrow={eb} title={title} sub={sub.join(' ') || undefined} image={img} note={hint} />
          <Caption text={caption} />
        </figure>
      )
    }
    case 'funken': {
      // „Label | Titel | Text | *“ je Karte; * = aktiv (Akzentfarbe)
      const items = nonEmpty.map((l) => l.split('|').map((x) => x.trim()))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-3 rounded-2xl bg-[#F6F3EE] p-5 sm:p-6">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            <div className="grid gap-3 sm:grid-cols-3">
              {items.map(([label, title, txt, mark], k) => { const hot = mark === '*'; return (
                <div key={k} className="flex flex-col gap-1.5 rounded-xl p-4" style={hot ? { background: BLUE, color: '#fff' } : { background: '#fff', color: INK, opacity: mark === '-' ? .55 : 1 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: hot ? '#fff' : BLUE }}><path d="M12 2l2.2 6.4L21 9l-5.2 4 1.8 6.6L12 16l-5.6 3.6L8.2 13 3 9l6.8-.6z" /></svg>
                  {label && <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: hot ? LIGHT : '#605D5D' }}>{label}</span>}
                  <span className="text-[20px] font-bold tracking-[-0.02em]">{title}</span>
                  {txt && <H s={txt} className="text-[14px] leading-[1.45]" style={{ color: hot ? 'rgba(255,255,255,.88)' : '#605D5D' }} />}
                </div>
              ) })}
            </div>
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'stimmen': {
      // „Name | „Satz“ | wie“ je Zeile
      const items = nonEmpty.map((l) => l.split('|').map((x) => x.trim()))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-3">
            {items.map(([name, said, how], k) => (
              <div key={k} className="grid gap-1 rounded-xl bg-[#F6F3EE] px-5 py-4 sm:grid-cols-[150px_1fr] sm:gap-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: DEEP }}>{name}</span>
                <span className="flex flex-col gap-0.5"><H s={said} className="text-[18px] font-semibold leading-[1.4]" style={{ color: INK }} />{how && <H s={how} className="text-[13px] italic text-[#605D5D]" />}</span>
              </div>
            ))}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'menschen': {
      // „:::menschen 1 von 2 | Text“, Zeilen: „raster 20 10“ (gesamt, markiert), „7.272 | Befragte“, „quelle Text“
      const [big, label] = b.arg.split('|').map((x) => x.trim())
      const grid = nonEmpty.find((l) => l.startsWith('raster '))?.split(/\s+/).slice(1).map(Number) ?? [20, 10]
      const [total, marked] = [Math.min(grid[0] || 20, 100), grid[1] || 0]
      const step = marked ? total / marked : 0
      const hot = new Set(Array.from({ length: marked }, (_, k) => Math.floor(k * step)))
      const stat = nonEmpty.find((l) => !l.startsWith('raster ') && !l.startsWith('quelle ') && l.includes('|'))?.split('|').map((x) => x.trim())
      const src = nonEmpty.find((l) => l.startsWith('quelle '))?.slice(7)
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-5 rounded-2xl bg-[#F6F3EE] p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[44px] font-bold leading-none tracking-[-0.04em] sm:text-[56px]" style={{ color: BLUE }}>{big}</span>
              {label && <H s={label} className="max-w-[360px] text-[16px] leading-[1.4]" style={{ color: INK }} />}
            </div>
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2.5" role="img" aria-label={`${total} Figuren, ${marked} markiert`}>
              {Array.from({ length: total }, (_, k) => (
                <svg key={k} viewBox="0 0 24 40" className="h-auto w-full max-w-[34px]" aria-hidden="true" style={{ fill: hot.has(k) ? BLUE : '#CFCCCA' }}>
                  <circle cx="12" cy="7" r="6" /><path d="M3 40V22c0-5 4-9 9-9s9 4 9 9v18z" />
                </svg>
              ))}
            </div>
            {(stat || src) && (
              <div className="flex flex-wrap justify-between gap-2 text-[13px] text-[#605D5D]">
                {stat && <span><b className="text-[16px]" style={{ color: INK }}>{stat[0]}</b> {stat[1]}</span>}
                {src && <span>{src}</span>}
              </div>
            )}
          </div>
          <Caption text={caption} />
        </figure>
      )
    }
    case 'protokoll': {
      // Funk- oder Chatprotokoll: „01 | „Satz““ je Zeile, dunkle Karte
      const items = nonEmpty.map((l) => l.split('|').map((x) => x.trim()))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-3 rounded-2xl p-6 text-white sm:p-8" style={{ background: INK }}>
            {b.arg && <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A9796]"><span className="h-2 w-2 animate-pulse rounded-full" style={{ background: BLUE }} />{b.arg}</span>}
            {items.map(([n, said], k) => (
              <div key={k} className="grid grid-cols-[36px_1fr] items-baseline gap-3 border-t border-white/10 pt-3">
                <span className="font-mono text-[12px] text-[#9A9796]">{n}</span>
                <H s={said ?? ''} className="font-mono text-[18px] sm:text-[20px]" />
              </div>
            ))}
          </div>
          {notes.map((nt, k) => <div key={k} className="ml-7 mb-1 mt-6"><Note text={nt} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    case 'anteil': {
      // Gestapelter Balken: „Prozent | grau/schraffiert/akzent | **Titel** Text“; „klammer Prozent | Text“ = Klammer darüber
      const segs = nonEmpty.filter((l) => !l.startsWith('klammer ')).map((l) => l.split('|').map((x) => x.trim()))
      const braces = nonEmpty.filter((l) => l.startsWith('klammer ')).map((l) => l.slice(8).split('|').map((x) => x.trim()))
      const bg = (st: string) => st === 'akzent' ? BLUE : st === 'schraffiert' ? 'repeating-linear-gradient(135deg,#BDBAB8 0 2px,#ECEAE8 2px 9px)' : '#A9A6A4'
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-2 rounded-2xl bg-[#F6F3EE] p-5 sm:p-7">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            {braces.length > 0 && (
              <div className="mt-2 flex text-[12px] font-bold sm:text-[13px]">
                {braces.map(([w, t], k) => (
                  <div key={k} className="flex flex-col gap-1.5 pr-1.5" style={{ width: `${w}%`, color: k === braces.length - 1 ? BLUE : '#3A3836' }}>
                    <span>{t}</span><div className="h-2.5 rounded-t border-2 border-b-0" style={{ borderColor: k === braces.length - 1 ? BLUE : '#9A9796' }} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex h-[60px] overflow-hidden rounded-xl sm:h-[72px]">
              {segs.map(([w, st], k) => <div key={k} style={{ width: `${w}%`, background: bg(st) }} />)}
            </div>
            <div className="mt-1 flex text-[13px] leading-[1.4] text-[#3A3836] sm:text-[14px]">
              {segs.map(([w, st, txt], k) => <H key={k} s={txt ?? ''} className="block pr-3" style={{ width: `${w}%`, color: st === 'akzent' ? BLUE : undefined }} />)}
            </div>
          </div>
          {notes.map((nt, k) => <div key={k} className="ml-7 mb-1 mt-6"><Note text={nt} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    case 'notiz': {
      // Übung zum Ausfüllen: Text, „- Chip“, „? Frage“ = Eingabefeld (bleibt im Browser)
      const chips = nonEmpty.filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
      const qs = nonEmpty.filter((l) => l.startsWith('? ')).map((l) => l.slice(2))
      const txt = nonEmpty.filter((l) => !l.startsWith('- ') && !l.startsWith('? '))
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-dashed p-5 sm:p-7" style={{ borderColor: 'var(--ef-m2,#A9C2F0)', background: '#fff' }}>
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            {txt.length > 0 && <H s={textOf(txt)} className="text-[18px] font-semibold" style={{ color: INK }} />}
            {chips.length > 0 && <div className="flex flex-wrap gap-2">{chips.map((c, k) => <span key={k} className="rounded-full bg-[#F3F2F2] px-3 py-1.5 text-[13px] text-[#3A3836]">{c}</span>)}</div>}
            {qs.map((q, k) => <NoteInput key={k} storeKey={`${b.arg}:${q}`} label={q} />)}
          </div>
          {notes.map((nt, k) => <div key={k} className="ml-7 mb-1 mt-6"><Note text={nt} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    case 'fahrplan': {
      // Spalten mit „---“ getrennt: erste Zeile „A | Titel“, dann „01 | Schritt“; danach „vorher | …“ und „nachher | …“
      const cols: string[][] = [[]]
      for (const l of nonEmpty.filter((x) => !/^(vorher|nachher) \|/i.test(x))) { if (l === '---') cols.push([]); else cols[cols.length - 1].push(l) }
      const before = nonEmpty.find((l) => /^vorher \|/i.test(l))?.split('|')[1]?.trim()
      const after = nonEmpty.find((l) => /^nachher \|/i.test(l))?.split('|')[1]?.trim()
      return (
        <figure className="m-0">
          <div className="flex flex-col gap-4 rounded-2xl bg-[#F6F3EE] p-5 sm:p-7">
            {b.arg && <Eyebrow color={DEEP}>{b.arg}</Eyebrow>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cols.filter((c) => c.length).map((c, k) => {
                const [key, title] = c[0].split('|').map((x) => x.trim())
                return (
                  <div key={k} className="flex flex-col gap-1.5 rounded-xl bg-white p-4">
                    <span className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: BLUE }}>{key}</span><span className="text-[15px] font-bold leading-snug" style={{ color: INK }}>{title}</span></span>
                    {c.slice(1).map((st, j) => { const [n, t] = st.split('|').map((x) => x.trim()); return <span key={j} className="text-[13px] text-[#605D5D]"><b className="mr-1.5 text-[#9A9796]">{n}</b>{t}</span> })}
                  </div>
                )
              })}
            </div>
            {(before || after) && (
              <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-xl border border-dashed border-[#C9C2B8] bg-white px-4 py-3 text-[14px] text-[#605D5D]"><span className="block text-[11px] font-bold uppercase tracking-[0.12em]">Vorher</span>{before}</div>
                <span className="hidden text-[22px] sm:block" style={{ color: BLUE }}>⟶</span>
                <div className="rounded-xl px-4 py-3 text-[14px] font-semibold text-white" style={{ background: BLUE }}><span className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: LIGHT }}>Nachher</span>{after}</div>
              </div>
            )}
          </div>
          {notes.map((nt, k) => <div key={k} className="ml-7 mb-1 mt-6"><Note text={nt} /></div>)}
          <Caption text={caption} />
        </figure>
      )
    }
    default:
      return <p className="text-[18px] leading-[1.7] text-[#605D5D]">{textOf(nonEmpty)}</p>
  }
}

/** {{Begriff}} → {{Begriff¦Erklärung}} aus den :::glossar-Kästen des Beitrags (Tooltip) */
export function glossaryOf(content: string) {
  const out: Array<{ term: string; def: string }> = []
  for (const b of parseBlocks(content)) {
    if (b.t === 'box' && b.kind === 'glossar') for (const l of b.lines) {
      const [term, def] = l.split('|').map((x) => x.trim())
      if (term && def) out.push({ term, def })
    }
  }
  return out
}
function withGlossary(content: string) {
  const map = new Map(glossaryOf(content).map((g) => [g.term.toLowerCase(), g.def]))
  // „¦“ statt „|“, damit Bausteine, die Zeilen an „|“ teilen, den Begriff nicht zerschneiden
  return content.replace(/\{\{([^}|¦]+)\}\}/g, (_m, t: string) => `{{${t}¦${(map.get(t.trim().toLowerCase()) ?? '').replace(/[{}|¦]/g, '')}}}`)
}

/** Der Beitragstext */
/** Akzentfarben je Autor:in (CSS-Variablen, siehe BLUE/DEEP/TINT oben) */
export const ACCENTS: Record<string, React.CSSProperties> = {
  red: { ['--ef-a' as string]: '#E62B1E', ['--ef-d' as string]: '#B3170D', ['--ef-t' as string]: '#FDECEA', ['--ef-l' as string]: '#FFD3CE', ['--ef-m' as string]: '#F59A92', ['--ef-m2' as string]: '#F8B8B2' },
}
export function PostBody({ content, emptyText, accent }: { content: string | null; emptyText?: string; accent?: keyof typeof ACCENTS }) {
  if (!content?.trim()) return <p className="text-gray-400">{emptyText}</p>
  const blocks = parseBlocks(withGlossary(content))
  return (
    <div className="flex flex-col gap-[22px]" style={accent ? ACCENTS[accent] : undefined}>
      <style href="ef-marker-font" precedence="default">{"@font-face{font-family:'Permanent Marker';font-style:normal;font-weight:400;font-display:swap;src:url(/academy/fonts/5190bac999.woff2) format('woff2')}.ef-term{color:var(--ef-d,#124293);font-weight:600;border-bottom:1px dotted var(--ef-a,#1A5FD4);cursor:help}.ef-dark .ef-term{color:inherit;border-bottom-color:currentColor}"}</style>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h2': return <h2 key={i} id={slugifyHeading(b.text)} className="mt-[30px] scroll-mt-28 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[30px]" style={{ color: INK, textWrap: 'balance' } as React.CSSProperties}>{b.text}</h2>
          case 'h3': return <h3 key={i} className="mt-2 text-[20px] font-bold" style={{ color: INK }}>{b.text}</h3>
          case 'p': return <p key={i} className="text-[17px] leading-[1.7] text-[#605D5D] sm:text-[18px]" dangerouslySetInnerHTML={{ __html: inline(b.text) }} />
          case 'note': return <div key={i}><Note text={b.text} /></div>
          case 'quote': return <blockquote key={i} className="border-l-2 pl-5 text-[20px] leading-relaxed" style={{ borderColor: BLUE, color: INK }}><H s={b.text} /></blockquote>
          case 'img':
            return (
              <figure key={i} className="m-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} className="block h-[240px] w-full rounded-[14px] object-cover sm:h-[380px]" />
                <Caption text={b.alt} />
              </figure>
            )
          case 'ul':
          case 'ol': {
            const L = b.t === 'ol' ? 'ol' : 'ul'
            return (
              <L key={i} className={`flex flex-col gap-2.5 pl-[22px] ${b.t === 'ol' ? 'list-decimal' : 'list-disc'} marker:font-bold marker:text-[var(--ef-d,#124293)]`}>
                {b.items.map((it, k) => <li key={k} className="pl-1.5 text-[17px] leading-[1.7] text-[#605D5D] sm:text-[18px]" dangerouslySetInnerHTML={{ __html: inline(it) }} />)}
              </L>
            )
          }
          case 'say':
            return (
              <div key={i} className="my-1 flex items-start gap-3.5">
                <span className="w-12 flex-none pt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] sm:w-16" style={{ color: DEEP }}>{b.who}</span>
                <H s={b.text} className="text-[18px] leading-[1.55]" style={{ color: INK }} />
              </div>
            )
          case 'table': {
            const [head, ...body] = b.rows
            return (
              <div key={i} className="overflow-hidden rounded-[14px] border border-[#E6E4E2]">
                <div className="grid bg-[#F3F2F2] text-[12px] font-bold uppercase tracking-[0.1em] text-[#605D5D] sm:grid-cols-[240px_1fr]">
                  {head.map((c, k) => <span key={k} className={`px-4 py-3 ${k > 0 ? 'hidden sm:block' : ''}`}>{c}</span>)}
                </div>
                {body.map((r, k) => (
                  <div key={k} className="grid border-t border-[#EFEDEC] text-[16px] leading-[1.5] sm:grid-cols-[240px_1fr]">
                    {r.map((c, j) => <H key={j} s={c} className={`px-4 ${j === 0 ? 'pt-3.5 text-[#3A3836] sm:py-3.5' : 'pb-3.5 sm:py-3.5'}`} style={j > 0 ? { color: INK } : undefined} />)}
                  </div>
                ))}
              </div>
            )
          }
          case 'box': return <Fragment key={i}><Box b={b} /></Fragment>
        }
      })}
    </div>
  )
}
