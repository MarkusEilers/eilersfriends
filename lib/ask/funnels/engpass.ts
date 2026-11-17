import type { AskFunnelDef, AskOption, AskQuestion, L3 } from '../types'

/**
 * Funnel #1 — Umsatz-Engpass-Diagnostiker.
 * Grundlage: quiz-diagnostik-spec.md (9 Stufen × 2 Fragen, Antwort A=0 … D=100,
 * Stufe = Mittel, erste rote Stufe = bindender Engpass).
 */

const t = (de: string, en: string, es: string): L3 => ({ de, en, es })
const SCORES = [0, 33, 66, 100]
function opts(de: string[], en: string[], es: string[]): AskOption[] {
  return de.map((_, i) => ({ label: t(de[i], en[i], es[i]), score: SCORES[i] }))
}
const q = (id: string, prompt: L3, options: AskOption[], hint?: L3): AskQuestion => ({ id, prompt, options, hint })

export const ENGPASS: AskFunnelDef = {
  slug: 'engpass',
  template: 'constraint',
  title: t(
    'Wo bremst Euer Umsatz?',
    'Where is your revenue getting stuck?',
    '¿Dónde se frena vuestra facturación?',
  ),
  kicker: t('Umsatz-Engpass-Diagnose', 'Revenue Bottleneck Diagnostic', 'Diagnóstico de cuellos de botella'),
  intro: t(
    '18 kurze Fragen entlang Eurer Umsatz-Reise, von der Sichtbarkeit bis zum Wachstum mit Bestandskunden. Am Ende seht Ihr, welche Stufe alles dahinter bremst und was Ihr zuerst angehen solltet.',
    '18 short questions along your revenue journey, from visibility to growing existing customers. At the end you see which stage is holding back everything behind it, and what to fix first.',
    '18 preguntas breves a lo largo de vuestro recorrido de ingresos, desde la visibilidad hasta el crecimiento con clientes actuales. Al final veréis qué etapa frena todo lo que viene detrás y qué conviene resolver primero.',
  ),
  promise: [
    t('Ampel für alle 9 Stufen Eurer Umsatz-Reise', 'Traffic light for all 9 stages of your revenue journey', 'Semáforo para las 9 etapas de vuestro recorrido'),
    t('Euer Engpass Nr. 1, sofort nach der letzten Frage', 'Your bottleneck no. 1, right after the last question', 'Vuestro cuello de botella n.º 1, nada más terminar'),
    t('Voller Report mit Reihenfolge: zuerst, danach, dann', 'Full report with the order: first, then, after that', 'Informe completo con el orden: primero, después, luego'),
  ],
  duration: t('ca. 3 Minuten · ein Klick pro Frage', 'about 3 minutes · one tap per question', 'unos 3 minutos · un clic por pregunta'),
  contact: { phone: 'optional' },
  multiRed: { min: 3, cta: 'strategy' },
  allGreenCta: 'strategy',
  teaser: {
    headline: t('Wo bremst Euer Umsatz?', 'Where is your revenue getting stuck?', '¿Dónde se frena vuestra facturación?'),
    sub: t(
      'Drei Fragen jetzt, der Rest in drei Minuten. Am Ende wisst Ihr, welche Stufe alles dahinter bremst.',
      'Three questions now, the rest in three minutes. At the end you know which stage is holding back everything behind it.',
      'Tres preguntas ahora, el resto en tres minutos. Al final sabréis qué etapa frena todo lo demás.',
    ),
    questionIds: ['f1_1', 'f2_2', 'f4_1'],
    button: t('Weiter zur vollen Diagnose →', 'Continue to the full diagnostic →', 'Seguir con el diagnóstico completo →'),
  },
  ctas: {
    screening: {
      title: t('Kostenloses Messaging-Screening', 'Free messaging screening', 'Messaging screening gratuito'),
      text: t(
        'In 30 Minuten schauen wir mit Euch auf Website und Botschaft. Ihr seht, wo Interessenten aussteigen und welchen Satz Ihr zuerst ändert.',
        'In 30 minutes we look at your website and your message with you. You see where prospects drop off and which sentence to change first.',
        'En 30 minutos revisamos con vosotros la web y el mensaje. Veréis dónde se van los interesados y qué frase cambiar primero.',
      ),
      button: t('Messaging-Screening anfragen →', 'Request a messaging screening →', 'Solicitar messaging screening →'),
      href: '/schedule/markus/kennenlernen-30',
    },
    mystery: {
      title: t('Startet mit Mystery Shopping', 'Start with Mystery Shopping', 'Empezad con Mystery Shopping'),
      text: t(
        'Bevor Ihr in Training investiert: Findet heraus, was in Euren Gesprächen wirklich passiert. Wir rufen Euer Team als echter Interessent an und schicken Euch einen 14-seitigen Report, plus eine Live-Session zum wichtigsten Skill.',
        "Before you invest in training, find out what really happens in your team's calls. We call your team as a real prospect and send you a 14-page report, plus a live session on the skill that matters most.",
        'Antes de invertir en formación, descubrid qué pasa de verdad en las llamadas de vuestro equipo. Llamamos a vuestro equipo como un cliente real y os enviamos un informe de 14 páginas, más una sesión en directo sobre la habilidad que más importa.',
      ),
      button: t('In einem Gespräch herausfinden — für 1 € →', 'Find out in one call — for 1€ →', 'Descubridlo en una llamada — por 1 € →'),
      href: '/mystery-shopping',
    },
    strategy: {
      title: t('Kostenloses Strategiegespräch mit Markus', 'Free strategy session with Markus', 'Sesión estratégica gratuita con Markus'),
      text: t(
        'Eine Stunde zu Eurer Situation: wo Ihr steht, welcher Engpass zuerst dran ist und wie andere Teams das gelöst haben. Kein Pitch.',
        'One hour on your situation: where you stand, which bottleneck comes first and how other teams solved it. No pitch.',
        'Una hora sobre vuestra situación: dónde estáis, qué cuello de botella va primero y cómo lo resolvieron otros equipos. Sin pitch.',
      ),
      button: t('Strategiegespräch buchen →', 'Book a strategy session →', 'Reservar sesión estratégica →'),
      href: '/schedule/markus/strategie-60',
    },
  },
  stages: [
    {
      key: 'visibility', area: 'marketing', cta: 'screening',
      name: t('Sichtbarkeit', 'Visibility', 'Visibilidad'),
      questions: [
        q('f1_1',
          t('Wie viele Eurer idealen Zielkunden wissen überhaupt, dass es Euch gibt?', 'How many of your ideal customers even know you exist?', '¿Cuántos de vuestros clientes ideales saben siquiera que existís?'),
          opts(['Fast keine', 'Eine Handvoll', 'Ein relevanter Teil', 'Die meisten unserer Zielgruppe'], ['Almost none', 'A handful', 'A relevant share', 'Most of our target group'], ['Casi ninguno', 'Un puñado', 'Una parte relevante', 'La mayoría de nuestro público'])),
        q('f1_2',
          t('Wie regelmäßig seid Ihr dort präsent, wo Eure Zielkunden sich informieren?', 'How consistently are you present where your customers look for information?', '¿Con qué regularidad estáis presentes donde se informan vuestros clientes?'),
          opts(['Gar nicht', 'Sporadisch', 'Regelmäßig auf 1–2 Kanälen', 'Systematisch und auf mehreren Kanälen'], ['Not at all', 'Sporadically', 'Regularly on 1–2 channels', 'Systematically, across several channels'], ['Nada', 'Esporádicamente', 'Con regularidad en 1–2 canales', 'Sistemáticamente y en varios canales'])),
      ],
      diagnosis: t(
        'Ihr habt die Antwort, aber zu wenige Eurer Zielkunden wissen, dass es Euch gibt. Alles dahinter bleibt Zufall, solange die Reichweite fehlt.',
        'You have the answer, but too few of your target customers know you exist. Everything behind it stays luck as long as reach is missing.',
        'Tenéis la respuesta, pero muy pocos de vuestros clientes objetivo saben que existís. Todo lo demás queda en manos del azar mientras falte alcance.',
      ),
      fixFirst: t('Sichtbar werden, wo Eure Käufer hinschauen.', 'Become visible where your buyers are looking.', 'Haceros visibles donde miran vuestros compradores.'),
      strength: t('Eure Zielkunden kennen Euch. Darauf lässt sich aufbauen.', 'Your target customers know you. That is something to build on.', 'Vuestros clientes objetivo os conocen. Sobre eso se puede construir.'),
      insightAfter: t(
        'Warum wir oben anfangen: Jede Stufe Eurer Umsatz-Reise kann nur verarbeiten, was die Stufe davor liefert. Der erste Engpass bremst alles dahinter.',
        'Why we start at the top: each stage of your revenue journey can only work with what the stage before delivers. The first bottleneck slows everything behind it.',
        'Por qué empezamos arriba: cada etapa de vuestro recorrido solo puede trabajar con lo que le entrega la anterior. El primer cuello de botella frena todo lo que viene detrás.',
      ),
    },
    {
      key: 'curiosity', area: 'marketing', cta: 'screening',
      name: t('Curiosity', 'Curiosity', 'Curiosidad'),
      questions: [
        q('f2_1',
          t('Ein Zielkunde sieht Eure Startseite oder Euer Profil. Entsteht Neugier oder „noch so einer“?', 'A prospect sees your homepage or profile. Do they get curious, or think “just another one”?', 'Un cliente potencial ve vuestra web o vuestro perfil. ¿Siente curiosidad o piensa «otro más»?'),
          opts(['„Noch so einer“', 'Selten Neugier', 'Oft interessiert', 'Sofort neugierig'], ['“Just another one”', 'Rarely curious', 'Often interested', 'Instantly curious'], ['«Otro más»', 'Rara vez curiosidad', 'A menudo interés', 'Curiosidad inmediata'])),
        q('f2_2',
          t('Ist in 10 Sekunden klar, was Ihr anders macht und warum das zählt?', 'Is it clear within 10 seconds what you do differently and why it matters?', '¿Queda claro en 10 segundos qué hacéis distinto y por qué importa?'),
          opts(['Überhaupt nicht', 'Ansatzweise', 'Größtenteils', 'Glasklar'], ['Not at all', 'Partly', 'Mostly', 'Crystal clear'], ['En absoluto', 'Más o menos', 'En gran parte', 'Clarísimo'])),
      ],
      diagnosis: t(
        'Ihr werdet gesehen, aber überflogen. Wenn in 10 Sekunden nicht ankommt, was Euch anders macht, klickt der Rest weiter.',
        'You get seen, but skimmed. If what makes you different does not land within 10 seconds, the rest click away.',
        'Os ven, pero de pasada. Si en 10 segundos no llega qué os hace distintos, el resto sigue de largo.',
      ),
      fixFirst: t('Eine Botschaft, die neugierig macht.', 'A message that makes people curious.', 'Un mensaje que despierte curiosidad.'),
      strength: t('Eure Botschaft macht neugierig.', 'Your message makes people curious.', 'Vuestro mensaje despierta curiosidad.'),
    },
    {
      key: 'demand', area: 'marketing', cta: 'screening',
      name: t('Demand', 'Demand', 'Demanda'),
      questions: [
        q('f3_1',
          t('Kommt Nachfrage aktiv auf Euch zu, oder müsst Ihr jedem Deal hinterherlaufen?', 'Does demand come to you, or do you have to chase every deal?', '¿La demanda llega sola o tenéis que perseguir cada deal?'),
          opts(['Wir laufen allem hinterher', 'Selten kommt jemand von sich aus', 'Gemischt', 'Nachfrage kommt planbar'], ['We chase everything', 'Rarely inbound', 'Mixed', 'Demand comes predictably'], ['Lo perseguimos todo', 'Rara vez llegan solos', 'Mixto', 'La demanda llega de forma previsible'])),
        q('f3_2',
          t('Erzeugt Ihr selbst Nachfrage, etwa durch Aufklärung und Inhalte, oder wartet Ihr auf vorhandenen Bedarf?', 'Do you create demand yourselves, through education and content, or wait for existing need?', '¿Generáis demanda vosotros mismos, con formación y contenidos, o esperáis a que exista la necesidad?'),
          opts(['Wir warten', 'Wenig aktiv', 'Teilweise aktiv', 'Wir erzeugen Nachfrage systematisch'], ['We wait', 'Not very active', 'Partly active', 'We create demand systematically'], ['Esperamos', 'Poco activos', 'En parte activos', 'Generamos demanda sistemáticamente'])),
      ],
      diagnosis: t(
        'Ihr lauft jedem Deal hinterher, statt dass Nachfrage zu Euch kommt. Wer nur auf vorhandenen Bedarf wartet, konkurriert immer über den Preis.',
        'You chase every deal instead of demand coming to you. If you only wait for existing need, you always compete on price.',
        'Perseguís cada deal en lugar de que la demanda llegue a vosotros. Quien solo espera la necesidad existente compite siempre en precio.',
      ),
      fixFirst: t('Nachfrage aktiv erzeugen, statt auf vorhandenen Bedarf zu warten.', 'Create demand actively instead of waiting for existing need.', 'Generar demanda activamente en lugar de esperar a la necesidad existente.'),
      strength: t('Nachfrage kommt zu Euch.', 'Demand comes to you.', 'La demanda llega a vosotros.'),
    },
    {
      key: 'leadgen', area: 'marketing', cta: 'strategy',
      name: t('Lead Gen', 'Lead Gen', 'Generación de leads'),
      questions: [
        q('f4_1',
          t('Wie viele qualifizierte Erstgespräche entstehen pro Monat aus Eurem Marketing?', 'How many qualified first calls does your marketing produce per month?', '¿Cuántas primeras reuniones cualificadas genera vuestro marketing al mes?'),
          opts(['0', '1–3', '4–10', 'Mehr als 10'], ['0', '1–3', '4–10', 'More than 10'], ['0', '1–3', '4–10', 'Más de 10'])),
        q('f4_2',
          t('Wie planbar ist Euer Lead-Zufluss?', 'How predictable is your lead flow?', '¿Qué tan previsible es vuestro flujo de leads?'),
          opts(['Reiner Zufall', 'Stark schwankend', 'Meist genug', 'Planbar und vorhersehbar'], ['Pure luck', 'Swings a lot', 'Usually enough', 'Predictable'], ['Puro azar', 'Muy irregular', 'Casi siempre suficiente', 'Previsible'])),
      ],
      diagnosis: t(
        'Oben passt viel, aber zu wenig davon wird zu qualifizierten Gesprächen. Ohne planbaren Zufluss hängt jeder Monat am Glück.',
        'A lot works at the top, but too little of it turns into qualified conversations. Without a predictable flow, every month depends on luck.',
        'Arriba funciona mucho, pero muy poco se convierte en conversaciones cualificadas. Sin un flujo previsible, cada mes depende de la suerte.',
      ),
      fixFirst: t('Einen planbaren Lead-Zufluss aufsetzen.', 'Set up a predictable lead flow.', 'Montar un flujo de leads previsible.'),
      strength: t('Euer Lead-Zufluss ist planbar.', 'Your lead flow is predictable.', 'Vuestro flujo de leads es previsible.'),
      insightAfter: t(
        'Halbzeit. Ab jetzt geht es um das, was passiert, wenn ein Interessent mit Euch spricht.',
        'Halfway. From here on it is about what happens once a prospect talks to you.',
        'Mitad del camino. A partir de aquí se trata de lo que pasa cuando un interesado habla con vosotros.',
      ),
    },
    {
      key: 'discovery', area: 'sales', cta: 'mystery',
      name: t('Discovery & Recommendation', 'Discovery & Recommendation', 'Descubrimiento y recomendación'),
      questions: [
        q('f5_1',
          t('Wie strukturiert sind Eure Erstgespräche?', 'How structured are your first calls?', '¿Qué tan estructuradas son vuestras primeras reuniones?'),
          opts(['Bauchgefühl', 'Grober Leitfaden', 'Klarer Prozess', 'Ein Playbook, das jeder im Team gleich führt'], ['Gut feeling', 'Rough guide', 'Clear process', 'A playbook everyone runs the same way'], ['Intuición', 'Guía aproximada', 'Proceso claro', 'Un playbook que todo el equipo sigue igual'])),
        q('f5_2',
          t('Aus wie vielen Erstgesprächen wird ein konkreter nächster Schritt oder eine Empfehlung?', 'How many first calls turn into a concrete next step or a recommendation?', '¿Cuántas primeras reuniones acaban en un siguiente paso concreto o una recomendación?'),
          opts(['Unter 25 %', '25–50 %', '50–75 %', 'Über 75 %'], ['Under 25%', '25–50%', '50–75%', 'Over 75%'], ['Menos del 25 %', '25–50 %', '50–75 %', 'Más del 75 %'])),
      ],
      diagnosis: t(
        'Ihr bekommt Gespräche, aber sie versanden. Ohne einen Ablauf, den jeder im Team gleich führt, entscheidet der Zufall.',
        'You get conversations, but they fizzle out. Without a process everyone runs the same way, luck decides.',
        'Conseguís conversaciones, pero se diluyen. Sin un proceso que todo el equipo siga igual, decide el azar.',
      ),
      fixFirst: t('Aus Erstgesprächen verlässlich nächste Schritte machen.', 'Turn first calls into next steps, reliably.', 'Convertir las primeras reuniones en siguientes pasos, de forma fiable.'),
      strength: t('Aus Euren Erstgesprächen entstehen nächste Schritte.', 'Your first calls lead to next steps.', 'Vuestras primeras reuniones llevan a siguientes pasos.'),
    },
    {
      key: 'offer', area: 'sales', cta: 'screening',
      name: t('Irresistible Offer', 'Irresistible Offer', 'Oferta irresistible'),
      questions: [
        q('f6_1',
          t('Ist Euer Angebot mehr als Leistungen und Preis, nämlich eine Geschichte, die einlädt?', 'Is your offer more than features and price, a story that invites people in?', '¿Es vuestra oferta algo más que prestaciones y precio, una historia que invita?'),
          opts(['Nur Leistungen und Preis', 'Ansätze', 'Größtenteils', 'Ein Angebot, das schwer abzulehnen ist'], ['Just features and price', 'Some of it', 'Mostly', 'An offer that is hard to turn down'], ['Solo prestaciones y precio', 'Algo hay', 'En gran parte', 'Una oferta difícil de rechazar'])),
        q('f6_2',
          t('Wie oft hört Ihr „zu teuer“ oder „müssen wir überlegen“?', 'How often do you hear “too expensive” or “we need to think about it”?', '¿Con qué frecuencia oís «demasiado caro» o «tenemos que pensarlo»?'),
          opts(['Ständig', 'Oft', 'Selten', 'Kaum'], ['All the time', 'Often', 'Rarely', 'Hardly ever'], ['Constantemente', 'A menudo', 'Rara vez', 'Casi nunca'])),
      ],
      diagnosis: t(
        'Euer Angebot klingt wie das der anderen: Leistungen und Preis. Deshalb hört Ihr „zu teuer“.',
        'Your offer sounds like everyone else’s: features and price. That is why you hear “too expensive”.',
        'Vuestra oferta suena como la de los demás: prestaciones y precio. Por eso oís «demasiado caro».',
      ),
      fixFirst: t('Ein Angebot bauen, das schwer abzulehnen ist.', 'Build an offer that is hard to turn down.', 'Construir una oferta difícil de rechazar.'),
      strength: t('Euer Angebot ist schwer abzulehnen.', 'Your offer is hard to turn down.', 'Vuestra oferta es difícil de rechazar.'),
    },
    {
      key: 'closing', area: 'sales', cta: 'mystery',
      name: t('Closing', 'Closing', 'Cierre'),
      questions: [
        q('f7_1',
          t('Wie viele Eurer qualifizierten Chancen gewinnt Ihr?', 'How many of your qualified opportunities do you win?', '¿Cuántas de vuestras oportunidades cualificadas ganáis?'),
          opts(['Unter 15 %', '15–30 %', '30–50 %', 'Über 50 %'], ['Under 15%', '15–30%', '30–50%', 'Over 50%'], ['Menos del 15 %', '15–30 %', '30–50 %', 'Más del 50 %'])),
        q('f7_2',
          t('Wie sehr führt Ihr Abschlüsse, mit klaren nächsten Schritten und bekanntem Entscheidungsweg?', 'How much do you lead your closes, with clear next steps and a known decision path?', '¿Hasta qué punto guiáis los cierres, con siguientes pasos claros y un proceso de decisión conocido?'),
          opts(['Wir hoffen', 'Teils', 'Meist geführt', 'Voll unter Kontrolle'], ['We hope', 'Partly', 'Mostly led', 'Fully in control'], ['Esperamos', 'En parte', 'Casi siempre guiados', 'Totalmente bajo control'])),
      ],
      diagnosis: t(
        'Ihr führt gute Gespräche, verliert aber am Ende. Wer den Entscheidungsweg nicht kennt, wartet auf ein Ja, das nicht kommt.',
        'You have good conversations but lose at the end. If you do not know the decision path, you wait for a yes that never comes.',
        'Tenéis buenas conversaciones pero perdéis al final. Quien no conoce el proceso de decisión espera un sí que no llega.',
      ),
      fixFirst: t('Abschlüsse führen: klare nächste Schritte, klarer Entscheidungsweg.', 'Lead the close: clear next steps, a clear decision path.', 'Guiar el cierre: siguientes pasos claros, proceso de decisión claro.'),
      strength: t('Ihr führt Eure Abschlüsse.', 'You lead your closes.', 'Guiáis vuestros cierres.'),
      insightAfter: t(
        'Fast geschafft. Zwei Stufen noch: was nach dem Abschluss passiert. Dort entscheidet sich, ob Wachstum sich addiert oder wieder verschwindet.',
        'Almost done. Two stages left: what happens after the deal is signed. That is where growth either adds up or disappears again.',
        'Casi listo. Quedan dos etapas: lo que pasa después del cierre. Ahí se decide si el crecimiento se suma o vuelve a desaparecer.',
      ),
    },
    {
      key: 'retention', area: 'customer', cta: 'strategy',
      name: t('Retention', 'Retention', 'Retención'),
      questions: [
        q('f8_1',
          t('Wie viele Kunden verliert Ihr pro Jahr?', 'How many customers do you lose per year?', '¿Cuántos clientes perdéis al año?'),
          opts(['Mehr als 20 %', '10–20 %', '5–10 %', 'Unter 5 %'], ['More than 20%', '10–20%', '5–10%', 'Under 5%'], ['Más del 20 %', '10–20 %', '5–10 %', 'Menos del 5 %'])),
        q('f8_2',
          t('Wie systematisch sind Onboarding und Betreuung nach dem Kauf?', 'How systematic are onboarding and account care after the sale?', '¿Qué tan sistemáticos son el onboarding y el seguimiento después de la compra?'),
          opts(['Spontan, je nach Fall', 'Grob', 'Strukturiert', 'Systematisch und messbar'], ['Ad hoc', 'Rough', 'Structured', 'Systematic and measured'], ['Improvisado', 'Aproximado', 'Estructurado', 'Sistemático y medible'])),
      ],
      diagnosis: t(
        'Ihr gewinnt vorne und verliert hinten. Jeder verlorene Kunde macht Euer Wachstum teurer.',
        'You win at the front and lose at the back. Every customer you lose makes your growth more expensive.',
        'Ganáis por delante y perdéis por detrás. Cada cliente perdido encarece vuestro crecimiento.',
      ),
      fixFirst: t('Onboarding und Betreuung systematisieren.', 'Systematise onboarding and account care.', 'Sistematizar el onboarding y el seguimiento.'),
      strength: t('Eure Kunden bleiben.', 'Your customers stay.', 'Vuestros clientes se quedan.'),
    },
    {
      key: 'expansion', area: 'customer', cta: 'strategy',
      name: t('Expansion', 'Expansion', 'Expansión'),
      questions: [
        q('f9_1',
          t('Wachsen Eure Bestandskunden mit, durch Upsell oder weitere Produkte?', 'Do existing customers grow with you, through upsell or further products?', '¿Crecen vuestros clientes actuales con vosotros, con upsell u otros productos?'),
          opts(['Gar nicht', 'Selten', 'Regelmäßig', 'Systematisch (Net Revenue Retention über 110 %)'], ['Not at all', 'Rarely', 'Regularly', 'Systematically (net revenue retention above 110%)'], ['Nada', 'Rara vez', 'Con regularidad', 'Sistemáticamente (net revenue retention superior al 110 %)'])),
        q('f9_2',
          t('Gibt es bei Euch einen festen Ablauf für Wachstum mit Bestandskunden: wer, wann, womit?', 'Do you have a set process for growing existing customers: who, when, with what?', '¿Tenéis un proceso fijo para crecer con clientes actuales: quién, cuándo, con qué?'),
          opts(['Keinen', 'Zufällig', 'Teils festgelegt', 'Klar geregelt'], ['None', 'By chance', 'Partly defined', 'Clearly defined'], ['Ninguno', 'Por casualidad', 'En parte definido', 'Claramente definido'])),
      ],
      diagnosis: t(
        'Eure Kunden bleiben, wachsen aber nicht mit. Das größte Umsatzpotenzial liegt bei denen, die Euch schon vertrauen.',
        'Your customers stay, but they do not grow with you. The biggest revenue potential sits with those who already trust you.',
        'Vuestros clientes se quedan, pero no crecen con vosotros. El mayor potencial está en quienes ya confían en vosotros.',
      ),
      fixFirst: t('Einen festen Ablauf für Wachstum mit Bestandskunden aufsetzen.', 'Set up a fixed process for growing existing customers.', 'Montar un proceso fijo para crecer con clientes actuales.'),
      strength: t('Eure Bestandskunden wachsen mit.', 'Your existing customers grow with you.', 'Vuestros clientes actuales crecen con vosotros.'),
    },
  ],
}

/** Default-Benchmarks aus der Spezifikation (B2B). Überschreibbar im Admin. */
export const ENGPASS_BENCHMARKS: Record<string, { red: number; green: number }> = {
  visibility: { red: 40, green: 66 },
  curiosity: { red: 40, green: 66 },
  demand: { red: 33, green: 66 },
  leadgen: { red: 40, green: 66 },
  discovery: { red: 50, green: 66 },
  offer: { red: 40, green: 66 },
  closing: { red: 40, green: 66 },
  retention: { red: 50, green: 66 },
  expansion: { red: 33, green: 66 },
}
