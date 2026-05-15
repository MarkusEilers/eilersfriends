import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/blocks/SectionHeader'
import { TestimonialCard } from '@/components/blocks/TestimonialCard'

interface TestimonialEntry {
  authorName: string
  authorRole: string
  authorCompany?: string
  quote: string
}

export function TestimonialsSection() {
  const t = useTranslations('testimonials')
  // Cards are arrays in messages JSON. useTranslations().raw() returns the raw JSON value.
  const cards = (t.raw('cards') as TestimonialEntry[]) ?? []

  return (
    <section id="ergebnisse" className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {cards.map((testimonial) => (
            <TestimonialCard key={testimonial.authorName} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
