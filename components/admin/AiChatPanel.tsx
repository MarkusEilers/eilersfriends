'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2, FileText, RefreshCw, Wand2 } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  /** structured payload returned by the AI for application */
  payload?:
    | { kind: 'apply_section'; content: Record<string, unknown> }
    | { kind: 'replace_all'; sections: { type: string; content: Record<string, unknown> }[] }
}

interface SectionContext {
  id: string
  type: string
  content: Record<string, unknown>
}

interface PageContext {
  id: string
  title: string
  slug: string
}

interface Props {
  accent: string
  page: PageContext
  sections: SectionContext[]
  selectedSectionId: string | null
  onApplySection: (content: Record<string, unknown>) => void
  onReplaceAll: (sections: { type: string; content: Record<string, unknown> }[]) => void
  onClose: () => void
}

const QUICK_ACTIONS: { label: string; icon: any; prompt: (ctx: { sectionType?: string }) => string }[] = [
  {
    label: 'Sektion umschreiben',
    icon: RefreshCw,
    prompt: (ctx) =>
      `Schreibe die aktuell ausgewählte ${ctx.sectionType ?? ''}-Sektion in einer prägnanteren, direkteren Tonalität neu — Justin-Welsh-Stil: kurze Sätze, klarer Nutzen, kein Marketing-Schwafel. Behalte alle Felder, ersetze nur die Texte.`,
  },
  {
    label: '5 Headline-Varianten',
    icon: Wand2,
    prompt: () =>
      'Gib mir 5 alternative Headlines für die ausgewählte Sektion. Jede mit anderem Hook (Problem-Frame, Outcome-Frame, Curiosity-Frame, Authority-Frame, Contrarian-Frame). Antworte als chat-Nachricht, nicht als payload.',
  },
  {
    label: 'Inhalte verdichten',
    icon: Sparkles,
    prompt: () =>
      'Kürze die ausgewählte Sektion auf 50% der Länge ohne Substanzverlust. Behalte alle JSON-Felder, schneide nur überflüssige Worte.',
  },
]

export function AiChatPanel({
  accent, page, sections, selectedSectionId,
  onApplySection, onReplaceAll, onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content:
        '👋 Ich bin dein LP-Co-Pilot. Markiere eine Sektion und sag mir, was du brauchst — Headlines, Umschreibungen, ganze Sektionen aus dem Stand. Du kannst auch eine ganze Page aus einem Briefing generieren.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setError(null)
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m) => m.role !== 'system'),
          page: { id: page.id, title: page.title, slug: page.slug },
          sections,
          selectedSectionId,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text || '(keine Antwort)',
        payload: data.payload,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      setError((e as Error).message)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Fehler: ${(e as Error).message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleApply(msg: Message) {
    if (!msg.payload) return
    if (msg.payload.kind === 'apply_section') {
      onApplySection(msg.payload.content)
    } else if (msg.payload.kind === 'replace_all') {
      if (!confirm(`Komplette Page mit ${msg.payload.sections.length} Sektionen ersetzen?`)) return
      onReplaceAll(msg.payload.sections)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accent }} />
          <h3 className="text-sm font-bold" style={{ color: '#0D0D0B' }}>LP Co-Pilot</h3>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </header>

      {/* Context strip */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs">
        <p className="text-gray-400 mb-1">Kontext</p>
        <p>
          <strong className="text-gray-700">{page.title}</strong>
          <span className="text-gray-400"> · {sections.length} Sektionen</span>
        </p>
        {selectedSection && (
          <p className="mt-1 text-gray-500">
            Aktiv: <span className="font-mono">{selectedSection.type}</span>
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="border-b border-gray-100 px-4 py-3 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon
          return (
            <button
              key={qa.label}
              onClick={() => send(qa.prompt({ sectionType: selectedSection?.type }))}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              <Icon size={12} /> {qa.label}
            </button>
          )
        })}
        <button
          onClick={() => send(
            'Generiere mir eine komplette Page aus diesem Briefing — wähle passende Sektionstypen und befülle alle Felder. Briefing: ' +
            (prompt('Briefing eingeben:') || ''),
          )}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          <FileText size={12} /> Aus Briefing
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'text-white'
                  : m.role === 'system'
                    ? 'bg-amber-50 text-amber-900 border border-amber-100'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
              style={m.role === 'user' ? { backgroundColor: accent } : undefined}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.payload && (
                <button
                  onClick={() => handleApply(m)}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold border"
                  style={{ color: accent, borderColor: `${accent}40` }}
                >
                  <Sparkles size={11} />
                  {m.payload.kind === 'apply_section' ? 'Auf Sektion anwenden' : 'Page ersetzen'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Co-Pilot denkt nach…
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="border-t border-gray-100 px-4 py-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedSection ? `Anweisung für ${selectedSection.type}…` : 'Frage oder Anweisung…'}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-orange-300 focus:bg-white"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40"
          style={{ backgroundColor: accent }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  )
}
