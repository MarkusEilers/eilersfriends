/**
 * Verfügbarkeit als runde Punkte: vergebene gefüllt, der nächste freie blinkt, der Rest als Kontur.
 * Ausgebucht: alle gefüllt, Hinweis auf das nächste Quartal.
 */
export function SlotDots({ capacity, free, nextOpens, dark = false }: { capacity: number; free: number; nextOpens?: string; dark?: boolean }) {
  const sold = capacity - free
  const fill = dark ? '#fff' : '#1A5FD4'
  return (
    <div className="flex flex-col gap-2.5">
      <style>{`@keyframes msblink{0%,100%{opacity:1}50%{opacity:.15}}`}</style>
      <p className={`text-sm ${dark ? 'text-white/80' : 'text-gray-600'}`}>
        {free === 0 ? (
          <><b className={dark ? 'text-white' : 'text-gray-900'}>Ausgebucht</b> · nächster Durchgang ab {nextOpens}</>
        ) : (
          <><b className={dark ? 'text-white' : 'text-gray-900'}>Nur noch <span style={{ color: dark ? '#fff' : fill }}>{free}</span> von {capacity} Sessions frei</b> · in diesem Quartal</>
        )}
      </p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: capacity }, (_, i) => {
          const isSold = i < sold
          const isNext = i === sold && free > 0
          return (
            <i key={i} className="block h-3.5 w-3.5 rounded-full" style={{
              background: isSold || isNext ? fill : 'transparent',
              boxShadow: isSold ? undefined : `inset 0 0 0 2px ${fill}`,
              animation: isNext ? 'msblink 1.2s ease-in-out infinite' : undefined,
            }} />
          )
        })}
      </div>
    </div>
  )
}
