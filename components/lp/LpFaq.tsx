'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem { question: string; answer: string }

export function LpFaq({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as FaqItem[]) ?? []
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="px-6 py-16 bg-white">
      <div className="mx-auto max-w-2xl">
        {content.headline && (
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-200">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.question}
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-gray-600">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
