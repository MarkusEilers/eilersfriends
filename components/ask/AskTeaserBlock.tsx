import { getFunnel } from '@/lib/ask/registry'
import type { Lang } from '@/lib/ask/types'
import { ASK_CSS } from './ask-css'
import { AskTeaser } from './AskTeaser'

/** Landingpage-Baustein „story_ask_teaser“. Inhalt: { funnel, headline?, sub?, button? } — leere Felder nehmen die Texte des Funnels. */
export function AskTeaserBlock({ c, lang }: { c: Record<string, unknown>; lang: Lang }) {
  const f = getFunnel(String(c.funnel || 'engpass'))
  if (!f) return null
  const d = f.def, str = (k: string) => (typeof c[k] === 'string' && (c[k] as string).trim() ? (c[k] as string) : null)
  const questions = d.teaser.questionIds.map((id) => {
    const st = d.stages.find((s) => s.questions.some((q) => q.id === id))!
    const q = st.questions.find((x) => x.id === id)!
    return { id, stage: st.key, prompt: q.prompt[lang], options: q.options.map((o) => o.label[lang]) }
  })
  return (
    <section className="sb-ask">
      <style href="ask-css" precedence="default">{ASK_CSS}</style>
      <AskTeaser lang={lang} data={{
        slug: d.slug, kicker: d.kicker[lang], headline: str('headline') ?? d.teaser.headline[lang], sub: str('sub') ?? d.teaser.sub[lang],
        button: str('button') ?? d.teaser.button[lang], duration: d.duration[lang],
        stages: d.stages.map((s) => ({ key: s.key, name: s.name[lang] })), questions,
      }} />
    </section>
  )
}
