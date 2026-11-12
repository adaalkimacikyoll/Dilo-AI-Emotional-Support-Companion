import { LEGAL_LAST_UPDATED, OPERATOR } from "./operator";
import { AI_PROVIDER } from "./api";

/**
 * Legal texts for Germany / the EU. These are carefully written templates, not legal advice:
 * have them reviewed by a lawyer before relying on them.
 */
export type LegalPage = "imprint" | "privacy" | "terms";
export type LegalLanguage = "de" | "en";

const address = `${OPERATOR.name}  \n${OPERATOR.street}  \n${OPERATOR.city}  \n${OPERATOR.country}`;

const de: Record<LegalPage, string> = {
  imprint: `# Impressum

## Angaben gemäß § 5 DDG

${address}

## Kontakt

E-Mail: ${OPERATOR.email}

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

${address}

## Verbraucherstreitbeilegung

Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`,

  privacy: `# Datenschutzerklärung

Stand: ${LEGAL_LAST_UPDATED.de}

## 1. Verantwortlicher

${address}
E-Mail: ${OPERATOR.email}

## 2. Das Wichtigste in Kürze

- Dilo hat **keine Cookies, kein Tracking und keine Analyse-Tools**. Deine Inhalte existieren nur verschlüsselt auf deinem Gerät, nicht bei uns.
- Deine Nachrichten an Dilo werden **nur zur Erstellung der Antwort** an einen KI-Dienst in der EU (Scaleway, Paris) übertragen und dort **nicht zum Training verwendet**. Wir selbst speichern deine Nachrichten nicht.
- Tagebucheinträge und Notizen verlassen **nie** dein Gerät.
- Für die E-Mail-Bestätigung und das Zurücksetzen des Passworts senden wir dir Codes per E-Mail und speichern eine verschlüsselte Kopie deines Datenschlüssels, aber nie deine Inhalte (Abschnitt 5).
- Darüber hinaus fallen personenbezogene Daten nur in technisch notwendigem Umfang an (Server-Logdateien beim Hoster).

## 3. Hosting

Diese Website und ihre Server-Funktion werden bei Vercel Inc. (USA) gehostet; die Server-Funktion läuft in der Region Frankfurt (EU). Beim Aufruf der Website verarbeitet der Hoster technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browsertyp, Referrer) in Server-Logdateien, um die Website auszuliefern und ihre Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der sicheren und stabilen Bereitstellung der Website. Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung. Eine Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln.

## 4. Speicherung auf deinem Gerät

Dilo speichert folgende Daten ausschließlich lokal in deinem Browser (Local Storage): dein Konto mit Gesprächen, Tagebucheinträgen, Notizen und Stimmung (verschlüsselt), Einstellungen, deine Einwilligung (mit Zeitpunkt und Version). Diese Speicherung ist für den von dir gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Da deine Inhalte Angaben zu deiner Gesundheit enthalten können, erfolgt ihre Verarbeitung auf Grundlage deiner ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).

Deine Inhalte (Gespräche, Tagebucheinträge, Notizen und Stimmung) werden in einem Konto gespeichert, das nur auf diesem Gerät existiert. Im Klartext gespeichert werden lediglich die von dir angegebene E-Mail-Adresse als Kontoname und technische Werte (Salt). Alle Inhalte werden mit AES-256-GCM und einem zufälligen Datenschlüssel verschlüsselt. Dieser Datenschlüssel wird auf deinem Gerät mit einem Schlüssel verschlüsselt gespeichert, der mit PBKDF2 (310.000 Iterationen) aus deinem Passwort abgeleitet wird, und während der Sitzung nur im Arbeitsspeicher gehalten. Dein Passwort wird nicht gespeichert. Für das Zurücksetzen des Passworts per E-Mail siehe Abschnitt 5. Konten werden nicht mit anderen Geräten synchronisiert.

Gespräche, die du zusätzlich mit einem eigenen Passwort sperrst, werden auf dieselbe Weise ein weiteres Mal verschlüsselt.

Du kannst alle Daten jederzeit in den Einstellungen unter „Alle meine Daten löschen und Einwilligung widerrufen“ oder über die Einstellungen deines Browsers löschen.

## 5. E-Mail-Bestätigung und Passwort-Zurücksetzen

Damit du dein Passwort zurücksetzen kannst, ohne deine Inhalte zu verlieren, bestätigst du bei der Kontoerstellung deine E-Mail-Adresse mit einem Code. Dafür und für das Zurücksetzen des Passworts verarbeiten wir:

- **Deine E-Mail-Adresse**, nur um dir einen 6-stelligen Code zu senden. Die E-Mail wird über ein Gmail-Konto von **Google** (Google Ireland Limited, Dublin, Irland) versendet. Dabei kann eine Übermittlung an Google LLC in den USA stattfinden, die nach dem EU-US Data Privacy Framework zertifiziert ist (Art. 45 DSGVO). Wir speichern deine E-Mail-Adresse nicht im Klartext.
- **Einen pseudonymen Schlüssel** (HMAC-SHA-256 deiner E-Mail-Adresse mit einem geheimen Serverschlüssel) und **eine verschlüsselte Kopie des Datenschlüssels deines Kontos**. Diese Kopie ist mit einem Serverschlüssel verschlüsselt. Deine Inhalte selbst werden nie an uns übertragen; mit dieser Kopie allein lassen sie sich daher nicht lesen.
- **Codes** (nur als HMAC gespeichert, 10 Minuten gültig, höchstens 5 Versuche) und **Zähler zur Missbrauchsbegrenzung** (pro pseudonymisierter E-Mail-Adresse und pseudonymisierter IP-Adresse, nach einer Stunde gelöscht).

Diese Daten werden bei **Upstash** (Upstash, Inc.) in der Region Frankfurt (EU) als Auftragsverarbeiter nach Art. 28 DSGVO gespeichert. Dort liegt auch ein Zähler der verbrauchten KI-Kapazität ohne personenbezogene Daten.

Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der von dir gewünschten Kontofunktion). Die Kopie des Datenschlüssels wird gelöscht, wenn du dein Konto oder alle Daten in den Einstellungen löschst. Ohne die Daten auf deinem Gerät ist sie wertlos.

## 6. Erzeugung der Antworten (KI-Verarbeitung)

Wenn du Dilo eine Nachricht sendest, überträgt dein Browser den Gesprächsverlauf (deine Nachrichten und Dilos bisherige Antworten im aktuellen Gespräch), die gewählten Einstellungen (Sprache, Gesprächsstil, Antwortart, Stimmung) und einen Systemhinweis an unsere Server-Funktion bei Vercel (Region Frankfurt). Diese leitet die Daten an den KI-Dienst ${AI_PROVIDER.name} der Scaleway SAS (Frankreich) weiter, wo ein KI-Sprachmodell in einem Rechenzentrum in ${AI_PROVIDER.location} die Antwort erzeugt. Die Antwort wird direkt an deinen Browser zurückgesendet.

Wir speichern und protokollieren keine Nachrichteninhalte. Scaleway verwendet die Inhalte nicht zum Training von KI-Modellen und wertet sie nicht aus; nur wenn eine Anfrage den Dienst stört oder missbräuchlich ist, kann Scaleway den Inhalt der betroffenen Anfragen bis zu zwei Wochen speichern, um das Problem zu untersuchen und zu beheben. Technische Metadaten (z. B. Anzahl der Tokens) werden ohne Nachrichteninhalt protokolliert. Tagebucheinträge und Notizen werden nie übertragen.

Da deine Nachrichten Angaben zu deiner Gesundheit enthalten können, erfolgt die Verarbeitung auf Grundlage deiner ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a i. V. m. Art. 6 Abs. 1 lit. a DSGVO), die du beim Start erteilst und jederzeit widerrufen kannst. Scaleway ist als Auftragsverarbeiter nach Art. 28 DSGVO tätig; die Verarbeitung findet in der EU statt. Es findet keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO statt.

Zum Schutz vor Missbrauch wird die Anzahl der Anfragen begrenzt (Art. 6 Abs. 1 lit. f DSGVO). Dafür wird die IP-Adresse kurz im Arbeitsspeicher verwendet und in der Datenbank bei Upstash (Frankfurt, EU) nur als pseudonymisierter Schlüssel (HMAC) mit einem Zähler gespeichert, der spätestens nach etwa einem Tag automatisch gelöscht wird. Nach der Zustimmung erhält die App außerdem ein kurzlebiges, signiertes Sitzungstoken (12 Stunden gültig), das nur im Arbeitsspeicher des Browsers liegt und keine personenbezogenen Daten enthält.

## 7. Keine Weitergabe an weitere Dritte

Außer an die genannten Dienstleister (Vercel, Scaleway, Google, Upstash) werden keine Daten übermittelt. Schriftarten und alle anderen technischen Bestandteile werden von unserem eigenen Hoster ausgeliefert.

## 8. Externe Links

Links zu externen Seiten (z. B. findahelpline.com) und Telefonnummern werden erst aktiv, wenn du sie anklickst. Für die dortige Datenverarbeitung ist der jeweilige Anbieter verantwortlich.

## 9. Mindestalter

Dilo richtet sich ausschließlich an Personen ab 18 Jahren.

## 10. Deine Rechte

Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO). Da deine Inhalte nur auf deinem Gerät gespeichert sind, kannst du sie dort selbst einsehen und löschen. Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Bundesland deines Aufenthaltsorts oder des Sitzes des Verantwortlichen (Art. 77 DSGVO).`,

  terms: `# Nutzungsbedingungen

Stand: ${LEGAL_LAST_UPDATED.de}

## 1. Anbieter und Geltungsbereich

Diese Bedingungen gelten für die Nutzung von Dilo, angeboten von ${OPERATOR.name} (siehe Impressum).

## 2. Was Dilo ist und was nicht

Dilo ist ein kostenloser KI-Begleiter für emotionales Wohlbefinden. Dilo ist **kein Psychologe, Arzt oder Therapeut**, erbringt **keine Heilbehandlung, Psychotherapie oder medizinische Beratung**, stellt **keine Diagnosen** und ist **kein Medizinprodukt**. Dilo ersetzt keine professionelle Hilfe.

## 3. Kein Notdienst

Dilo ist nicht für Notfälle geeignet. In einer akuten Krise oder bei Gefahr für dich oder andere wähle sofort den Notruf **112** oder wende dich an die TelefonSeelsorge (0800 111 0 111 oder 0800 111 0 222, kostenlos, rund um die Uhr).

Äußerst du in einem Gespräch die Absicht, einen anderen Menschen zu töten oder ernsthaft zu verletzen, zeigt Dilo Notrufnummern an und beendet dieses Gespräch dauerhaft; es kann nicht fortgesetzt werden. Diese Erkennung erfolgt automatisch (durch eine Wortprüfung auf deinem Gerät und durch das KI-Modell) und kann sich irren. Es wird dabei niemand benachrichtigt und nichts an Dritte gemeldet.

## 4. Mindestalter

Die Nutzung ist nur Personen ab 18 Jahren gestattet.

## 5. KI-generierte Inhalte

Die Antworten werden automatisch von einem KI-Modell erzeugt. Sie können unvollständig, unzutreffend oder unpassend sein. Verlasse dich bei wichtigen Entscheidungen, insbesondere zu deiner Gesundheit, nicht auf Dilo.

## 6. Nutzung

Du verpflichtest dich, Dilo nicht missbräuchlich oder rechtswidrig zu nutzen.

## 7. Verfügbarkeit und technische Voraussetzungen

Dilo wird ohne Gewähr für eine ständige Verfügbarkeit bereitgestellt. Für die Antworten ist eine Internetverbindung erforderlich.

## 8. Deine Daten

Alle Inhalte werden nur verschlüsselt in deinem Konto auf deinem Gerät gespeichert. Wir können sie nicht einsehen. Beim Löschen der Browserdaten gehen sie verloren. Wenn du dein Passwort vergisst, kannst du es mit einem Code an deine bestätigte E-Mail-Adresse zurücksetzen. Du bist für die sichere Aufbewahrung deines Passworts und den Schutz deines E-Mail-Postfachs verantwortlich. Einzelheiten in der Datenschutzerklärung.

## 9. Haftung

Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Da Dilo unentgeltlich angeboten wird, ist die Haftung im Übrigen ausgeschlossen, soweit gesetzlich zulässig.

## 10. KI-Modelle

Die Antworten werden von KI-Sprachmodellen erzeugt, die über ${AI_PROVIDER.name} in der EU bereitgestellt werden.

## 11. Änderungen und anwendbares Recht

Wir können diese Bedingungen ändern; bei wesentlichen Änderungen wirst du erneut um Bestätigung gebeten. Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften deines Aufenthaltsstaats bleiben unberührt.`,
};

const en: Record<LegalPage, string> = {
  imprint: `# Legal notice (Impressum)

## Information pursuant to § 5 DDG

${address}

## Contact

Email: ${OPERATOR.email}

## Responsible for content pursuant to § 18(2) MStV

${address}

## Consumer dispute resolution

We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.`,

  privacy: `# Privacy policy

Last updated: ${LEGAL_LAST_UPDATED.en}

## 1. Controller

${address}
Email: ${OPERATOR.email}

## 2. Summary

- Dilo has **no cookies, no tracking and no analytics**. Your content exists only, encrypted, on your device, never with us.
- Your messages to Dilo are sent **only to generate the reply** to an AI service in the EU (Scaleway, Paris), where they are **not used for training**. We do not store your messages ourselves.
- Journal entries and notes **never** leave your device.
- For email confirmation and password reset we email you codes and store an encrypted copy of your data key, but never your content (section 5).
- Beyond that, personal data is only processed to the extent technically necessary (server log files at our hosting provider).

## 3. Hosting

This website and its server function are hosted by Vercel Inc. (USA); the server function runs in the Frankfurt region (EU). When you visit it, the host processes technically necessary data (IP address, date and time, requested address, browser type, referrer) in server log files to deliver the website and keep it secure. The legal basis is Art. 6(1)(f) GDPR; our legitimate interest is providing the website securely and reliably. A data processing agreement is in place with Vercel. Transfers to the USA are based on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses.

## 4. Storage on your device

Dilo stores the following only in your browser (Local Storage): your account with conversations, journal entries, notes and mood (encrypted), settings, your consent (with time and version). This storage is strictly necessary for the service you request (§ 25(2) no. 2 TDDDG). Because your content may include information about your health, it is processed on the basis of your explicit consent (Art. 9(2)(a) GDPR).

Your content (conversations, journal entries, notes and mood) is stored in an account that exists only on this device. Only the email address you enter as your account name and technical values (a salt) are stored in plain text. All content is encrypted with AES-256-GCM using a random data key. That data key is stored on your device, encrypted with a key derived from your password with PBKDF2 (310,000 iterations), and is kept in memory only for the session. Your password is not stored. For resetting your password by email, see section 5. Accounts are not synchronised with other devices.

Conversations you additionally lock with their own password are encrypted a second time in the same way.

You can delete all data at any time in the settings under "Delete all my data and withdraw consent", or through your browser settings.

## 5. Email confirmation and password reset

So that you can reset your password without losing your content, you confirm your email address with a code when you create your account. For this and for resetting your password we process:

- **Your email address**, only to send you a 6-digit code. The email is sent through a Gmail account provided by **Google** (Google Ireland Limited, Dublin, Ireland). This may involve a transfer to Google LLC in the USA, which is certified under the EU-US Data Privacy Framework (Art. 45 GDPR). We do not store your email address in plain text.
- **A pseudonymous key** (HMAC-SHA-256 of your email address with a secret server key) and **an encrypted copy of your account's data key**. This copy is encrypted with a server key. Your content itself is never sent to us, so this copy alone cannot be used to read it.
- **Codes** (stored only as an HMAC, valid for 10 minutes, at most 5 attempts) and **counters that limit misuse** (per pseudonymised email address and pseudonymised IP address, deleted after one hour).

This data is stored with **Upstash** (Upstash, Inc.) in the Frankfurt region (EU) as a processor under Art. 28 GDPR. A counter of the AI capacity used, which contains no personal data, is kept there too.

The legal basis is Art. 6(1)(b) GDPR (providing the account function you asked for). The copy of the data key is deleted when you delete your account or all data in the settings. Without the data on your device it is useless.

## 6. Generating replies (AI processing)

When you send Dilo a message, your browser sends the conversation (your messages and Dilo's earlier replies in the current conversation), your chosen settings (language, conversation style, response type, mood) and a system instruction to our server function at Vercel (Frankfurt region). It forwards this data to the AI service ${AI_PROVIDER.name} of Scaleway SAS (France), where an AI language model in a data centre in ${AI_PROVIDER.location} generates the reply. The reply is sent straight back to your browser.

We do not store or log message content. Scaleway does not use the content to train AI models and does not analyse it; only if a request disrupts the service or is abusive may Scaleway store the content of the affected requests for up to two weeks to investigate and fix the problem. Technical metadata (such as token counts) is logged without message content. Journal entries and notes are never transmitted.

Because your messages may contain information about your health, they are processed on the basis of your explicit consent (Art. 9(2)(a) in conjunction with Art. 6(1)(a) GDPR), which you give at the start and can withdraw at any time. Scaleway acts as a processor under Art. 28 GDPR; processing takes place in the EU. No automated decision-making within the meaning of Art. 22 GDPR takes place.

To prevent abuse, the number of requests is limited (Art. 6(1)(f) GDPR). For this, your IP address is used briefly in memory and stored in the Upstash database (Frankfurt, EU) only as a pseudonymised key (HMAC) with a counter that is deleted automatically after about one day at the latest. After you consent, the app also receives a short-lived signed session token (valid for 12 hours) that is kept only in the browser's memory and contains no personal data.

## 7. No sharing with other third parties

No data is shared with anyone other than the service providers named above (Vercel, Scaleway, Google, Upstash). Fonts and all other technical components are delivered by our own hosting provider.

## 8. External links

Links to external websites (for example findahelpline.com) and phone numbers only become active when you click them. The respective provider is responsible for any data processing there.

## 9. Minimum age

Dilo is intended exclusively for people aged 18 and over.

## 10. Your rights

You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21 GDPR). You can withdraw your consent at any time with effect for the future (Art. 7(3) GDPR). Since your content is stored only on your device, you can view and delete it there yourself. You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the state where you live or where the controller is based (Art. 77 GDPR).`,

  terms: `# Terms of use

Last updated: ${LEGAL_LAST_UPDATED.en}

## 1. Provider and scope

These terms apply to the use of Dilo, provided by ${OPERATOR.name} (see legal notice).

## 2. What Dilo is and is not

Dilo is a free AI companion for emotional wellbeing. Dilo is **not a psychologist, doctor or therapist**, provides **no medical treatment, psychotherapy or medical advice**, makes **no diagnoses** and is **not a medical device**. Dilo does not replace professional help.

## 3. Not an emergency service

Dilo is not suitable for emergencies. In an acute crisis, or if you or others are in danger, call the emergency number **112** immediately, or contact TelefonSeelsorge (0800 111 0 111 or 0800 111 0 222, free, 24/7).

If you state in a conversation that you intend to kill or seriously hurt another person, Dilo shows emergency numbers and closes that conversation for good; it cannot be continued. This detection is automatic (a word check on your device and the AI model) and can be wrong. Nobody is notified and nothing is reported to third parties.

## 4. Minimum age

Only people aged 18 and over may use Dilo.

## 5. AI-generated content

Replies are generated automatically by an AI model. They may be incomplete, inaccurate or inappropriate. Do not rely on Dilo for important decisions, especially about your health.

## 6. Use

You agree not to use Dilo in an abusive or unlawful way.

## 7. Availability and technical requirements

Dilo is provided without any guarantee of continuous availability. Replies require an internet connection.

## 8. Your data

All content is stored only, encrypted, in your account on your device. We cannot view it. It is lost when you clear your browser data. If you forget your password, you can reset it with a code sent to your confirmed email address. You are responsible for keeping your password safe and protecting your email inbox. See the privacy policy for details.

## 9. Liability

We are liable without limitation for intent and gross negligence, for injury to life, body or health, and under the German Product Liability Act. As Dilo is provided free of charge, liability is otherwise excluded to the extent permitted by law.

## 10. AI models

Replies are generated by AI language models provided through ${AI_PROVIDER.name} in the EU.

## 11. Changes and governing law

We may change these terms; for material changes you will be asked to confirm again. German law applies. Mandatory consumer protection rules of your country of residence remain unaffected.`,
};

export const LEGAL: Record<LegalLanguage, Record<LegalPage, string>> = { de, en };

/** Placeholders that must be replaced before publishing. */
export const hasPlaceholders = () => Object.values(OPERATOR).some((v) => /^\[.*\]$/.test(v));
