import { LEGAL_LAST_UPDATED, OPERATOR } from "./operator";
import { MODEL } from "./api";

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

- Dilo hat **keine Cookies, kein Tracking und keine Analyse-Tools**. Konten existieren nur verschlüsselt auf deinem Gerät, nicht bei uns.
- Die KI läuft **vollständig auf deinem Gerät**. Deine Nachrichten, Tagebucheinträge und Notizen werden **nicht an uns oder Dritte übertragen**. Wir haben keinen Zugriff darauf.
- Personenbezogene Daten fallen bei uns nur in technisch notwendigem Umfang beim Abrufen der Website an (Server-Logdateien beim Hoster).
- Einmalig wird das KI-Modell von Hugging Face heruntergeladen, und zwar erst, nachdem du dies ausdrücklich auslöst.

## 3. Hosting

Diese Website wird bei Vercel Inc. (USA) gehostet. Beim Aufruf der Website verarbeitet der Hoster technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browsertyp, Referrer) in Server-Logdateien, um die Website auszuliefern und ihre Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der sicheren und stabilen Bereitstellung der Website. Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung. Eine Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln.

## 4. Speicherung auf deinem Gerät

Dilo speichert folgende Daten ausschließlich lokal in deinem Browser (Local Storage und Cache Storage): dein Konto mit Gesprächen, Tagebucheinträgen, Notizen und Stimmung (verschlüsselt), Einstellungen, deine Einwilligung (mit Zeitpunkt und Version) sowie die Dateien des KI-Modells. Diese Speicherung ist für den von dir gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Da deine Inhalte Angaben zu deiner Gesundheit enthalten können, erfolgt ihre Verarbeitung auf Grundlage deiner ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).

Deine Inhalte (Gespräche, Tagebucheinträge, Notizen und Stimmung) werden in einem Konto gespeichert, das nur auf diesem Gerät existiert. Im Klartext gespeichert werden lediglich der von dir gewählte Kontoname und technische Werte (Salt). Alle Inhalte werden mit AES-256-GCM verschlüsselt; der Schlüssel wird mit PBKDF2 (310.000 Iterationen) aus deinem Passwort abgeleitet und nur während der Sitzung im Arbeitsspeicher gehalten. Dein Passwort wird nicht gespeichert. Es gibt keine Passwort-Wiederherstellung: Ohne das Passwort können die Inhalte weder von dir noch von uns wiederhergestellt werden. Konten werden nicht mit anderen Geräten synchronisiert.

Gespräche, die du zusätzlich mit einem eigenen Passwort sperrst, werden auf dieselbe Weise ein weiteres Mal verschlüsselt.

Du kannst alle Daten jederzeit in den Einstellungen unter „Alle meine Daten löschen und Einwilligung widerrufen“ oder über die Einstellungen deines Browsers löschen.

## 5. KI-Verarbeitung auf dem Gerät

Die Antworten von Dilo werden von dem Open-Source-Sprachmodell ${MODEL.name} (Lizenz: ${MODEL.license}) erzeugt, das mithilfe von WebGPU direkt in deinem Browser läuft. Deine Eingaben verlassen dein Gerät dabei nicht. Es findet keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO statt.

## 6. Download des KI-Modells von Hugging Face

Erst wenn du auf „KI-Modell herunterladen“ klickst, lädt dein Browser die Modelldateien (ca. 1 GB) von Hugging Face, Inc. (USA) herunter. Dabei werden technisch bedingt deine IP-Adresse und Browserinformationen an Hugging Face übermittelt; Inhalte deiner Gespräche werden nicht übertragen. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du durch das Auslösen des Downloads erteilst. Soweit Hugging Face nicht nach dem EU-US Data Privacy Framework zertifiziert ist, stützt sich die Übermittlung in die USA auf deine ausdrückliche Einwilligung nach Art. 49 Abs. 1 lit. a DSGVO. Weitere Informationen: https://huggingface.co/privacy

Die übrigen technischen Bestandteile (Programmcode, Schriftarten, Modellbibliothek) werden von unserem eigenen Hoster ausgeliefert.

## 7. Externe Links

Links zu externen Seiten (z. B. findahelpline.com) und Telefonnummern werden erst aktiv, wenn du sie anklickst. Für die dortige Datenverarbeitung ist der jeweilige Anbieter verantwortlich.

## 8. Mindestalter

Dilo richtet sich ausschließlich an Personen ab 18 Jahren.

## 9. Deine Rechte

Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO). Da deine Inhalte nur auf deinem Gerät gespeichert sind, kannst du sie dort selbst einsehen und löschen. Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Bundesland deines Aufenthaltsorts oder des Sitzes des Verantwortlichen (Art. 77 DSGVO).`,

  terms: `# Nutzungsbedingungen

Stand: ${LEGAL_LAST_UPDATED.de}

## 1. Anbieter und Geltungsbereich

Diese Bedingungen gelten für die Nutzung von Dilo, angeboten von ${OPERATOR.name} (siehe Impressum).

## 2. Was Dilo ist und was nicht

Dilo ist ein kostenloser KI-Begleiter für emotionales Wohlbefinden. Dilo ist **kein Psychologe, Arzt oder Therapeut**, erbringt **keine Heilbehandlung, Psychotherapie oder medizinische Beratung**, stellt **keine Diagnosen** und ist **kein Medizinprodukt**. Dilo ersetzt keine professionelle Hilfe.

## 3. Kein Notdienst

Dilo ist nicht für Notfälle geeignet. In einer akuten Krise oder bei Gefahr für dich oder andere wähle sofort den Notruf **112** oder wende dich an die TelefonSeelsorge (0800 111 0 111 oder 0800 111 0 222, kostenlos, rund um die Uhr).

## 4. Mindestalter

Die Nutzung ist nur Personen ab 18 Jahren gestattet.

## 5. KI-generierte Inhalte

Die Antworten werden automatisch von einem KI-Modell erzeugt. Sie können unvollständig, unzutreffend oder unpassend sein. Verlasse dich bei wichtigen Entscheidungen, insbesondere zu deiner Gesundheit, nicht auf Dilo.

## 6. Nutzung

Du verpflichtest dich, Dilo nicht missbräuchlich oder rechtswidrig zu nutzen.

## 7. Verfügbarkeit und technische Voraussetzungen

Dilo wird ohne Gewähr für eine ständige Verfügbarkeit bereitgestellt. Die KI benötigt einen Browser mit WebGPU-Unterstützung und ausreichend Arbeitsspeicher.

## 8. Deine Daten

Alle Inhalte werden nur verschlüsselt in deinem Konto auf deinem Gerät gespeichert. Wir können sie weder einsehen noch wiederherstellen. Beim Löschen der Browserdaten gehen sie verloren; ohne dein Passwort lassen sie sich nicht wiederherstellen. Du bist für die sichere Aufbewahrung deines Passworts verantwortlich. Einzelheiten in der Datenschutzerklärung.

## 9. Haftung

Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Da Dilo unentgeltlich angeboten wird, ist die Haftung im Übrigen ausgeschlossen, soweit gesetzlich zulässig.

## 10. Open-Source-Komponenten

Dilo nutzt das Sprachmodell ${MODEL.name} des Qwen-Teams (Lizenz: ${MODEL.license}) sowie die Bibliothek WebLLM (Lizenz: Apache 2.0).

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

- Dilo has **no cookies, no tracking and no analytics**. Accounts exist only, encrypted, on your device, never with us.
- The AI runs **entirely on your device**. Your messages, journal entries and notes are **never sent to us or to third parties**. We have no access to them.
- The only personal data we process is what is technically necessary to deliver the website (server log files at our hosting provider).
- The AI model is downloaded once from Hugging Face, and only after you explicitly start the download.

## 3. Hosting

This website is hosted by Vercel Inc. (USA). When you visit it, the host processes technically necessary data (IP address, date and time, requested address, browser type, referrer) in server log files to deliver the website and keep it secure. The legal basis is Art. 6(1)(f) GDPR; our legitimate interest is providing the website securely and reliably. A data processing agreement is in place with Vercel. Transfers to the USA are based on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses.

## 4. Storage on your device

Dilo stores the following only in your browser (Local Storage and Cache Storage): your account with conversations, journal entries, notes and mood (encrypted), settings, your consent (with time and version) and the AI model files. This storage is strictly necessary for the service you request (§ 25(2) no. 2 TDDDG). Because your content may include information about your health, it is processed on the basis of your explicit consent (Art. 9(2)(a) GDPR).

Your content (conversations, journal entries, notes and mood) is stored in an account that exists only on this device. Only the account name you choose and technical values (a salt) are stored in plain text. All content is encrypted with AES-256-GCM using a key derived from your password with PBKDF2 (310,000 iterations), which is kept in memory only for the session. Your password is not stored. There is no password recovery: without the password, neither you nor we can restore the content. Accounts are not synchronised with other devices.

Conversations you additionally lock with their own password are encrypted a second time in the same way.

You can delete all data at any time in the settings under "Delete all my data and withdraw consent", or through your browser settings.

## 5. On-device AI processing

Dilo's replies are generated by the open-source language model ${MODEL.name} (licence: ${MODEL.license}), which runs directly in your browser using WebGPU. Your input never leaves your device. No automated decision-making within the meaning of Art. 22 GDPR takes place.

## 6. Downloading the AI model from Hugging Face

Only when you click "Download AI model" does your browser download the model files (about 1 GB) from Hugging Face, Inc. (USA). For technical reasons, your IP address and browser information are transmitted to Hugging Face; no conversation content is transmitted. The legal basis is your consent (Art. 6(1)(a) GDPR), given by starting the download. Where Hugging Face is not certified under the EU-US Data Privacy Framework, the transfer to the USA is based on your explicit consent under Art. 49(1)(a) GDPR. More information: https://huggingface.co/privacy

All other technical components (program code, fonts, model library) are delivered by our own hosting provider.

## 7. External links

Links to external websites (for example findahelpline.com) and phone numbers only become active when you click them. The respective provider is responsible for any data processing there.

## 8. Minimum age

Dilo is intended exclusively for people aged 18 and over.

## 9. Your rights

You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21 GDPR). You can withdraw your consent at any time with effect for the future (Art. 7(3) GDPR). Since your content is stored only on your device, you can view and delete it there yourself. You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the state where you live or where the controller is based (Art. 77 GDPR).`,

  terms: `# Terms of use

Last updated: ${LEGAL_LAST_UPDATED.en}

## 1. Provider and scope

These terms apply to the use of Dilo, provided by ${OPERATOR.name} (see legal notice).

## 2. What Dilo is and is not

Dilo is a free AI companion for emotional wellbeing. Dilo is **not a psychologist, doctor or therapist**, provides **no medical treatment, psychotherapy or medical advice**, makes **no diagnoses** and is **not a medical device**. Dilo does not replace professional help.

## 3. Not an emergency service

Dilo is not suitable for emergencies. In an acute crisis, or if you or others are in danger, call the emergency number **112** immediately, or contact TelefonSeelsorge (0800 111 0 111 or 0800 111 0 222, free, 24/7).

## 4. Minimum age

Only people aged 18 and over may use Dilo.

## 5. AI-generated content

Replies are generated automatically by an AI model. They may be incomplete, inaccurate or inappropriate. Do not rely on Dilo for important decisions, especially about your health.

## 6. Use

You agree not to use Dilo in an abusive or unlawful way.

## 7. Availability and technical requirements

Dilo is provided without any guarantee of continuous availability. The AI requires a browser with WebGPU support and sufficient memory.

## 8. Your data

All content is stored only, encrypted, in your account on your device. We can neither view nor restore it. It is lost when you clear your browser data and cannot be recovered without your password. You are responsible for keeping your password safe. See the privacy policy for details.

## 9. Liability

We are liable without limitation for intent and gross negligence, for injury to life, body or health, and under the German Product Liability Act. As Dilo is provided free of charge, liability is otherwise excluded to the extent permitted by law.

## 10. Open-source components

Dilo uses the language model ${MODEL.name} by the Qwen team (licence: ${MODEL.license}) and the WebLLM library (licence: Apache 2.0).

## 11. Changes and governing law

We may change these terms; for material changes you will be asked to confirm again. German law applies. Mandatory consumer protection rules of your country of residence remain unaffected.`,
};

export const LEGAL: Record<LegalLanguage, Record<LegalPage, string>> = { de, en };

/** Placeholders that must be replaced before publishing. */
export const hasPlaceholders = () => Object.values(OPERATOR).some((v) => /^\[.*\]$/.test(v));
