import type { Lang } from './types'

/** Oberflächen-Texte der ASK-Funnels (alle Funnels teilen sie). */
export const UI: Record<Lang, {
  start: string; resumed: string; stageOf: string; qOf: string; back: string; next: string; computing: string
  resultEyebrow: string; firstRed: string; firstYellow: string; allGreen: string; allGreenText: string
  redCount: (n: number) => string; journey: string; legendRed: string; legendYellow: string; legendGreen: string
  lockedTitle: string; locked: string[]; email: string; company: string; phone: string; phoneOpt: string; firstName: string; firstNameOpt: string
  consent: string; privacy: string; submit: string; sending: string; sentTitle: string; sentText: (m: string) => string; resend: string; resent: string
  errMail: string; errCompany: string; errPhone: string; errConsent: string; errGeneric: string; restart: string
  report: { eyebrow: string; for: string; forTitle: (c: string) => string; date: string; overview: string; overviewSub: string; order: string; orderSub: string; first: string; then: string; after: string
    fix: string; strengths: string; strengthsNone: string; rec: string; other: string; frameworks: string; frameworksText: string; frameworksBtn: string
    print: string; target: string; score: string; noRed: string; notConfirmed: string; notFound: string; method: string }
}> = {
  de: {
    start: 'Diagnose starten →', resumed: 'Eure ersten Antworten sind übernommen. Weiter geht es hier.',
    stageOf: 'Stufe {n} von {t}', qOf: 'Frage {n} von {t}', back: '← Zurück', next: 'Weiter →', computing: 'Wir rechnen Euer Ergebnis …',
    resultEyebrow: 'Euer Kurzergebnis', firstRed: 'Euer Engpass Nr. 1', firstYellow: 'Euer größter Hebel', allGreen: 'Keine Stufe im roten Bereich',
    allGreenText: 'Eure Umsatz-Reise läuft auf allen neun Stufen solide. Der volle Report zeigt, wo Ihr trotzdem am meisten herausholt.',
    redCount: (n) => (n === 1 ? '1 Stufe steht auf Rot.' : `${n} Stufen stehen auf Rot.`),
    journey: 'Eure Umsatz-Reise', legendRed: 'Engpass', legendYellow: 'Luft nach oben', legendGreen: 'läuft',
    lockedTitle: 'Euer voller Report, kostenlos per Mail',
    locked: ['Werte für alle neun Stufen, neben dem Zielwert', 'Eure Engpässe in der Reihenfolge: zuerst, danach, dann', 'Was Ihr bei Engpass Nr. 1 als Erstes tut', 'Unsere Empfehlung für Euren nächsten Schritt'],
    email: 'Geschäftliche E-Mail', company: 'Firma', phone: 'Mobilnummer', phoneOpt: 'optional, für einen kurzen Rückruf zum Ergebnis', firstName: 'Vorname', firstNameOpt: 'optional',
    consent: 'Ich bin einverstanden, dass Eilers+Friends meine Angaben speichert, um mir den Report zu schicken und mich zu meinem Ergebnis zu kontaktieren, per Mail und, wenn ich eine Nummer angebe, telefonisch. Widerruf jederzeit per Mail.',
    privacy: 'Datenschutz', submit: 'Vollen Report anfordern →', sending: 'Wird gesendet …',
    sentTitle: 'Prüft Euer Postfach',
    sentText: (m) => `Wir haben den Link zu Eurem Report an ${m} geschickt. Ein Klick bestätigt die Adresse und öffnet den Report. Nichts angekommen? Schaut im Spam-Ordner nach.`,
    resend: 'Mail noch einmal senden', resent: 'Gesendet.',
    errMail: 'Bitte gebt eine gültige E-Mail-Adresse ein.', errCompany: 'Bitte gebt Eure Firma an.', errPhone: 'Die Nummer sieht unvollständig aus.', errConsent: 'Bitte bestätigt kurz die Einwilligung.', errGeneric: 'Das hat nicht geklappt. Versucht es bitte noch einmal.',
    restart: '↺ Neu starten',
    report: {
      eyebrow: 'Report', for: 'für', forTitle: (c) => `Für ${c}`, date: 'Stand', overview: 'Alle neun Stufen', overviewSub: 'Jede Stufe kann nur verarbeiten, was die davor liefert. Der Strich zeigt den Zielwert.',
      order: 'In dieser Reihenfolge', orderSub: 'Der erste Engpass bremst alles dahinter. Deshalb zuerst er, dann der nächste.', first: 'Zuerst', then: 'Danach', after: 'Dann',
      fix: 'Erster Schritt', strengths: 'Was schon läuft', strengthsNone: 'Noch keine Stufe im grünen Bereich. Umso mehr bringt der erste Engpass.',
      rec: 'Unsere Empfehlung', other: 'Auch möglich', frameworks: 'Zum Weiterlesen', frameworksText: 'Unsere Frameworks zu jeder Stufe der Umsatz-Reise, kostenlos.', frameworksBtn: 'Frameworks ansehen →',
      print: 'Drucken oder als PDF sichern', target: 'Ziel', score: 'Wert', noRed: 'Keine Stufe steht auf Rot. Die Reihenfolge unten zeigt die Stufen mit dem meisten Spielraum.',
      notConfirmed: 'Dieser Report ist noch nicht freigeschaltet. Bitte nutzt den Link aus der Mail.', notFound: 'Diesen Report gibt es nicht.',
      method: 'So rechnen wir: zwei Fragen je Stufe, jede Antwort 0 bis 100 Punkte, die Stufe ist der Mittelwert. Rot heißt unter der Engpass-Schwelle, grün ab dem Zielwert.',
    },
  },
  en: {
    start: 'Start the diagnostic →', resumed: 'Your first answers have been carried over. Continue here.',
    stageOf: 'Stage {n} of {t}', qOf: 'Question {n} of {t}', back: '← Back', next: 'Next →', computing: 'Calculating your result …',
    resultEyebrow: 'Your quick result', firstRed: 'Your bottleneck no. 1', firstYellow: 'Your biggest lever', allGreen: 'No stage in the red',
    allGreenText: 'Your revenue journey runs solidly across all nine stages. The full report shows where you can still gain the most.',
    redCount: (n) => (n === 1 ? '1 stage is red.' : `${n} stages are red.`),
    journey: 'Your revenue journey', legendRed: 'bottleneck', legendYellow: 'room to grow', legendGreen: 'working',
    lockedTitle: 'Your full report, free by email',
    locked: ['Scores for all nine stages, next to the target', 'Your bottlenecks in order: first, then, after that', 'What to do first about bottleneck no. 1', 'Our recommendation for your next step'],
    email: 'Work email', company: 'Company', phone: 'Mobile number', phoneOpt: 'optional, for a short call about your result', firstName: 'First name', firstNameOpt: 'optional',
    consent: 'I agree that Eilers+Friends stores my details to send me the report and to contact me about my result, by email and, if I provide a number, by phone. I can withdraw at any time by email.',
    privacy: 'Privacy', submit: 'Get the full report →', sending: 'Sending …',
    sentTitle: 'Check your inbox',
    sentText: (m) => `We sent the link to your report to ${m}. One click confirms the address and opens the report. Nothing there? Check your spam folder.`,
    resend: 'Send the email again', resent: 'Sent.',
    errMail: 'Please enter a valid email address.', errCompany: 'Please enter your company.', errPhone: 'The number looks incomplete.', errConsent: 'Please confirm your consent.', errGeneric: 'That did not work. Please try again.',
    restart: '↺ Start over',
    report: {
      eyebrow: 'Report', for: 'for', forTitle: (c) => `For ${c}`, date: 'As of', overview: 'All nine stages', overviewSub: 'Each stage can only work with what the stage before delivers. The tick marks the target.',
      order: 'In this order', orderSub: 'The first bottleneck slows everything behind it. So fix it first, then the next one.', first: 'First', then: 'Then', after: 'After that',
      fix: 'First step', strengths: 'What already works', strengthsNone: 'No stage in the green yet. All the more reason to start with bottleneck no. 1.',
      rec: 'Our recommendation', other: 'Also possible', frameworks: 'Further reading', frameworksText: 'Our frameworks for every stage of the revenue journey, free.', frameworksBtn: 'See the frameworks →',
      print: 'Print or save as PDF', target: 'target', score: 'score', noRed: 'No stage is red. The order below shows the stages with the most room to grow.',
      notConfirmed: 'This report is not unlocked yet. Please use the link in the email.', notFound: 'This report does not exist.',
      method: 'How we calculate: two questions per stage, each answer 0 to 100 points, the stage is the average. Red means below the bottleneck threshold, green from the target up.',
    },
  },
  es: {
    start: 'Empezar el diagnóstico →', resumed: 'Hemos guardado vuestras primeras respuestas. Seguid aquí.',
    stageOf: 'Etapa {n} de {t}', qOf: 'Pregunta {n} de {t}', back: '← Atrás', next: 'Siguiente →', computing: 'Calculando vuestro resultado …',
    resultEyebrow: 'Vuestro resultado rápido', firstRed: 'Vuestro cuello de botella n.º 1', firstYellow: 'Vuestra mayor palanca', allGreen: 'Ninguna etapa en rojo',
    allGreenText: 'Vuestro recorrido de ingresos funciona bien en las nueve etapas. El informe completo muestra dónde aún podéis ganar más.',
    redCount: (n) => (n === 1 ? '1 etapa está en rojo.' : `${n} etapas están en rojo.`),
    journey: 'Vuestro recorrido de ingresos', legendRed: 'cuello de botella', legendYellow: 'margen de mejora', legendGreen: 'funciona',
    lockedTitle: 'Vuestro informe completo, gratis por email',
    locked: ['Puntuación de las nueve etapas, junto al objetivo', 'Vuestros cuellos de botella en orden: primero, después, luego', 'Qué hacer primero con el cuello de botella n.º 1', 'Nuestra recomendación para el siguiente paso'],
    email: 'Email de empresa', company: 'Empresa', phone: 'Móvil', phoneOpt: 'opcional, para una llamada breve sobre el resultado', firstName: 'Nombre', firstNameOpt: 'opcional',
    consent: 'Acepto que Eilers+Friends guarde mis datos para enviarme el informe y contactarme sobre mi resultado, por email y, si indico un número, por teléfono. Puedo revocarlo en cualquier momento por email.',
    privacy: 'Privacidad', submit: 'Pedir el informe completo →', sending: 'Enviando …',
    sentTitle: 'Revisad vuestra bandeja de entrada',
    sentText: (m) => `Hemos enviado el enlace a vuestro informe a ${m}. Un clic confirma la dirección y abre el informe. ¿No ha llegado? Mirad en la carpeta de spam.`,
    resend: 'Enviar el email de nuevo', resent: 'Enviado.',
    errMail: 'Introducid un email válido.', errCompany: 'Indicad vuestra empresa.', errPhone: 'El número parece incompleto.', errConsent: 'Confirmad el consentimiento.', errGeneric: 'No ha funcionado. Intentadlo de nuevo.',
    restart: '↺ Empezar de nuevo',
    report: {
      eyebrow: 'Informe', for: 'para', forTitle: (c) => `Para ${c}`, date: 'Fecha', overview: 'Las nueve etapas', overviewSub: 'Cada etapa solo puede trabajar con lo que entrega la anterior. La marca indica el objetivo.',
      order: 'En este orden', orderSub: 'El primer cuello de botella frena todo lo demás. Por eso primero él, luego el siguiente.', first: 'Primero', then: 'Después', after: 'Luego',
      fix: 'Primer paso', strengths: 'Lo que ya funciona', strengthsNone: 'Todavía ninguna etapa en verde. Razón de más para empezar por el n.º 1.',
      rec: 'Nuestra recomendación', other: 'También posible', frameworks: 'Para seguir leyendo', frameworksText: 'Nuestros frameworks para cada etapa del recorrido de ingresos, gratis.', frameworksBtn: 'Ver los frameworks →',
      print: 'Imprimir o guardar como PDF', target: 'objetivo', score: 'puntuación', noRed: 'Ninguna etapa está en rojo. El orden de abajo muestra las etapas con más margen.',
      notConfirmed: 'Este informe todavía no está desbloqueado. Usad el enlace del email.', notFound: 'Este informe no existe.',
      method: 'Cómo calculamos: dos preguntas por etapa, cada respuesta de 0 a 100 puntos, la etapa es la media. Rojo significa por debajo del umbral, verde a partir del objetivo.',
    },
  },
}

export const localePrefix = (l: Lang) => (l === 'de' ? '' : `/${l}`)

/** Texte der neu gestalteten Ergebnis- und Report-Ansicht. */
export const UI2: Record<Lang, {
  toReport: string; coverTitle: string; coverFor: string; coverEmpty: string; logoSlot: string; lockChip: string; okChip: string
  formTitle: string; formSub: string; trio: [string, string, string]; score: string; scoreOf: string; bottleneck: string; lever: string
  stagesTitle: string; recBy: string; madeFor: string; target: string
}> = {
  de: {
    toReport: 'Vollen Report holen ↓', coverTitle: 'Umsatz-Engpass-Diagnose · Report', coverFor: 'Für', coverEmpty: 'Eure Firma', logoSlot: 'Euer Logo',
    lockChip: 'Wird nach Bestätigung freigeschaltet', okChip: 'Unterwegs in Euer Postfach',
    formTitle: 'Euer voller Report.', formSub: 'Kostenlos, mit Eurem Logo, in zwei Minuten im Postfach.',
    trio: ['rot · Engpass', 'gelb · Luft', 'grün · läuft'], score: 'Reise-Score', scoreOf: 'von 100', bottleneck: 'Engpass Nr. 1', lever: 'Größter Hebel',
    stagesTitle: 'Wo Ihr steht', recBy: 'Markus Eilers · Eilers+Friends', madeFor: 'Erstellt für', target: 'Ziel',
  },
  en: {
    toReport: 'Get the full report ↓', coverTitle: 'Revenue Bottleneck Diagnostic · Report', coverFor: 'For', coverEmpty: 'Your company', logoSlot: 'Your logo',
    lockChip: 'Unlocks after confirmation', okChip: 'On its way to your inbox',
    formTitle: 'Your full report.', formSub: 'Free, with your logo, in your inbox in two minutes.',
    trio: ['red · bottleneck', 'yellow · room', 'green · working'], score: 'Journey score', scoreOf: 'of 100', bottleneck: 'Bottleneck no. 1', lever: 'Biggest lever',
    stagesTitle: 'Where you stand', recBy: 'Markus Eilers · Eilers+Friends', madeFor: 'Prepared for', target: 'target',
  },
  es: {
    toReport: 'Pedir el informe completo ↓', coverTitle: 'Diagnóstico de cuellos de botella · Informe', coverFor: 'Para', coverEmpty: 'Vuestra empresa', logoSlot: 'Vuestro logo',
    lockChip: 'Se desbloquea tras confirmar', okChip: 'En camino a vuestro email',
    formTitle: 'Vuestro informe completo.', formSub: 'Gratis, con vuestro logo, en vuestro email en dos minutos.',
    trio: ['rojo · cuello', 'amarillo · margen', 'verde · funciona'], score: 'Puntuación', scoreOf: 'de 100', bottleneck: 'Cuello de botella n.º 1', lever: 'Mayor palanca',
    stagesTitle: 'Dónde estáis', recBy: 'Markus Eilers · Eilers+Friends', madeFor: 'Preparado para', target: 'objetivo',
  },
}
