/**
 * Deterministic safety net: shows crisis resources when a user message contains clear risk phrases,
 * independent of what the on-device model does. Small models can miss these signals, so this check
 * must never depend on the model. False positives are acceptable here; false negatives are not.
 */

const PATTERNS: RegExp[] = [
  // English
  /\bsuicid/i,
  /\bkill(ing)? myself\b/i,
  /\b(want|wanna|going) to die\b/i,
  /\bend (it all|my life)\b/i,
  /\bself[- ]?harm/i,
  /\b(hurt|harm|cut)(ting)? myself\b/i,
  /\bdon'?t want to (live|be here|exist)( anymore)?\b/i,
  /\bno reason to live\b/i,
  // Turkish
  /intihar/i,
  /kendimi (öldür|asmak|kes|yaral)/i,
  /ölmek istiyorum/i,
  /yaşamak istemiyorum/i,
  /canıma kıy/i,
  /kendime zarar/i,
  /hayatıma son/i,
  // German
  /suizid/i,
  /selbstmord/i,
  /mich (umbringen|töten)/i,
  /(will|möchte) (nicht mehr leben|sterben)/i,
  /selbstverletz/i,
  /mir etwas antun/i,
  // French
  /\bme (tuer|suicider)\b/i,
  /envie de mourir/i,
  /veux mourir/i,
  /en finir/i,
  /me faire du mal/i,
  // Spanish
  /suicid/i,
  /\bmatarme\b/i,
  /quiero morir/i,
  /no quiero vivir/i,
  /hacerme daño/i,
  // Arabic
  /انتحار/,
  /أقتل نفسي/,
  /اقتل نفسي/,
  /أريد أن أموت/,
  /أؤذي نفسي/,
  // Persian
  /خودکشی/,
  /خودمو بکشم|خودم را بکشم/,
  /می‌?خواهم بمیرم|میخوام بمیرم/,
  /به خودم آسیب/,
];

export function detectCrisis(text: string): boolean {
  const normalized = text.normalize("NFC");
  return PATTERNS.some((p) => p.test(normalized));
}
