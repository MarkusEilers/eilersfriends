import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/blocks/SectionHeader'
import { TestimonialCard } from '@/components/blocks/TestimonialCard'

const TESTIMONIALS = [
  {
    authorName: 'Dirk Battermann',
    authorRole: 'Geschäftsführer',
    authorCompany: 'Battermann & Partner',
    quote: 'Markus hat uns geholfen, unseren Vertriebsprozess von Grund auf zu systematisieren. Die Ergebnisse haben unsere Erwartungen weit übertroffen.',
  },
  {
    authorName: 'Michael Strohäcker',
    authorRole: 'Founder & CEO',
    authorCompany: 'ScaleUp GmbH',
    quote: 'Nach nur 3 Monaten hatten wir einen klaren, reproduzierbaren Verkaufsprozess. 48% mehr Umsatz ist das Ergebnis.',
  },
  {
    authorName: 'Cornelius Zinow',
    authorRole: 'Vertriebsleiter',
    authorCompany: 'Zinow Technologies',
    quote: 'Die Kombination aus SalesMade Academy und 1:1-Coaching war genau das, was wir gebraucht haben. Wissen + Können + Machen — das funktioniert.',
  },
]

export function TestimonialsSection() {
  const t = useTranslations('testimonials')

  return (
    <section className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.authorName} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
