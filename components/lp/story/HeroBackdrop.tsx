import type { CSSProperties } from 'react'
/**
 * Vollflächiges Hero-Hintergrundbild (S/W mit Farbakzent), Personen im rechten Drittel,
 * Text links auf ruhigem Grund. Mobil bleibt das Bild Hintergrund und läuft unten weich aus.
 * Nutzung: <section className="efh"> <HeroBackdrop src=… label=… /> <div className="efh-copy">…</div> </section>
 * Im LP-HTML dieselben Klassen: efh, efh-img (inline background-image), efh-fade, efh-copy, efh-proof.
 */
export const EFH_CSS = `
.efh{position:relative;overflow:hidden;background:#F2F1EF;min-height:min(84vh,780px);display:flex;align-items:center;margin-bottom:clamp(28px,3vw,44px);box-sizing:border-box}
.efh>*{position:relative;z-index:1}
.efh>.efh-img,.efh>.efh-fade{position:absolute;inset:0;z-index:0}
.efh-img{background-position:right center;background-size:auto 100%;background-repeat:no-repeat}
.efh-fade{background:radial-gradient(55% 65% at 95% 12%,var(--efh-glow,rgba(26,95,212,.16)),rgba(0,0,0,0) 70%),linear-gradient(90deg,#F2F1EF 0%,#F2F1EF 36%,rgba(242,241,239,.9) 43%,rgba(242,241,239,0) 57%)}
.efh-copy{max-width:min(640px,50%)}
.efh-proof{position:absolute;right:clamp(20px,6vw,96px);bottom:28px;z-index:2}
@media(min-width:1700px){.efh-img{background-size:auto 112%}}
@media(max-width:900px){
.efh{display:block;min-height:0;padding-bottom:calc(64vw + 8px)!important}
.efh-img{background-size:auto calc(64vw + 170px);background-position:80% bottom}
.efh-fade{background:linear-gradient(0deg,rgba(242,241,239,0) 0px,rgba(242,241,239,0) calc(64vw - 40px),rgba(242,241,239,.85) calc(64vw + 60px),#F2F1EF calc(64vw + 130px))}
.efh-copy{max-width:none}
.efh-proof{position:relative;right:auto;bottom:auto;margin-top:28px;display:inline-flex}
}`

export function HeroStyles() {
  return <style href="efh-css" precedence="default">{EFH_CSS}</style>
}

export function HeroBackdrop({ src, label, glow }: { src: string; label?: string; glow?: string }) {
  return (
    <>
      <HeroStyles />
      <div className="efh-img" role="img" aria-label={label} style={{ backgroundImage: `url(${src})` }} />
      <div className="efh-fade" style={glow ? ({ ['--efh-glow' as string]: glow } as CSSProperties) : undefined} />
    </>
  )
}
