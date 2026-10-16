/**
 * Crisis lines shown in the "Get help now" dialog and next to replies the model flags.
 * Keep this list short and verified. Anyone outside these countries is pointed to
 * Find A Helpline, which maintains free, verified lines for most countries.
 */
export interface CrisisLine {
  country: string; // ISO 3166-1 alpha-2
  name: string;
  phone: string;
  tel: string;
  note?: string;
}

export const CRISIS_LINES: CrisisLine[] = [
  { country: "DE", name: "TelefonSeelsorge", phone: "0800 111 0 111", tel: "08001110111", note: "0800 111 0 222" },
  { country: "FR", name: "3114 – Prévention du suicide", phone: "3114", tel: "3114" },
  { country: "ES", name: "Línea 024", phone: "024", tel: "024" },
  { country: "US", name: "988 Suicide & Crisis Lifeline", phone: "988", tel: "988", note: "SMS 988" },
];

export const FIND_A_HELPLINE_URL = "https://findahelpline.com";

/** Country pages on Find A Helpline for languages whose main country isn't listed above. */
export const HELPLINE_COUNTRY_BY_LANGUAGE: Record<string, string> = {
  tr: "tr",
  fa: "ir",
};

export const helplineUrlFor = (language: string) => {
  const country = HELPLINE_COUNTRY_BY_LANGUAGE[language];
  return country ? `${FIND_A_HELPLINE_URL}/countries/${country}` : FIND_A_HELPLINE_URL;
};
