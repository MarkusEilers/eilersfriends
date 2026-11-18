import { listPosts } from '@/lib/blog/posts'

/**
 * Suchbestand für die 404-Seite: feste Seiten, Frameworks, Blogbeiträge.
 * Ziel: aus einem kaputten Pfad oder einer Frage die wahrscheinlich gemeinte Seite finden.
 */
export type Lang = 'de' | 'en' | 'es'
export interface Doc { kind: 'page' | 'framework' | 'blog'; href: string; title: string; text: string; keys: string; image?: string | null }

type P = { href: string; keys: string; t: Record<Lang, [string, string]>; kind?: 'page' | 'framework' }
const PAGES: P[] = [
  { href: '/', keys: 'start home startseite', t: { de: ['Startseite', 'Eilers+Friends: Vertrieb und Führung für B2B-Teams'], en: ['Home', 'Eilers+Friends: sales and leadership for B2B teams'], es: ['Inicio', 'Eilers+Friends: ventas y liderazgo para equipos B2B'] } },
  { href: '/academy', keys: 'academy salesmade training vertrieb sales ausbildung preis preise kosten premium flight kurs gespraechsfuehrung conversational excellence', t: { de: ['SalesMade Academy', '12 Monate Live-Training und Coaching, 19 gemessene Skills, 90 Tage Geld-zurück-Garantie.'], en: ['SalesMade Academy', '12 months of live training and coaching, 19 measured skills, 90-day money-back guarantee.'], es: ['SalesMade Academy', '12 meses de formación y coaching en directo, 19 habilidades medidas, garantía de 90 días.'] } },
  { href: '/mystery-shopping', keys: 'mystery shopping testkauf testanruf report anruf team erstgespraech', t: { de: ['Mystery Shopping', 'Wir führen ein Erstgespräch mit Eurem Team als imaginärer Kunde. 14 Seiten Report.'], en: ['Mystery Shopping', 'We hold a first call with your team as an imaginary customer. 14-page report.'], es: ['Mystery Shopping', 'Hacemos una primera llamada con tu equipo como cliente imaginario. Informe de 14 páginas.'] } },
  { href: '/check/bottleneck', keys: 'check diagnose engpass bottleneck quiz test umsatz analyse funnel', t: { de: ['Umsatz-Engpass-Diagnose', '18 kurze Fragen: Welche Stufe Eurer Umsatz-Reise bremst alles dahinter?'], en: ['Revenue Bottleneck Diagnostic', '18 short questions: which stage of your revenue journey holds back everything behind it?'], es: ['Diagnóstico de cuellos de botella', '18 preguntas breves: ¿qué etapa frena todo lo demás?'] } },
  { href: '/gespraechs-check', keys: 'gespraechs check call transkript analyse erstgespraech auswertung', t: { de: ['Gesprächs-Check', 'Transkript eines Erstgesprächs hochladen, Auswertung in Minuten.'], en: ['Call check', 'Upload a first-call transcript, get the analysis in minutes.'], es: ['Análisis de conversación', 'Sube la transcripción de una primera reunión y recibe el análisis.'] } },
  { href: '/frameworks', keys: 'frameworks bauplan bauplaene vorlagen templates kostenlos', t: { de: ['Frameworks', 'Praxiserprobte Baupläne für Vertrieb, Angebote und Führung, kostenlos.'], en: ['Frameworks', 'Field-tested blueprints for sales, offers and leadership, free.'], es: ['Frameworks', 'Planos probados para ventas, ofertas y liderazgo, gratis.'] } },
  { href: '/frameworks/beef-radar', kind: 'framework', keys: 'beef radar wert value what how why nutzen cfo', t: { de: ['Beef Radar', 'Wert so kommunizieren, dass auch der CFO zuhört.'], en: ['Beef Radar', 'Communicate value so that even the CFO listens.'], es: ['Beef Radar', 'Comunicar valor para que hasta el CFO escuche.'] } },
  { href: '/frameworks/instant-influence', kind: 'framework', keys: 'instant influence erstgespraech discovery neugier einfluss', t: { de: ['Instant Influence', 'Die 3 Zutaten, die Kunden im ersten Gespräch gewinnen.'], en: ['Instant Influence', 'The 3 ingredients that win customers in the first call.'], es: ['Instant Influence', 'Los 3 ingredientes que ganan clientes en la primera reunión.'] } },
  { href: '/frameworks/recommendation-pitch', kind: 'framework', keys: 'recommendation pitch empfehlung praesentation pitchen', t: { de: ['Recommendation Pitch', 'Empfehlungen aussprechen statt zu pitchen.'], en: ['Recommendation Pitch', 'Make recommendations instead of pitching.'], es: ['Recommendation Pitch', 'Recomendar en lugar de hacer un pitch.'] } },
  { href: '/frameworks/b2b-angebote', kind: 'framework', keys: 'b2b angebote angebot offer proposal preis unwiderstehlich', t: { de: ['B2B-Angebote', 'Der Bauplan für Angebote, die schwer abzulehnen sind.'], en: ['B2B offers', 'The blueprint for offers that are hard to turn down.'], es: ['Ofertas B2B', 'El plano para ofertas difíciles de rechazar.'] } },
  { href: '/liquidleadership', keys: 'liquid leadership fuehrung leader fuehrungskraefte coaching aljona team', t: { de: ['Liquid Leadership', 'Zwölf Sessions, nach denen Teams ihren Führungskräften gern folgen.'], en: ['Liquid Leadership', 'Twelve sessions after which teams gladly follow their leaders.'], es: ['Liquid Leadership', 'Doce sesiones tras las cuales los equipos siguen a sus líderes.'] } },
  { href: '/programme', keys: 'programme programs programm gtm go to market 13 steps ai intensive', t: { de: ['Programme', 'Alle Programme im Überblick: Academy, GTM, Leadership, AI.'], en: ['Programmes', 'All programmes at a glance: Academy, GTM, leadership, AI.'], es: ['Programas', 'Todos los programas: Academy, GTM, liderazgo, IA.'] } },
  { href: '/markus', keys: 'markus eilers keynote speaker vortrag coaching gruender ceo', t: { de: ['Markus Eilers', 'Keynotes und 1:1-Coaching für B2B-Gründer und CEOs.'], en: ['Markus Eilers', 'Keynotes and 1:1 coaching for B2B founders and CEOs.'], es: ['Markus Eilers', 'Keynotes y coaching 1:1 para fundadores y CEOs B2B.'] } },
  { href: '/aljona', keys: 'aljona eilers tedx neuroscience empathie leadership', t: { de: ['Aljona Eilers', 'TEDx Speaker, WSJ-Bestseller-Autorin, Liquid Leadership.'], en: ['Aljona Eilers', 'TEDx speaker, WSJ bestselling author, Liquid Leadership.'], es: ['Aljona Eilers', 'Ponente TEDx, autora bestseller WSJ, Liquid Leadership.'] } },
  { href: '/blog', keys: 'blog artikel beitraege newsletter podcast stories', t: { de: ['Blog', 'Kundenstorys, Frameworks und Sparring-Notizen.'], en: ['Blog', 'Customer stories, frameworks and sparring notes.'], es: ['Blog', 'Historias de clientes, frameworks y notas.'] } },
  { href: '/schedule', keys: 'termin buchen call gespraech kalender strategiegespraech kennenlernen sparring book meeting', t: { de: ['Termin buchen', 'Strategiegespräch, Kennenlernen oder Sparring direkt online buchen.'], en: ['Book a call', 'Book a strategy session, intro or sparring online.'], es: ['Reservar cita', 'Reserva una sesión estratégica o sparring online.'] } },
  { href: '/kontakt', keys: 'kontakt contact email schreiben anfrage adresse', t: { de: ['Kontakt', 'Schreibt uns, wir melden uns.'], en: ['Contact', 'Write to us, we will get back to you.'], es: ['Contacto', 'Escríbenos y te respondemos.'] } },
  { href: '/auth/login', keys: 'login anmelden kundenbereich dashboard portal konto account member', t: { de: ['Login · Kundenbereich', 'Zu Euren Programmen, Frameworks und dem Programm Guide.'], en: ['Login · member area', 'Your programmes, frameworks and programme guide.'], es: ['Login · área de clientes', 'Tus programas, frameworks y guía.'] } },
  { href: '/impressum', keys: 'impressum imprint anbieter', t: { de: ['Impressum', ''], en: ['Imprint', ''], es: ['Aviso legal', ''] } },
  { href: '/datenschutz', keys: 'datenschutz privacy dsgvo gdpr', t: { de: ['Datenschutz', ''], en: ['Privacy', ''], es: ['Privacidad', ''] } },
]

const cache = new Map<Lang, { at: number; docs: Doc[] }>()

export async function corpus(lang: Lang): Promise<Doc[]> {
  const hit = cache.get(lang)
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.docs
  const prefix = lang === 'de' ? '' : `/${lang}`
  const docs: Doc[] = PAGES.map((p) => ({ kind: p.kind ?? 'page', href: `${prefix}${p.href === '/' && prefix ? '' : p.href}` || '/', title: p.t[lang][0], text: p.t[lang][1], keys: p.keys }))
  try {
    const posts = await listPosts({ locale: lang, limit: 80 })
    for (const b of posts as unknown as Array<{ slug: string; title: string; excerpt: string | null; subtitle: string | null; tags: string[] | null; hero_image: string | null }>) {
      docs.push({ kind: 'blog', href: `${prefix}/blog/${b.slug}`, title: b.title, text: b.excerpt || b.subtitle || '', keys: `${b.slug.replace(/-/g, ' ')} ${(b.tags ?? []).join(' ')}`, image: b.hero_image })
    }
  } catch { /* Blog nicht erreichbar → nur feste Seiten */ }
  cache.set(lang, { at: Date.now(), docs })
  return docs
}

const norm = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const STOP = new Set(['der', 'die', 'das', 'und', 'oder', 'ein', 'eine', 'ich', 'wie', 'was', 'wo', 'mit', 'fuer', 'von', 'zu', 'ist', 'the', 'and', 'for', 'how', 'what', 'los', 'las', 'que', 'para', 'html', 'php', 'index', 'page', 'seite', 'www', 'com', 'gibt', 'euch', 'eure', 'euer', 'mir', 'mich'])
export const tokens = (s: string) => norm(s).split(' ').filter((t) => t.length >= 3 && !STOP.has(t))

function lev(a: string, b: string) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[n]
}

/** Bewertet jedes Dokument gegen die Suchwörter; der letzte Pfad-Teil wird zusätzlich unscharf mit Slugs verglichen. */
export function rank(docs: Doc[], query: string, path = ''): Array<Doc & { score: number }> {
  const q = tokens(query)
  const seg = norm(path.split('/').filter(Boolean).pop() ?? '').replace(/ /g, '')
  return docs.map((d) => {
    const title = norm(d.title), keys = norm(d.keys), text = norm(d.text)
    let score = 0
    for (const t of q) {
      const pre = t.slice(0, Math.max(4, t.length - 2))
      if (title.includes(t)) score += 6; else if (title.includes(pre)) score += 3
      if (keys.split(' ').some((k) => k === t)) score += 5; else if (keys.includes(pre)) score += 2
      if (text.includes(t)) score += 2
    }
    if (seg.length >= 4) {
      const slug = norm(d.href.split('/').filter(Boolean).pop() ?? '').replace(/ /g, '')
      if (slug) {
        const dist = lev(seg, slug)
        const sim = 1 - dist / Math.max(seg.length, slug.length)
        if (sim >= 0.6) score += Math.round(sim * 14)
      }
    }
    return { ...d, score }
  }).filter((d) => d.score > 0).sort((a, b) => b.score - a.score)
}
