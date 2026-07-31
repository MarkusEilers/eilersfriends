/** Stil-Presets für das Hero-Bild eines Angebots (shared: Server-Action + Editor-UI). */
export type HeroStyle = 'cinematic' | 'casual' | 'hipo' | 'corporate' | 'abstract'

export const HERO_STYLE_BRIEF: Record<HeroStyle, string> = {
  cinematic: 'Cinematic and atmospheric: blue hour, volumetric light, haze, anamorphic bokeh, fine film grain, moody premium editorial cinematography.',
  casual: 'Casual and human: natural daylight, relaxed modern workspace, authentic candid moment, warm approachable mood, documentary photography — no stiff corporate posing.',
  hipo: 'High-performer energy: driven, focused people in motion, strong directional light, high contrast, crisp modern architecture, ambitious and elite mood.',
  corporate: 'Clean corporate: bright professional environment, structured composition, confident and trustworthy, restrained colour, understated premium.',
  abstract: 'Abstract and graphic: no recognisable faces, architectural lines, light and shadow geometry, glass and reflections, data-like luminous patterns, minimal and modern.',
}

export const HERO_STYLES: { key: HeroStyle; label: string; hint: string }[] = [
  { key: 'cinematic', label: 'Cinematic', hint: 'Blue Hour, atmosphärisch, Film-Look' },
  { key: 'casual',    label: 'Casual',    hint: 'Natürlich, nahbar, echte Momente' },
  { key: 'hipo',      label: 'High Performer', hint: 'Getrieben, fokussiert, elitär' },
  { key: 'corporate', label: 'Corporate', hint: 'Sauber, seriös, zurückhaltend' },
  { key: 'abstract',  label: 'Abstrakt',  hint: 'Ohne Gesichter, Licht & Geometrie' },
]
