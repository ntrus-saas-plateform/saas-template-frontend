/**
 * Shared select option catalogs for settings forms.
 * Large catalogs (country / currency / timezone / locale) come from reference-data (ISO + Intl).
 */

export type { SelectOption } from "@/lib/settings/reference-data";
export {
  getCountryOptions,
  getCurrencyOptions,
  getTimezoneOptions,
  getLocaleOptions,
  getLanguageOptions,
  withCurrentOption,
  filterOptions,
} from "@/lib/settings/reference-data";

import type { SelectOption } from "@/lib/settings/reference-data";

/** @deprecated Prefer getCountryOptions() — kept for gradual migration. */
export const COUNTRY_OPTIONS: SelectOption[] = [];
/** @deprecated Prefer getCurrencyOptions() */
export const CURRENCY_OPTIONS: SelectOption[] = [];
/** @deprecated Prefer getTimezoneOptions() */
export const TIMEZONE_OPTIONS: SelectOption[] = [];
/** @deprecated Prefer getLocaleOptions() */
export const LOCALE_OPTIONS: SelectOption[] = [];
/** @deprecated Prefer getLanguageOptions() */
export const LANGUAGE_OPTIONS: SelectOption[] = [];

export const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: "pharmacy", label: "Pharmacy / healthcare" },
  { value: "hospital", label: "Hospital / clinic" },
  { value: "retail", label: "Retail" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "wholesale", label: "Wholesale / distribution" },
  { value: "hospitality", label: "Hospitality" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "agriculture", label: "Agriculture" },
  { value: "construction", label: "Construction" },
  { value: "transport", label: "Transport / logistics" },
  { value: "finance", label: "Finance / insurance" },
  { value: "education", label: "Education" },
  { value: "services", label: "Professional services" },
  { value: "technology", label: "Technology / software" },
  { value: "telecom", label: "Telecommunications" },
  { value: "energy", label: "Energy / utilities" },
  { value: "nonprofit", label: "Nonprofit / NGO" },
  { value: "public", label: "Public sector / government" },
  { value: "other", label: "Other" },
];

/** Legal forms across common jurisdictions (searchable). */
export const COMPANY_TYPE_OPTIONS: SelectOption[] = [
  { value: "sarl", label: "SARL (FR/BE/CH/Afrique)" },
  { value: "sas", label: "SAS — Société par actions simplifiée" },
  { value: "sa", label: "SA — Société anonyme / Corporation" },
  { value: "sasu", label: "SASU" },
  { value: "eurl", label: "EURL" },
  { value: "sci", label: "SCI" },
  { value: "snc", label: "SNC" },
  { value: "scs", label: "SCS" },
  { value: "sca", label: "SCA" },
  { value: "sprl", label: "SPRL (Belgique)" },
  { value: "srl", label: "SRL (Belgique)" },
  { value: "gmbh", label: "GmbH (DE/AT/CH)" },
  { value: "ag", label: "AG (DE/CH)" },
  { value: "ug", label: "UG (haftungsbeschränkt)" },
  { value: "ltd", label: "Ltd — Private limited (UK/IE/KE/…)" },
  { value: "plc", label: "PLC — Public limited" },
  { value: "llp", label: "LLP — Limited liability partnership" },
  { value: "llc", label: "LLC (US)" },
  { value: "inc", label: "Inc. / Corporation (US)" },
  { value: "pc", label: "P.C. — Professional corporation" },
  { value: "pty", label: "Pty Ltd (AU/ZA)" },
  { value: "bv", label: "B.V. (NL)" },
  { value: "nv", label: "N.V. (NL/BE)" },
  { value: "oy", label: "Oy (FI)" },
  { value: "ab", label: "AB (SE)" },
  { value: "as", label: "AS (NO)" },
  { value: "spa", label: "S.p.A. (IT)" },
  { value: "srl_it", label: "S.r.l. (IT)" },
  { value: "sl", label: "S.L. (ES)" },
  { value: "sa_es", label: "S.A. (ES)" },
  { value: "lda", label: "Lda (PT/AO/MZ)" },
  { value: "sole", label: "Sole proprietorship / EI" },
  { value: "partnership", label: "General partnership" },
  { value: "cooperative", label: "Cooperative" },
  { value: "association", label: "Association / NGO" },
  { value: "foundation", label: "Foundation" },
  { value: "public", label: "Public entity / état" },
  { value: "branch", label: "Foreign branch" },
  { value: "other", label: "Other" },
];

export const DATE_FORMAT_OPTIONS: SelectOption[] = [
  { value: "YYYY-MM-DD", label: "2026-09-06 (ISO)" },
  { value: "DD/MM/YYYY", label: "06/09/2026" },
  { value: "MM/DD/YYYY", label: "09/06/2026" },
  { value: "DD.MM.YYYY", label: "06.09.2026" },
  { value: "DD-MM-YYYY", label: "06-09-2026" },
  { value: "D MMM YYYY", label: "6 Sep 2026" },
];

export const NUMBER_FORMAT_OPTIONS: SelectOption[] = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (DE/ES/IT)" },
  { value: "1 234,56", label: "1 234,56 (FR/BI)" },
  { value: "1'234.56", label: "1'234.56 (CH)" },
  { value: "1234.56", label: "1234.56 (plain)" },
];

export const CALENDAR_OPTIONS: SelectOption[] = [
  { value: "gregorian", label: "Gregorian" },
  { value: "islamic", label: "Islamic (Hijri)" },
  { value: "hebrew", label: "Hebrew" },
  { value: "persian", label: "Persian" },
  { value: "buddhist", label: "Buddhist" },
];

export const TIME_FORMAT_OPTIONS: SelectOption[] = [
  { value: "24h", label: "24-hour (14:30)" },
  { value: "12h", label: "12-hour (2:30 PM)" },
];

export const ROUNDING_OPTIONS: SelectOption[] = [
  { value: "half_up", label: "Half up (standard)" },
  { value: "half_even", label: "Half even (bankers)" },
  { value: "down", label: "Always down" },
  { value: "up", label: "Always up" },
];

export const FX_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "manual", label: "Manual" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export const FX_SOURCE_OPTIONS: SelectOption[] = [
  { value: "manual", label: "Manual rates" },
  { value: "ecb", label: "ECB" },
  { value: "openexchangerates", label: "Open Exchange Rates" },
  { value: "custom", label: "Custom provider" },
];

export const FIRST_DAY_OPTIONS: SelectOption[] = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "6", label: "Saturday" },
];

export const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2026, i, 1).toLocaleString("en", { month: "long" }),
}));

export const DAY_OPTIONS: SelectOption[] = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export const ADDRESS_FORMAT_OPTIONS: SelectOption[] = [
  { value: "default", label: "Default" },
  { value: "us", label: "United States" },
  { value: "eu", label: "European" },
  { value: "uk", label: "United Kingdom" },
];

export const PHONE_FORMAT_OPTIONS: SelectOption[] = [
  { value: "international", label: "International (+257 …)" },
  { value: "national", label: "National" },
  { value: "e164", label: "E.164" },
];

export const POSTAL_FORMAT_OPTIONS: SelectOption[] = [
  { value: "default", label: "Default" },
  { value: "strict", label: "Strict validation" },
  { value: "optional", label: "Optional" },
];

export const DECIMAL_SEP_OPTIONS: SelectOption[] = [
  { value: ".", label: "Period (.)" },
  { value: ",", label: "Comma (,)" },
];

export const THOUSANDS_SEP_OPTIONS: SelectOption[] = [
  { value: ",", label: "Comma (,)" },
  { value: ".", label: "Period (.)" },
  { value: " ", label: "Space" },
  { value: "'", label: "Apostrophe (')" },
  { value: "", label: "None" },
];

export const YES_NO_OPTIONS: SelectOption[] = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export const DIGEST_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "immediate", label: "Immediate" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export const UNIQUENESS_SCOPE_OPTIONS: SelectOption[] = [
  { value: "TENANT", label: "Tenant-wide" },
  { value: "ORG", label: "Per organization" },
  { value: "FISCAL_YEAR", label: "Per fiscal year" },
];

export const PAPER_FORMAT_OPTIONS: SelectOption[] = [
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
];

export const PRINT_FORMAT_OPTIONS: SelectOption[] = [
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
  { value: "Receipt", label: "Receipt" },
];

export const MFA_POLICY_OPTIONS: SelectOption[] = [
  { value: "optional", label: "Optional" },
  { value: "required_for_admins", label: "Required for admins" },
  { value: "required_for_sensitive_ops", label: "Required for sensitive ops" },
  { value: "required", label: "Required for everyone" },
];

export const MFA_METHOD_OPTIONS: SelectOption[] = [
  { value: "totp", label: "Authenticator app (TOTP)" },
  { value: "webauthn", label: "Passkey / WebAuthn" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

export const SSO_PROVIDER_OPTIONS: SelectOption[] = [
  { value: "google", label: "Google" },
  { value: "microsoft", label: "Microsoft" },
  { value: "apple", label: "Apple" },
  { value: "ldap", label: "LDAP" },
  { value: "ad", label: "Active Directory" },
  { value: "saml", label: "SAML" },
  { value: "oidc", label: "OIDC" },
];

export const BACKUP_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export const MIGRATION_STATUS_OPTIONS: SelectOption[] = [
  { value: "ready", label: "Ready" },
  { value: "running", label: "Running" },
  { value: "failed", label: "Failed" },
  { value: "complete", label: "Complete" },
];

export const INTEGRATION_PROVIDER_OPTIONS: SelectOption[] = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "mailgun", label: "Mailgun" },
  { value: "twilio", label: "Twilio" },
  { value: "slack", label: "Slack" },
  { value: "quickbooks", label: "QuickBooks" },
  { value: "xero", label: "Xero" },
  { value: "custom", label: "Custom" },
];

export const INTEGRATION_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "Payment", label: "Payment" },
  { value: "Email", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "Accounting", label: "Accounting" },
  { value: "Identity", label: "Identity" },
  { value: "Storage", label: "Storage" },
  { value: "Other", label: "Other" },
];

export const DOCUMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "INV", label: "Invoice (INV)" },
  { value: "PO", label: "Purchase order (PO)" },
  { value: "SO", label: "Sales order (SO)" },
  { value: "CUS", label: "Customer (CUS)" },
  { value: "PRD", label: "Product (PRD)" },
  { value: "CN", label: "Credit note (CN)" },
  { value: "DN", label: "Delivery note (DN)" },
];

export const TEMPLATE_TYPE_OPTIONS: SelectOption[] = [
  { value: "invoice", label: "Invoice" },
  { value: "quote", label: "Quote" },
  { value: "receipt", label: "Receipt" },
  { value: "purchase_order", label: "Purchase order" },
  { value: "delivery_note", label: "Delivery note" },
  { value: "statement", label: "Statement" },
];

export const DATA_JOB_TYPE_OPTIONS: SelectOption[] = [
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "purge", label: "Purge" },
  { value: "anonymize", label: "Anonymize" },
  { value: "backup", label: "Backup" },
];

export const DATA_JOB_STATUS_OPTIONS: SelectOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];
