/**
 * Runtime reference data for tenant settings.
 * Uses Intl where available so labels follow the browser locale.
 */

export type SelectOption = { value: string; label: string; group?: string };

/** ISO 3166-1 alpha-2 — all UN members + widely used territories. */
const ISO_COUNTRIES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","EH","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY",
  "HK","HM","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","UM","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "YE","YT",
  "ZA","ZM","ZW",
] as const;

/** Active ISO 4217 currencies (common circulating + regional). */
const ISO_CURRENCIES = [
  "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN",
  "BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BRL","BSD","BTN","BWP","BYN","BZD",
  "CAD","CDF","CHF","CLP","CNY","COP","CRC","CUP","CVE","CZK",
  "DJF","DKK","DOP","DZD",
  "EGP","ERN","ETB","EUR",
  "FJD","FKP",
  "GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD",
  "HKD","HNL","HTG","HUF",
  "IDR","ILS","INR","IQD","IRR","ISK",
  "JMD","JOD","JPY",
  "KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT",
  "LAK","LBP","LKR","LRD","LSL","LYD",
  "MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN",
  "NAD","NGN","NIO","NOK","NPR","NZD",
  "OMR",
  "PAB","PEN","PGK","PHP","PKR","PLN","PYG",
  "QAR",
  "RON","RSD","RUB","RWF",
  "SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLE","SOS","SRD","SSP","STN","SVC","SYP","SZL",
  "THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS",
  "UAH","UGX","USD","UYU","UZS",
  "VES","VND","VUV",
  "WST",
  "XAF","XCD","XOF","XPF",
  "YER",
  "ZAR","ZMW","ZWG",
] as const;

const BCP47_LOCALES = [
  "ar","ar-AE","ar-EG","ar-MA","ar-SA",
  "bn","bn-BD","bn-IN",
  "cs","cs-CZ",
  "da","da-DK",
  "de","de-AT","de-CH","de-DE",
  "el","el-GR",
  "en","en-AU","en-CA","en-GB","en-IE","en-IN","en-KE","en-NG","en-NZ","en-SG","en-US","en-ZA",
  "es","es-AR","es-CL","es-CO","es-ES","es-MX","es-PE","es-US",
  "fa","fa-IR",
  "fi","fi-FI",
  "fr","fr-BE","fr-BI","fr-CA","fr-CD","fr-CH","fr-CI","fr-FR","fr-LU","fr-MA","fr-SN",
  "he","he-IL",
  "hi","hi-IN",
  "hu","hu-HU",
  "id","id-ID",
  "it","it-CH","it-IT",
  "ja","ja-JP",
  "ko","ko-KR",
  "ms","ms-MY",
  "nl","nl-BE","nl-NL",
  "no","nb-NO",
  "pl","pl-PL",
  "pt","pt-AO","pt-BR","pt-MZ","pt-PT",
  "rn","rn-BI",
  "ro","ro-RO",
  "ru","ru-RU",
  "rw","rw-RW",
  "sv","sv-SE",
  "sw","sw-KE","sw-TZ",
  "th","th-TH",
  "tr","tr-TR",
  "uk","uk-UA",
  "ur","ur-PK",
  "vi","vi-VN",
  "zh","zh-CN","zh-HK","zh-SG","zh-TW",
] as const;

const LANGUAGE_CODES = [
  "ar","bn","cs","da","de","el","en","es","fa","fi","fr","he","hi","hu","id","it","ja","ko",
  "ms","nl","no","pl","pt","rn","ro","ru","rw","sv","sw","th","tr","uk","ur","vi","zh",
] as const;

function displayNames(
  type: Intl.DisplayNamesType,
  locale = typeof navigator !== "undefined" ? navigator.language : "en",
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale, "en"], { type });
  } catch {
    return null;
  }
}

function labelForCountry(code: string): string {
  const dn = displayNames("region");
  const name = dn?.of(code) ?? code;
  return `${name} (${code})`;
}

function labelForCurrency(code: string): string {
  const dn = displayNames("currency");
  const name = dn?.of(code);
  return name && name !== code ? `${code} — ${name}` : code;
}

function labelForLanguage(code: string): string {
  const dn = displayNames("language");
  const name = dn?.of(code);
  return name && name !== code ? `${name} (${code})` : code;
}

function labelForLocale(tag: string): string {
  try {
    const loc = new Intl.Locale(tag);
    const langDn = displayNames("language");
    const regionDn = displayNames("region");
    const lang = langDn?.of(loc.language) ?? loc.language;
    if (loc.region) {
      const region = regionDn?.of(loc.region) ?? loc.region;
      return `${lang} — ${region} (${tag})`;
    }
    return `${lang} (${tag})`;
  } catch {
    return tag;
  }
}

let _countries: SelectOption[] | null = null;
let _currencies: SelectOption[] | null = null;
let _timezones: SelectOption[] | null = null;
let _locales: SelectOption[] | null = null;
let _languages: SelectOption[] | null = null;

export function getCountryOptions(): SelectOption[] {
  if (_countries) return _countries;
  _countries = ISO_COUNTRIES.map((value) => ({
    value,
    label: labelForCountry(value),
  })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return _countries;
}

export function getCurrencyOptions(): SelectOption[] {
  if (_currencies) return _currencies;
  _currencies = ISO_CURRENCIES.map((value) => ({
    value,
    label: labelForCurrency(value),
  })).sort((a, b) => a.value.localeCompare(b.value));
  return _currencies;
}

export function getTimezoneOptions(): SelectOption[] {
  if (_timezones) return _timezones;
  let zones: string[] = ["UTC"];
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      zones = (Intl as typeof Intl & { supportedValuesOf(k: string): string[] }).supportedValuesOf(
        "timeZone",
      );
    }
  } catch {
    /* keep UTC fallback */
  }
  if (!zones.includes("UTC")) zones = ["UTC", ...zones];
  _timezones = zones.map((value) => ({ value, label: value }));
  return _timezones;
}

export function getLocaleOptions(): SelectOption[] {
  if (_locales) return _locales;
  _locales = BCP47_LOCALES.map((value) => ({
    value,
    label: labelForLocale(value),
  })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return _locales;
}

export function getLanguageOptions(): SelectOption[] {
  if (_languages) return _languages;
  _languages = LANGUAGE_CODES.map((value) => ({
    value,
    label: labelForLanguage(value),
  })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return _languages;
}

export function withCurrentOption(
  options: SelectOption[],
  current: string | null | undefined,
): SelectOption[] {
  if (!current) return options;
  if (options.some((o) => o.value === current)) return options;
  return [{ value: current, label: current }, ...options];
}

export function filterOptions(
  options: SelectOption[],
  query: string,
  limit = 80,
): SelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  const scored: Array<{ o: SelectOption; score: number }> = [];
  for (const o of options) {
    const v = o.value.toLowerCase();
    const l = o.label.toLowerCase();
    if (v === q) scored.push({ o, score: 0 });
    else if (v.startsWith(q)) scored.push({ o, score: 1 });
    else if (l.startsWith(q)) scored.push({ o, score: 2 });
    else if (v.includes(q) || l.includes(q)) scored.push({ o, score: 3 });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.o.label.localeCompare(b.o.label))
    .slice(0, limit)
    .map((s) => s.o);
}
