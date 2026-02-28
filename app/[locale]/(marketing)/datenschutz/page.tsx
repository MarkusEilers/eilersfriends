"use client";

import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

export default function Datenschutz() {
  const locale = useLocale();

  const content: Record<string, { title: string; lastUpdated: string; sections: { title: string; subsections: { title: string; content: string }[] }[] }> = {
    de: {
      title: 'Datenschutzerklärung',
      lastUpdated: 'Stand: Januar 2026',
      sections: [
        {
          title: '1. Datenschutz auf einen Blick',
          subsections: [
            {
              title: 'Allgemeine Hinweise',
              content: 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.',
            },
            {
              title: 'Datenerfassung auf dieser Website',
              content: 'Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.',
            },
          ],
        },
        {
          title: '2. Hosting',
          subsections: [
            {
              title: 'Externes Hosting',
              content: 'Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.',
            },
          ],
        },
        {
          title: '3. Allgemeine Hinweise und Pflichtinformationen',
          subsections: [
            {
              title: 'Datenschutz',
              content: 'Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.',
            },
            {
              title: 'Hinweis zur verantwortlichen Stelle',
              content: 'Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:\n\nEilers+Friends GmbH\nMusterstraße 123\n20095 Hamburg\n\nTelefon: +49 (0) 123 456 789\nE-Mail: team@eilersfriends.com',
            },
            {
              title: 'Speicherdauer',
              content: 'Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben.',
            },
            {
              title: 'Widerruf Ihrer Einwilligung zur Datenverarbeitung',
              content: 'Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.',
            },
            {
              title: 'Recht auf Datenübertragbarkeit',
              content: 'Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.',
            },
            {
              title: 'Auskunft, Löschung und Berichtigung',
              content: 'Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten.',
            },
            {
              title: 'Recht auf Einschränkung der Verarbeitung',
              content: 'Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.',
            },
          ],
        },
        {
          title: '4. Datenerfassung auf dieser Website',
          subsections: [
            {
              title: 'Cookies',
              content: 'Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.\n\nSie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren.',
            },
            {
              title: 'Cookie-Einwilligung',
              content: 'Beim Besuch unserer Website werden Sie über ein Cookie-Banner über die Verwendung von Cookies informiert und um Ihre Einwilligung gebeten. Wir speichern Ihre Einwilligung zusammen mit Ihrer IP-Adresse und dem Zeitstempel in unserer Datenbank, um die Einwilligung nachweisen zu können. Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie die Cookie-Einstellungen über den Link im Footer aufrufen.',
            },
            {
              title: 'Kontaktformular',
              content: 'Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.\n\nDie Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).',
            },
            {
              title: 'Newsletter',
              content: 'Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind.\n\nDie von Ihnen zum Zwecke des Newsletter-Bezugs bei uns hinterlegten Daten werden von uns bis zu Ihrer Austragung aus dem Newsletter bei uns gespeichert und nach der Abbestellung des Newsletters gelöscht. Daten, die zu anderen Zwecken bei uns gespeichert wurden, bleiben hiervon unberührt.',
            },
          ],
        },
        {
          title: '5. Analyse-Tools und Werbung',
          subsections: [
            {
              title: 'Analyse-Cookies',
              content: 'Wir setzen Analyse-Cookies nur ein, wenn Sie dem über unser Cookie-Banner zugestimmt haben. Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden.',
            },
          ],
        },
        {
          title: '6. Ihre Rechte',
          subsections: [
            {
              title: 'Beschwerderecht bei der zuständigen Aufsichtsbehörde',
              content: 'Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 2026',
      sections: [
        {
          title: '1. Privacy at a Glance',
          subsections: [
            {
              title: 'General Information',
              content: 'The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can be used to personally identify you. For detailed information on data protection, please refer to our privacy policy listed below this text.',
            },
            {
              title: 'Data Collection on this Website',
              content: 'Data processing on this website is carried out by the website operator. You can find their contact details in the "Information about the Responsible Party" section of this privacy policy.',
            },
          ],
        },
        {
          title: '2. Hosting',
          subsections: [
            {
              title: 'External Hosting',
              content: 'This website is hosted by an external service provider (host). The personal data collected on this website is stored on the host\'s servers. This may include IP addresses, contact requests, meta and communication data, contract data, contact details, names, website accesses and other data generated via a website.',
            },
          ],
        },
        {
          title: '3. General Information and Mandatory Information',
          subsections: [
            {
              title: 'Data Protection',
              content: 'The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with statutory data protection regulations and this privacy policy.',
            },
            {
              title: 'Information about the Responsible Party',
              content: 'The responsible party for data processing on this website is:\n\nEilers+Friends GmbH\nMusterstraße 123\n20095 Hamburg\n\nPhone: +49 (0) 123 456 789\nEmail: team@eilersfriends.com',
            },
            {
              title: 'Storage Duration',
              content: 'Unless a more specific storage period has been specified in this privacy policy, your personal data will remain with us until the purpose for data processing no longer applies.',
            },
            {
              title: 'Revocation of Your Consent to Data Processing',
              content: 'Many data processing operations are only possible with your express consent. You can revoke consent you have already given at any time. The legality of the data processing carried out until the revocation remains unaffected by the revocation.',
            },
            {
              title: 'Right to Data Portability',
              content: 'You have the right to have data that we process automatically on the basis of your consent or in fulfillment of a contract handed over to you or to a third party in a common, machine-readable format.',
            },
            {
              title: 'Information, Deletion and Correction',
              content: 'Within the framework of the applicable legal provisions, you have the right to free information about your stored personal data, its origin and recipients and the purpose of data processing at any time and, if applicable, a right to correction or deletion of this data.',
            },
            {
              title: 'Right to Restriction of Processing',
              content: 'You have the right to request the restriction of the processing of your personal data.',
            },
          ],
        },
        {
          title: '4. Data Collection on this Website',
          subsections: [
            {
              title: 'Cookies',
              content: 'Our websites use so-called "cookies". Cookies are small data packets and do not cause any damage to your device. They are stored either temporarily for the duration of a session (session cookies) or permanently (permanent cookies) on your device.',
            },
            {
              title: 'Cookie Consent',
              content: 'When you visit our website, you will be informed about the use of cookies via a cookie banner and asked for your consent. We store your consent together with your IP address and timestamp in our database in order to be able to prove consent. You can revoke your consent at any time by accessing the cookie settings via the link in the footer.',
            },
            {
              title: 'Contact Form',
              content: 'If you send us inquiries via the contact form, your details from the inquiry form, including the contact details you provided there, will be stored by us for the purpose of processing the inquiry and in case of follow-up questions.',
            },
            {
              title: 'Newsletter',
              content: 'If you would like to receive the newsletter offered on the website, we need an email address from you as well as information that allows us to verify that you are the owner of the specified email address and agree to receive the newsletter.',
            },
          ],
        },
        {
          title: '5. Analytics Tools and Advertising',
          subsections: [
            {
              title: 'Analytics Cookies',
              content: 'We only use analytics cookies if you have agreed to them via our cookie banner. These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
            },
          ],
        },
        {
          title: '6. Your Rights',
          subsections: [
            {
              title: 'Right to Lodge a Complaint with the Competent Supervisory Authority',
              content: 'In the event of violations of the GDPR, data subjects have a right to lodge a complaint with a supervisory authority, in particular in the Member State of their habitual residence, their place of work or the place of the alleged violation.',
            },
          ],
        },
      ],
    },
    ru: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: январь 2026',
      sections: [
        {
          title: '1. Конфиденциальность: краткий обзор',
          subsections: [
            {
              title: 'Общая информация',
              content: 'Следующая информация дает простой обзор того, что происходит с вашими персональными данными при посещении этого веб-сайта. Персональные данные — это любые данные, по которым вас можно лично идентифицировать. Подробную информацию о защите данных вы найдете в нашей политике конфиденциальности, приведенной ниже.',
            },
            {
              title: 'Сбор данных на этом веб-сайте',
              content: 'Обработка данных на этом веб-сайте осуществляется оператором веб-сайта. Его контактные данные вы можете найти в разделе «Информация об ответственном лице» данной политики конфиденциальности.',
            },
          ],
        },
        {
          title: '2. Хостинг',
          subsections: [
            {
              title: 'Внешний хостинг',
              content: 'Этот веб-сайт размещен у внешнего поставщика услуг (хостера). Персональные данные, собранные на этом веб-сайте, хранятся на серверах хостера. Это могут быть IP-адреса, контактные запросы, мета- и коммуникационные данные, данные контрактов, контактные данные, имена, обращения к веб-сайту и другие данные, генерируемые через веб-сайт.',
            },
          ],
        },
        {
          title: '3. Общая информация и обязательные сведения',
          subsections: [
            {
              title: 'Защита данных',
              content: 'Операторы этих страниц очень серьезно относятся к защите ваших персональных данных. Мы обращаемся с вашими персональными данными конфиденциально и в соответствии с законодательными нормами о защите данных, а также данной политикой конфиденциальности.',
            },
            {
              title: 'Информация об ответственном лице',
              content: 'Ответственным за обработку данных на этом веб-сайте является:\n\nEilers+Friends GmbH\nMusterstraße 123\n20095 Hamburg\n\nТелефон: +49 (0) 123 456 789\nЭл. почта: team@eilersfriends.com',
            },
            {
              title: 'Срок хранения',
              content: 'Если в данной политике конфиденциальности не указан более конкретный срок хранения, ваши персональные данные остаются у нас до тех пор, пока не отпадет цель обработки данных.',
            },
            {
              title: 'Отзыв вашего согласия на обработку данных',
              content: 'Многие операции по обработке данных возможны только с вашего явного согласия. Вы можете отозвать уже данное согласие в любое время. Законность обработки данных, проведенной до отзыва, остается незатронутой.',
            },
            {
              title: 'Право на переносимость данных',
              content: 'Вы имеете право на то, чтобы данные, которые мы обрабатываем автоматически на основании вашего согласия или во исполнение договора, были переданы вам или третьему лицу в общепринятом машиночитаемом формате.',
            },
            {
              title: 'Информация, удаление и исправление',
              content: 'В рамках действующих законодательных положений вы имеете право в любое время на бесплатную информацию о ваших сохраненных персональных данных, их происхождении и получателях, а также о цели обработки данных и, при необходимости, право на исправление или удаление этих данных.',
            },
            {
              title: 'Право на ограничение обработки',
              content: 'Вы имеете право потребовать ограничения обработки ваших персональных данных.',
            },
          ],
        },
        {
          title: '4. Сбор данных на этом веб-сайте',
          subsections: [
            {
              title: 'Файлы cookie',
              content: 'Наши интернет-страницы используют так называемые «cookie». Cookie — это небольшие пакеты данных, которые не наносят вреда вашему устройству. Они хранятся либо временно на время сеанса (сеансовые cookie), либо постоянно (постоянные cookie) на вашем устройстве.',
            },
            {
              title: 'Согласие на использование cookie',
              content: 'При посещении нашего веб-сайта вы будете проинформированы об использовании cookie через баннер cookie и вас попросят дать согласие. Мы сохраняем ваше согласие вместе с вашим IP-адресом и временной меткой в нашей базе данных. Вы можете отозвать свое согласие в любое время через настройки cookie в нижней части страницы.',
            },
            {
              title: 'Контактная форма',
              content: 'Если вы отправляете нам запросы через контактную форму, ваши данные из формы запроса, включая указанные вами контактные данные, сохраняются у нас для обработки запроса и на случай дополнительных вопросов.',
            },
            {
              title: 'Рассылка',
              content: 'Если вы хотите получать рассылку, предлагаемую на веб-сайте, нам нужен ваш адрес электронной почты, а также информация, позволяющая нам проверить, что вы являетесь владельцем указанного адреса электронной почты и согласны на получение рассылки.',
            },
          ],
        },
        {
          title: '5. Инструменты аналитики и реклама',
          subsections: [
            {
              title: 'Аналитические cookie',
              content: 'Мы используем аналитические cookie только в том случае, если вы дали на это согласие через наш баннер cookie. Эти cookie помогают нам понять, как посетители взаимодействуют с нашим веб-сайтом, собирая и передавая информацию анонимно.',
            },
          ],
        },
        {
          title: '6. Ваши права',
          subsections: [
            {
              title: 'Право на подачу жалобы в компетентный надзорный орган',
              content: 'В случае нарушений GDPR субъекты данных имеют право подать жалобу в надзорный орган, в частности в государстве-члене их обычного проживания, места работы или места предполагаемого нарушения.',
            },
          ],
        },
      ],
    },
  };

  const t = content[locale as keyof typeof content] || content.de;

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
            <p className="text-muted-foreground mb-12">{t.lastUpdated}</p>

            <div className="space-y-12">
              {t.sections.map((section, sectionIndex) => (
                <section key={sectionIndex}>
                  <h2 className="text-2xl font-bold mb-6 text-brand">{section.title}</h2>
                  <div className="space-y-6">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="text-lg font-semibold mb-3">{subsection.title}</h3>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {subsection.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
