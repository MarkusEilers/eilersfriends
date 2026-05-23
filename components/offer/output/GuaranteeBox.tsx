import { Shield } from 'lucide-react'

/**
 * Garantie-Box vor Pricing — "Whatever it takes". Niemand-bleibt-allein.
 */
export function GuaranteeBox({ text }: { text?: string }) {
  const body = text?.trim() || 'Wir bleiben dabei, bis es funktioniert. Wenn unser Programm nicht den Mehrwert liefert, den wir Dir versprechen, machen wir weiter — auf unseren Kosten. Whatever it takes.'
  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-3xl">
        <div
          className="rounded-3xl p-8 sm:p-10"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EBF1FF 100%)',
            border: '1px solid #BBCFF5',
            boxShadow: '0 8px 32px rgba(15,30,58,0.08)',
          }}
        >
          <div className="flex items-start gap-5">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#1A5FD4', color: '#fff' }}
            >
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>
                Unsere Garantie
              </p>
              <h3 className="mt-2 text-xl font-bold sm:text-2xl" style={{ color: '#0D0D0B' }}>
                Whatever it takes.
              </h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: '#374151' }}>
                {body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
