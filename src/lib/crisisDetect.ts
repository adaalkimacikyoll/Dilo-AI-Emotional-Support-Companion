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

/**
 * Clear first-person statements of intent to kill or seriously hurt another person.
 * Any match closes the conversation for good, so these patterns only cover explicit wording
 * ("I'm going to kill him"), not figures of speech ("my mum will kill me"). The model catches
 * the rest with its own marker.
 */
const HARM_OTHERS_PATTERNS: RegExp[] = [
  // English
  /\b(i\s+want\s+to|i\s+wanna|i'?m\s+going\s+to|i\s+am\s+going\s+to|i'?m\s+gonna|i\s+will|i'?ll|i\s+plan\s+to|i'?m\s+planning\s+to)\s+(really\s+)?(kill|murder|stab|shoot|strangle|poison|hurt|harm|attack|beat\s+up)\s+(him|her|them|someone|somebody|people|everyone|everybody|my\s+\p{L}+|that\s+\p{L}+|this\s+\p{L}+)\b/iu,
  // German
  /\bich\s+(will|möchte|werde|werd)\s+(ihn|sie|jemanden|alle|meinen\s+\p{L}+|meine\s+\p{L}+|diesen\s+\p{L}+|diese\s+\p{L}+)\s+(umbringen|töten|ermorden|abstechen|erschießen|erstechen|verletzen)/iu,
  // French
  /\bje\s+(vais|veux)\s+(le|la|les|l')\s*(tuer|buter|poignarder|frapper)\b/iu,
  /\bje\s+(vais|veux)\s+(tuer|buter|poignarder)\s+(quelqu'un|mon\s+\p{L}+|ma\s+\p{L}+|mes\s+\p{L}+|tout\s+le\s+monde)/iu,
  /\bje\s+vais\s+(lui|leur)\s+faire\s+du\s+mal\b/iu,
  // Spanish
  /\b(voy\s+a|quiero)\s+(matarlo|matarla|matarlos|matarlas|matar\s+a\s+\p{L}+|apuñalarlo|apuñalarla|hacerle\s+daño|hacerles\s+daño)/iu,
  // Arabic
  /سأقتله|سأقتلها|سأقتلهم|أريد أن أقتله|أريد أن أقتلها|أريد قتله|أريد قتلها|سأؤذيه|سأؤذيها/,
  // Persian
  /می‌?کشمش|میکشمش|می‌?خواهم بکشمش|میخوام بکشمش|می‌?خواهم او را بکشم|بهش آسیب می‌?زنم/,
];

/** Turkish marks the object with a suffix, so these phrases only count when the user isn't talking about themselves. */
const HARM_OTHERS_TURKISH = /öldüreceğim|öldürecem|öldürcem|öldürücem|öldürmek istiyorum|gebertece[ğk]im|gebertcem|gebertmek istiyorum|bıçaklayacağım|zarar vereceğim|zarar vermek istiyorum|canını yakacağım/i;
const TURKISH_SELF = /kendimi|kendime|kendi canım/i;

export function detectHarmToOthers(text: string): boolean {
  const normalized = text.normalize("NFC");
  if (HARM_OTHERS_PATTERNS.some((p) => p.test(normalized))) return true;
  return HARM_OTHERS_TURKISH.test(normalized) && !TURKISH_SELF.test(normalized);
}
