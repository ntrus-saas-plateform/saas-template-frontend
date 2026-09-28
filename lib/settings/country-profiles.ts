/**
 * Expert country → tenant defaults cascade.
 * Selecting a country drives currency, timezone, locale, formats, and fiscal year.
 */

export type CountryProfile = {
  country: string;
  currency: string;
  timezone: string;
  locale: string;
  defaultLanguage: string;
  languages: string[];
  dateFormat: string;
  timeFormat: "12h" | "24h";
  numberFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  firstDayOfWeek: number;
  phoneFormat: "international" | "national" | "e164";
  addressFormat: string;
  postalFormat: string;
  fiscalYearStartMonth: number;
  fiscalYearStartDay: number;
  calendar: string;
};

const DEFAULT_PROFILE: Omit<CountryProfile, "country"> = {
  currency: "USD",
  timezone: "UTC",
  locale: "en",
  defaultLanguage: "en",
  languages: ["en"],
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  numberFormat: "1,234.56",
  decimalSeparator: ".",
  thousandsSeparator: ",",
  firstDayOfWeek: 1,
  phoneFormat: "international",
  addressFormat: "default",
  postalFormat: "default",
  fiscalYearStartMonth: 1,
  fiscalYearStartDay: 1,
  calendar: "gregorian",
};

/** Curated overrides; anything missing falls back to DEFAULT_PROFILE + country. */
const PROFILES: Record<string, Partial<Omit<CountryProfile, "country">>> = {
  BI: {
    currency: "BIF",
    timezone: "Africa/Bujumbura",
    locale: "fr-BI",
    defaultLanguage: "fr",
    languages: ["fr", "rn", "en"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
    firstDayOfWeek: 1,
  },
  RW: {
    currency: "RWF",
    timezone: "Africa/Kigali",
    locale: "en",
    defaultLanguage: "en",
    languages: ["en", "fr", "rw"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56",
  },
  KE: {
    currency: "KES",
    timezone: "Africa/Nairobi",
    locale: "en-KE",
    defaultLanguage: "en",
    languages: ["en", "sw"],
    dateFormat: "DD/MM/YYYY",
  },
  TZ: {
    currency: "TZS",
    timezone: "Africa/Dar_es_Salaam",
    locale: "sw-TZ",
    defaultLanguage: "sw",
    languages: ["sw", "en"],
    dateFormat: "DD/MM/YYYY",
  },
  UG: {
    currency: "UGX",
    timezone: "Africa/Kampala",
    locale: "en",
    defaultLanguage: "en",
    languages: ["en", "sw"],
    dateFormat: "DD/MM/YYYY",
  },
  CD: {
    currency: "CDF",
    timezone: "Africa/Kinshasa",
    locale: "fr-CD",
    defaultLanguage: "fr",
    languages: ["fr", "en"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  CG: {
    currency: "XAF",
    timezone: "Africa/Brazzaville",
    locale: "fr",
    defaultLanguage: "fr",
    languages: ["fr"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  CM: {
    currency: "XAF",
    timezone: "Africa/Douala",
    locale: "fr",
    defaultLanguage: "fr",
    languages: ["fr", "en"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  SN: {
    currency: "XOF",
    timezone: "Africa/Dakar",
    locale: "fr-SN",
    defaultLanguage: "fr",
    languages: ["fr"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  CI: {
    currency: "XOF",
    timezone: "Africa/Abidjan",
    locale: "fr-CI",
    defaultLanguage: "fr",
    languages: ["fr"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  NG: {
    currency: "NGN",
    timezone: "Africa/Lagos",
    locale: "en-NG",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "DD/MM/YYYY",
  },
  ZA: {
    currency: "ZAR",
    timezone: "Africa/Johannesburg",
    locale: "en-ZA",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "YYYY-MM-DD",
  },
  MA: {
    currency: "MAD",
    timezone: "Africa/Casablanca",
    locale: "fr-MA",
    defaultLanguage: "fr",
    languages: ["fr", "ar"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  EG: {
    currency: "EGP",
    timezone: "Africa/Cairo",
    locale: "ar-EG",
    defaultLanguage: "ar",
    languages: ["ar", "en"],
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: 6,
  },
  FR: {
    currency: "EUR",
    timezone: "Europe/Paris",
    locale: "fr-FR",
    defaultLanguage: "fr",
    languages: ["fr"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
    addressFormat: "eu",
    fiscalYearStartMonth: 1,
  },
  BE: {
    currency: "EUR",
    timezone: "Europe/Brussels",
    locale: "fr-BE",
    defaultLanguage: "fr",
    languages: ["fr", "nl", "de"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
    addressFormat: "eu",
  },
  CH: {
    currency: "CHF",
    timezone: "Europe/Zurich",
    locale: "fr-CH",
    defaultLanguage: "fr",
    languages: ["de", "fr", "it"],
    dateFormat: "DD.MM.YYYY",
    numberFormat: "1'234.56",
    addressFormat: "eu",
  },
  DE: {
    currency: "EUR",
    timezone: "Europe/Berlin",
    locale: "de-DE",
    defaultLanguage: "de",
    languages: ["de"],
    dateFormat: "DD.MM.YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
    addressFormat: "eu",
  },
  GB: {
    currency: "GBP",
    timezone: "Europe/London",
    locale: "en-GB",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    addressFormat: "uk",
    firstDayOfWeek: 1,
  },
  IE: {
    currency: "EUR",
    timezone: "Europe/Dublin",
    locale: "en-IE",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "DD/MM/YYYY",
  },
  NL: {
    currency: "EUR",
    timezone: "Europe/Amsterdam",
    locale: "nl-NL",
    defaultLanguage: "nl",
    languages: ["nl", "en"],
    dateFormat: "DD-MM-YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  ES: {
    currency: "EUR",
    timezone: "Europe/Madrid",
    locale: "es-ES",
    defaultLanguage: "es",
    languages: ["es"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  IT: {
    currency: "EUR",
    timezone: "Europe/Rome",
    locale: "it-IT",
    defaultLanguage: "it",
    languages: ["it"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  PT: {
    currency: "EUR",
    timezone: "Europe/Lisbon",
    locale: "pt-PT",
    defaultLanguage: "pt",
    languages: ["pt"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1 234,56",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  US: {
    currency: "USD",
    timezone: "America/New_York",
    locale: "en-US",
    defaultLanguage: "en",
    languages: ["en", "es"],
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    numberFormat: "1,234.56",
    firstDayOfWeek: 0,
    addressFormat: "us",
    postalFormat: "strict",
    fiscalYearStartMonth: 10,
    fiscalYearStartDay: 1,
  },
  CA: {
    currency: "CAD",
    timezone: "America/Toronto",
    locale: "en-CA",
    defaultLanguage: "en",
    languages: ["en", "fr"],
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12h",
    firstDayOfWeek: 0,
  },
  MX: {
    currency: "MXN",
    timezone: "America/Mexico_City",
    locale: "es-MX",
    defaultLanguage: "es",
    languages: ["es", "en"],
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  },
  BR: {
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    locale: "pt-BR",
    defaultLanguage: "pt",
    languages: ["pt"],
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1.234,56",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  AE: {
    currency: "AED",
    timezone: "Asia/Dubai",
    locale: "ar-AE",
    defaultLanguage: "ar",
    languages: ["ar", "en"],
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: 6,
    calendar: "gregorian",
  },
  SA: {
    currency: "SAR",
    timezone: "Asia/Riyadh",
    locale: "ar-SA",
    defaultLanguage: "ar",
    languages: ["ar", "en"],
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: 0,
  },
  IN: {
    currency: "INR",
    timezone: "Asia/Kolkata",
    locale: "en-IN",
    defaultLanguage: "en",
    languages: ["en", "hi"],
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: 1,
  },
  CN: {
    currency: "CNY",
    timezone: "Asia/Shanghai",
    locale: "zh-CN",
    defaultLanguage: "zh",
    languages: ["zh", "en"],
    dateFormat: "YYYY-MM-DD",
    firstDayOfWeek: 1,
  },
  JP: {
    currency: "JPY",
    timezone: "Asia/Tokyo",
    locale: "ja-JP",
    defaultLanguage: "ja",
    languages: ["ja", "en"],
    dateFormat: "YYYY-MM-DD",
    firstDayOfWeek: 0,
  },
  SG: {
    currency: "SGD",
    timezone: "Asia/Singapore",
    locale: "en-SG",
    defaultLanguage: "en",
    languages: ["en", "zh", "ms"],
    dateFormat: "DD/MM/YYYY",
  },
  AU: {
    currency: "AUD",
    timezone: "Australia/Sydney",
    locale: "en-AU",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: 1,
    fiscalYearStartMonth: 7,
  },
  NZ: {
    currency: "NZD",
    timezone: "Pacific/Auckland",
    locale: "en-NZ",
    defaultLanguage: "en",
    languages: ["en"],
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    fiscalYearStartMonth: 4,
  },
};

export function getCountryProfile(country: string | null | undefined): CountryProfile | null {
  if (!country || country.length !== 2) return null;
  const code = country.toUpperCase();
  return {
    country: code,
    ...DEFAULT_PROFILE,
    ...PROFILES[code],
  };
}

export type AlignmentSnapshot = {
  country: string | null;
  expected: CountryProfile | null;
  current: {
    currency?: string | null;
    timezone?: string | null;
    locale?: string | null;
    defaultLanguage?: string | null;
    fiscalYearStartMonth?: number | null;
  };
  drifts: Array<{ field: string; expected: string; actual: string; section: string }>;
};

export function computeAlignment(input: {
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  locale?: string | null;
  defaultLanguage?: string | null;
  fiscalYearStartMonth?: number | null;
}): AlignmentSnapshot {
  const country = input.country?.toUpperCase() || null;
  const expected = getCountryProfile(country);
  const drifts: AlignmentSnapshot["drifts"] = [];
  if (expected) {
    const checks: Array<{
      field: string;
      section: string;
      expected: string;
      actual: string | null | undefined;
    }> = [
      {
        field: "Primary currency",
        section: "Currency",
        expected: expected.currency,
        actual: input.currency,
      },
      {
        field: "Timezone",
        section: "Localization",
        expected: expected.timezone,
        actual: input.timezone,
      },
      {
        field: "Locale",
        section: "Localization",
        expected: expected.locale,
        actual: input.locale,
      },
      {
        field: "Default language",
        section: "Localization",
        expected: expected.defaultLanguage,
        actual: input.defaultLanguage,
      },
      {
        field: "Fiscal year start",
        section: "Fiscal",
        expected: String(expected.fiscalYearStartMonth),
        actual:
          input.fiscalYearStartMonth != null
            ? String(input.fiscalYearStartMonth)
            : null,
      },
    ];
    for (const c of checks) {
      if (c.actual != null && c.actual !== "" && c.actual !== c.expected) {
        drifts.push({
          field: c.field,
          section: c.section,
          expected: c.expected,
          actual: c.actual,
        });
      }
    }
  }
  return {
    country,
    expected,
    current: {
      currency: input.currency,
      timezone: input.timezone,
      locale: input.locale,
      defaultLanguage: input.defaultLanguage,
      fiscalYearStartMonth: input.fiscalYearStartMonth,
    },
    drifts,
  };
}

/** Patches to apply when aligning the tenant to a country profile. */
export function buildCascadePatches(profile: CountryProfile): {
  regional: Record<string, unknown>;
  localization: Record<string, unknown>;
  currency: Record<string, unknown>;
  fiscal: Record<string, unknown>;
  billing: Record<string, unknown>;
  tenant: Record<string, unknown>;
} {
  return {
    regional: { country: profile.country },
    localization: {
      timezone: profile.timezone,
      locale: profile.locale,
      defaultLanguage: profile.defaultLanguage,
      languages: profile.languages,
      currency: profile.currency,
      dateFormat: profile.dateFormat,
      timeFormat: profile.timeFormat,
      numberFormat: profile.numberFormat,
      decimalSeparator: profile.decimalSeparator,
      thousandsSeparator: profile.thousandsSeparator,
      firstDayOfWeek: profile.firstDayOfWeek,
      calendar: profile.calendar,
      phoneFormat: profile.phoneFormat,
      addressFormat: profile.addressFormat,
      postalFormat: profile.postalFormat,
    },
    currency: {
      primary: profile.currency,
      display: profile.currency,
      transaction: profile.currency,
      functional: profile.currency,
      reporting: profile.currency,
    },
    fiscal: {
      calendar: profile.calendar,
      yearStartMonth: profile.fiscalYearStartMonth,
      yearStartDay: profile.fiscalYearStartDay,
    },
    billing: { currency: profile.currency },
    tenant: {
      country: profile.country,
      timezone: profile.timezone,
      locale: profile.locale,
      defaultLanguage: profile.defaultLanguage,
      defaultCurrency: profile.currency,
      dateFormat: profile.dateFormat,
      timeFormat: profile.timeFormat,
      numberFormat: profile.numberFormat,
      fiscalCalendar: profile.calendar,
      fiscalYearStartMonth: profile.fiscalYearStartMonth,
      fiscalYearStartDay: profile.fiscalYearStartDay,
    },
  };
}
