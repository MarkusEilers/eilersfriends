/**
 * Framework Image Prompts — Hero + Card variants per slug.
 *
 * HERO   = landscape 1536×1024, atmospheric, person *in successful action* of the
 *          framework, used as background on /frameworks/<slug> detail page.
 * CARD   = square 1024×1024, same character/scene/mood but tighter framing,
 *          used as cover image on the HVCO homepage section and on
 *          /frameworks index cards.
 *
 * Brand colors are locked into every prompt:
 *   Deep navy #0F1E3A · brand blue #1A5FD4 · cyan accent #1FB7E8 / #5DDBF5
 *   No orange, no warm amber except as a single rim-light.
 */

export interface FrameworkPrompts {
  hero: string
  card: string
}

const PALETTE = (
  'Heavily desaturated cinematic palette dominated by deep navy #0F1E3A, brand blue #1A5FD4 and cool cyan accents #1FB7E8. ' +
  'Strict cool-tone color grading. Absolutely no orange or warm amber tones except as a subtle rim light. ' +
  'ARRI Alexa large-format aesthetic, shallow depth of field, soft volumetric haze, slight film grain. ' +
  'Editorial photography, professional, modern. No text, no logos.'
)

export const FRAMEWORK_PROMPTS: Record<string, FrameworkPrompts> = {
  'instant-influence': {
    hero:
      `Cinematic landscape editorial photograph. A confident young professional in a tailored navy shirt sits leaning forward across a polished walnut conference table, mid-eye-contact with someone off-frame, a slight genuine smile, hand gesturing naturally as if landing a key insight. Sunlit modern industrial office in the background — exposed brick, tall windows with cool morning light. The viewer feels the moment a discovery call is being *won*. ${PALETTE}`,
    card:
      `Cinematic square editorial portrait. A confident professional mid-conversation, leaning slightly forward, genuine eye contact framed slightly off-center, hand gesturing in soft motion blur. Background: blurred modern industrial office with cool blue window light, brick texture. Tight framing on face and gesture — the feel of a *won* discovery call. ${PALETTE}`,
  },
  'instant-authority': {
    hero:
      `Cinematic landscape editorial. A composed speaker in a sharp navy blazer stands at a sleek podium under a single cool overhead spotlight, hand raised mid-gesture toward an unseen audience. Slight silhouette of attentive listeners in foreground bokeh. Industrial modern auditorium, deep navy walls. ${PALETTE}`,
    card:
      `Cinematic square. Speaker mid-statement, conviction in posture, hand extended toward audience, framed three-quarter under a cool overhead spotlight. Deep navy backdrop. ${PALETTE}`,
  },
  'b2b-angebote': {
    hero:
      `Cinematic landscape editorial. Three-quarter view of a polished walnut desk in a sunlit boardroom. A beautifully printed multi-page proposal lies open, a confident hand mid-signature with a brass fountain pen, the other hand resting on the document. Cool morning light from tall windows, brass desk-lamp providing a single warm rim. Sense of a deal *being closed*. ${PALETTE}`,
    card:
      `Cinematic square top-down macro of a premium printed proposal opened to its signature page on a walnut desk. A fountain pen mid-signature, a hand gracefully entering frame. Cool ambient light with a single warm rim from a brass lamp. Premium feel — the moment of yes. ${PALETTE}`,
  },
  'hailiom': {
    hero:
      `Cinematic landscape editorial. A modern content creator in a minimalist home studio, calm focus on her face, surrounded by three large monitors showing scrolling LinkedIn feeds with high engagement numbers (no readable text). Soft cyan-tinted ring light, deep navy ambient. The mood is *flow state* — content amplification visible in faint particle streaks rising from the screens. ${PALETTE}`,
    card:
      `Cinematic square. Close-up of a creator's intent gaze illuminated by cyan monitor glow, subtle reflection of high engagement metrics in their eyes (no readable text). Deep navy background. The feel of content going viral. ${PALETTE}`,
  },
  'beef-radar': {
    hero:
      `Cinematic landscape editorial. Composed senior advisor in a deep navy suit listens intently across a boardroom table, head slightly tilted, hand resting near chin. Subtle background tension visible in blurred colleagues. Through the floor-to-ceiling window, a faint cyan radar overlay washes over the scene. Mood: detecting what others miss. ${PALETTE}`,
    card:
      `Cinematic square portrait. Close-up of a sharp listener, eyes focused off-frame, hand near chin, picking up signals others miss. Faint cyan-blue ambient overlay suggesting radar awareness. ${PALETTE}`,
  },
  'core-messages': {
    hero:
      `Cinematic landscape editorial. A founder mid-speech on a darkened stage, single cool overhead light, audience silhouettes in foreground bokeh leaning forward. The speaker mid-gesture, conviction visible. Eleven faint blue light orbs hover behind suggesting eleven distilled messages. ${PALETTE}`,
    card:
      `Cinematic square. Close-up of a founder mid-sentence on a dimly lit stage, hand extended in conviction, audience bokeh. Faint blue light orbs in the background. ${PALETTE}`,
  },
  'strategic-preparation': {
    hero:
      `Cinematic landscape editorial. An executive at a beautifully lit desk in early morning, intently studying a laptop showing a strategy map (abstract, no readable text). Espresso steaming, brass mechanical pencil, prep notes fanned out. Cool window light from upper-left, single warm desk-lamp rim. The 18-minute pre-meeting flow state. ${PALETTE}`,
    card:
      `Cinematic square. Top-down detail of executive hands on a laptop keyboard, screen reflecting an abstract strategy diagram, brass pencil and prep notes visible. Cool ambient with a single warm rim. Focused calm. ${PALETTE}`,
  },
  'recommendation-pitch': {
    hero:
      `Cinematic landscape editorial. Two professionals seated at a small marble café table near floor-to-ceiling windows. The advisor leans forward with a warm confident gesture, the client listens with genuine interest, slightly leaned in. Out-of-focus city skyline behind them in cool blue dusk. The moment of trust being earned, not asked for. ${PALETTE}`,
    card:
      `Cinematic square. Tight three-quarter view of the leaning advisor mid-recommendation, expressive hand gesture mid-air, the listening client softly out of focus in the foreground. Cool blue dusk light. ${PALETTE}`,
  },
}

/** Convenience export: just the card prompt (used by the homepage HVCO section). */
export const FRAMEWORK_CARD_PROMPTS: Record<string, string> = Object.fromEntries(
  Object.entries(FRAMEWORK_PROMPTS).map(([k, v]) => [k, v.card]),
)
