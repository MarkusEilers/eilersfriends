/**
 * 94 / 87 / 3 % — die drei Zahlen, die den Markt-Status zeigen.
 * Härter als jede Wischwasch-Symptombeschreibung.
 */

const STATS = [
  {
    value: '94 %',
    headline: 'haben keine professionelle Ausbildung',
    body: 'der B2B-Seller in Europa für den Job, den sie täglich machen sollen.',
  },
  {
    value: '87 %',
    headline: 'haben kein wirksames Sparring',
    body: 'in modernen Gesprächstechniken, Social Selling oder überzeugender Präsentation.',
  },
  {
    value: '3 %',
    headline: 'arbeiten ohne vermeidbare Fehler',
    body: 'die wichtige Deals verzögern oder verhindern. Drei Prozent. Mehr nicht.',
  },
]

export function MarketRealityStats() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#FFEBEC', color: '#EB0028', border: '1px solid #F5BBBC' }}
          >
            Die unbequeme Wahrheit
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            In Europa gibt es keine echte
            <br className="hidden sm:block" /> Sales-Ausbildung.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Vertrieb ist einer der anspruchsvollsten Jobs überhaupt. Menschen lesen, Vertrauen aufbauen,
            Entscheidungen beschleunigen, Einwände entwaffnen — alles unter Druck. Aber dafür bildet
            niemand aus. Keine Berufsschule. Kein Studium. Keine anerkannte Zertifizierung.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.value}
              className="rounded-3xl bg-white p-8 border text-center"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="text-6xl font-bold leading-none sm:text-7xl" style={{ color: '#0F1E3A' }}>
                {s.value}
              </div>
              <div className="mt-4 text-base font-bold" style={{ color: '#0D0D0B' }}>
                {s.headline}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
