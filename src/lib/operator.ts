/**
 * Who runs Dilo. Required for the Impressum (§ 5 DDG) and the privacy policy (Art. 13 GDPR).
 * `npm run check:legal` fails if any placeholder remains.
 */
export const OPERATOR = {
  name: "Ada Alkim Acikyol",
  street: "Hans-Beimler-Straße 69",
  city: "14554 Seddiner See (OT Neuseddin)",
  country: "Deutschland",
  email: "ada.acikyol@gmail.com",
};

/** Bump when the consent text or legal pages change in a way users must re-confirm. */
export const CONSENT_VERSION = 2;
export const LEGAL_LAST_UPDATED = { de: "Oktober 2026", en: "October 2026" };
