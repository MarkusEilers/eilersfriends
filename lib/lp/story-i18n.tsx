/** Feste Texte der Story-Bausteine (Squeeze/Checkout) in DE/EN/ES. Inhalte selbst kommen aus dem LP-System. */
export type StoryLang = 'de' | 'en' | 'es'
export const storyLang = (l?: string | null): StoryLang => (l === 'en' || l === 'es' ? l : 'de')

const MONTHS: Record<StoryLang, string[]> = {
  de: ['Januar', 'April', 'Juli', 'Oktober'], en: ['January', 'April', 'July', 'October'], es: ['enero', 'abril', 'julio', 'octubre'],
}
export function quarterLabel(nextOpensDe: string, l: StoryLang) {
  const i = MONTHS.de.findIndex((m) => nextOpensDe.startsWith(m))
  return i < 0 ? nextOpensDe : nextOpensDe.replace(MONTHS.de[i], MONTHS[l][i])
}

export const ST = {
  de: {
    soldOut: 'Ausgebucht', nextFrom: 'nächster Durchgang ab', onlyLeft: (f: number, c: number) => <>Nur noch <em>{f}</em> von {c} Sessions frei</>, thisQuarter: ' · in diesem Quartal',
    priceNote: 'nur für die nächsten {n}', bookNow: 'Jetzt buchen', trust: 'Unternehmen, die uns vertrauen', faq: 'Häufige Fragen',
    first: 'Vorname', last: 'Nachname', workEmail: 'Firmen-E-Mail', company: 'Firma',
    terms: (agb: React.ReactNode, ds: React.ReactNode) => <>Ich akzeptiere die {agb} und habe die {ds} gelesen.</>, agb: 'AGB', privacy: 'Datenschutzerklärung',
    toStripe: 'Weiter zu Stripe …', errTerms: 'Bitte bestätigt die AGB und die Datenschutzerklärung.', errPay: 'Die Zahlung konnte nicht gestartet werden.',
    soldOutBox: (q: string) => <><b>Ausgebucht.</b> Der nächste Durchgang startet im {q}. Schreibt uns an <a href="mailto:team@eilersfriends.com">team@eilersfriends.com</a>, dann merken wir Euch vor.</>,
    errGeneric: 'Das hat nicht geklappt. Bitte versucht es noch einmal.', quarterSoldOut: 'Dieses Quartal ist ausgebucht.', wait: 'Einen Moment …',
  },
  en: {
    soldOut: 'Sold out', nextFrom: 'next round from', onlyLeft: (f: number, c: number) => <>Only <em>{f}</em> of {c} sessions left</>, thisQuarter: ' · this quarter',
    priceNote: 'only for the next {n}', bookNow: 'Book now', trust: 'Companies that trust us', faq: 'Frequently asked questions',
    first: 'First name', last: 'Last name', workEmail: 'Work email', company: 'Company',
    terms: (agb: React.ReactNode, ds: React.ReactNode) => <>I accept the {agb} and have read the {ds}.</>, agb: 'terms', privacy: 'privacy policy',
    toStripe: 'On to Stripe …', errTerms: 'Please accept the terms and the privacy policy.', errPay: 'The payment could not be started.',
    soldOutBox: (q: string) => <><b>Sold out.</b> The next round starts in {q}. Write to <a href="mailto:team@eilersfriends.com">team@eilersfriends.com</a> and we will put you on the list.</>,
    errGeneric: 'That did not work. Please try again.', quarterSoldOut: 'This quarter is sold out.', wait: 'One moment …',
  },
  es: {
    soldOut: 'Agotado', nextFrom: 'próxima ronda desde', onlyLeft: (f: number, c: number) => <>Solo quedan <em>{f}</em> de {c} sesiones</>, thisQuarter: ' · este trimestre',
    priceNote: 'solo para los próximos {n}', bookNow: 'Reservar ahora', trust: 'Empresas que confían en nosotros', faq: 'Preguntas frecuentes',
    first: 'Nombre', last: 'Apellido', workEmail: 'Email de empresa', company: 'Empresa',
    terms: (agb: React.ReactNode, ds: React.ReactNode) => <>Acepto las {agb} y he leído la {ds}.</>, agb: 'condiciones generales', privacy: 'política de privacidad',
    toStripe: 'Continuar a Stripe …', errTerms: 'Acepta las condiciones generales y la política de privacidad.', errPay: 'No se pudo iniciar el pago.',
    soldOutBox: (q: string) => <><b>Agotado.</b> La próxima ronda empieza en {q}. Escríbenos a <a href="mailto:team@eilersfriends.com">team@eilersfriends.com</a> y te apuntamos.</>,
    errGeneric: 'No ha funcionado. Inténtalo de nuevo.', quarterSoldOut: 'Este trimestre está agotado.', wait: 'Un momento …',
  },
} as const
