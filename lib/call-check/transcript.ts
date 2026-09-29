/**
 * Transcript parsing for the Gesprächs-Check.
 *
 * Runs in the browser (to let the user pick which speaker they are) and on the
 * server (to compute the metrics). Pure functions, no dependencies.
 *
 * Accepted input: plain "Name: text" lines as exported by Granola, Teams, Zoom
 * or Google Meet, WebVTT (including <v Name> voice tags) and SRT. Timestamps
 * are stripped. Consecutive lines of the same speaker are merged into one turn.
 */

export interface Turn {
  speaker: string
  text: string
}

export interface ParsedTranscript {
  turns: Turn[]
  speakers: Array<{ name: string; words: number; turns: number }>
  words: number
  /** Could we detect speaker labels at all? Without them the metrics are blind. */
  labelled: boolean
}

const TIMESTAMP_LINE = /^\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?.*$/
const INLINE_TIMESTAMP = /^\s*[\[(]?(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?[\])]?\s*[-–]?\s*/
const SPEAKER_LINE = /^\s*([^:\n]{1,48}?)\s*:\s+(.+)$/
const VTT_VOICE = /^\s*<v\s+([^>]{1,48})>(.*?)(<\/v>)?\s*$/i

/** Words that look like a speaker label but are not ("Hinweis: …", "Note: …"). */
const NOT_A_SPEAKER = /^(https?|note|hinweis|anmerkung|frage|antwort|question|answer|p\.?s|z\.?b|e\.?g|webvtt|kind|language)$/i

function countWords(s: string): number {
  const m = s.trim().match(/\S+/g)
  return m ? m.length : 0
}

export function parseTranscript(raw: string): ParsedTranscript {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  const turns: Turn[] = []
  let labelled = 0
  let pendingSpeaker: string | null = null

  const push = (speaker: string, text: string) => {
    const t = text.trim()
    if (!t) return
    const last = turns[turns.length - 1]
    if (last && last.speaker === speaker) last.text = `${last.text} ${t}`
    else turns.push({ speaker, text: t })
  }

  for (let line of lines) {
    if (!line.trim()) continue
    if (/^WEBVTT/i.test(line) || /^NOTE\b/.test(line) || /^\d+$/.test(line.trim())) continue
    if (TIMESTAMP_LINE.test(line)) continue
    line = line.replace(INLINE_TIMESTAMP, '')

    const voice = VTT_VOICE.exec(line)
    if (voice) {
      labelled++
      push(voice[1].trim(), voice[2])
      pendingSpeaker = voice[1].trim()
      continue
    }

    const sp = SPEAKER_LINE.exec(line)
    if (sp && !NOT_A_SPEAKER.test(sp[1].trim()) && countWords(sp[1]) <= 5) {
      labelled++
      pendingSpeaker = sp[1].trim()
      push(pendingSpeaker, sp[2])
      continue
    }

    // A name alone on a line, with the text on the following lines (Teams export).
    if (countWords(line) <= 4 && !/[.?!]$/.test(line.trim()) && line.trim().length <= 40) {
      const next = line.trim()
      if (/^[A-ZÄÖÜ]/.test(next)) {
        pendingSpeaker = next
        labelled++
        continue
      }
    }

    push(pendingSpeaker ?? '?', line)
  }

  const bySpeaker = new Map<string, { words: number; turns: number }>()
  for (const t of turns) {
    const s = bySpeaker.get(t.speaker) ?? { words: 0, turns: 0 }
    s.words += countWords(t.text)
    s.turns += 1
    bySpeaker.set(t.speaker, s)
  }
  const speakers = [...bySpeaker.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.words - a.words)

  const words = speakers.reduce((n, s) => n + s.words, 0)
  const realSpeakers = speakers.filter((s) => s.name !== '?')
  return { turns, speakers, words, labelled: labelled > 0 && realSpeakers.length >= 2 }
}

export interface CallMetrics {
  words: number
  sellerShare: number | null
  sellerQuestions: number
  /** Seller turns that contain two or more questions. */
  serialQuestionTurns: number
  longestSellerMonologue: number
  customerTurns: number
  sellerTurns: number
}

/**
 * Metrics that do not need a model. They are exact, cost nothing, and give the
 * model facts to anchor on instead of impressions.
 */
export function computeMetrics(p: ParsedTranscript, seller: string | null): CallMetrics {
  if (!p.labelled || !seller) {
    return {
      words: p.words, sellerShare: null, sellerQuestions: 0, serialQuestionTurns: 0,
      longestSellerMonologue: 0, customerTurns: 0, sellerTurns: 0,
    }
  }
  let sellerWords = 0, questions = 0, serial = 0, longest = 0, sellerTurns = 0, customerTurns = 0
  for (const t of p.turns) {
    const w = countWords(t.text)
    if (t.speaker === seller) {
      sellerTurns++
      sellerWords += w
      const q = (t.text.match(/\?/g) ?? []).length
      questions += q
      if (q >= 2) serial++
      if (w > longest) longest = w
    } else if (t.speaker !== '?') {
      customerTurns++
    }
  }
  return {
    words: p.words,
    sellerShare: p.words ? Math.round((sellerWords / p.words) * 100) : null,
    sellerQuestions: questions,
    serialQuestionTurns: serial,
    longestSellerMonologue: longest,
    customerTurns,
    sellerTurns,
  }
}

/** Compact form for the model: one line per turn, seller marked. */
export function renderForModel(p: ParsedTranscript, seller: string | null): string {
  return p.turns
    .map((t) => {
      const role = seller ? (t.speaker === seller ? 'VERKÄUFER' : 'KUNDE') : 'SPRECHER'
      return `[${role} · ${t.speaker}] ${t.text}`
    })
    .join('\n')
}
