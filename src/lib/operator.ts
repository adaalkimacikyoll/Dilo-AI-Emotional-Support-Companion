/**
 * Who runs Dilo. Required for the Impressum (§ 5 DDG) and the privacy policy (Art. 13 GDPR).
 * Replace every placeholder before publishing. `npm run check:legal` fails while any remain.
 */
export const OPERATOR = {
  name: "[Vor- und Nachname]",
  street: "[Straße und Hausnummer]",
  city: "[PLZ und Ort]",
  country: "Deutschland",
  email: "[E-Mail-Adresse]",
};

/** Bump when the consent text or legal pages change in a way users must re-confirm. */
export const CONSENT_VERSION = 1;
export const LEGAL_LAST_UPDATED = { de: "Oktober 2026", en: "October 2026" };
