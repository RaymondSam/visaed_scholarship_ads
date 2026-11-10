const CODES = `
AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ
CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET
FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR
IS IT JM JO JP KE KG KH KI KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC
MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA
PE PG PH PK PL PT PW PY QA RO RS RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST
SV SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA
ZM ZW
`
  .trim()
  .split(/\s+/);

export const COUNTRY_CODES: string[] = [...CODES].sort();

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string | null | undefined): string {
  if (!code) return "Not specified";
  return displayNames.of(code.toUpperCase()) ?? code.toUpperCase();
}

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function parseCountryList(value: string): string[] {
  const seen = new Set<string>();
  for (const part of value.split(/[\s,]+/)) {
    const code = normalizeCountryCode(part);
    if (code) seen.add(code);
  }
  return [...seen];
}
