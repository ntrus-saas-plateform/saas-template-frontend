import type { SelectOption } from "@/lib/settings/options";
import {
  ADDRESS_FORMAT_OPTIONS,
  BACKUP_FREQUENCY_OPTIONS,
  CALENDAR_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  DECIMAL_SEP_OPTIONS,
  DIGEST_FREQUENCY_OPTIONS,
  FIRST_DAY_OPTIONS,
  FX_FREQUENCY_OPTIONS,
  FX_SOURCE_OPTIONS,
  INDUSTRY_OPTIONS,
  MFA_METHOD_OPTIONS,
  MFA_POLICY_OPTIONS,
  MIGRATION_STATUS_OPTIONS,
  MONTH_OPTIONS,
  DAY_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  PAPER_FORMAT_OPTIONS,
  PHONE_FORMAT_OPTIONS,
  POSTAL_FORMAT_OPTIONS,
  PRINT_FORMAT_OPTIONS,
  ROUNDING_OPTIONS,
  SSO_PROVIDER_OPTIONS,
  THOUSANDS_SEP_OPTIONS,
  TIME_FORMAT_OPTIONS,
  UNIQUENESS_SCOPE_OPTIONS,
  getCountryOptions,
  getCurrencyOptions,
  getLanguageOptions,
  getLocaleOptions,
  getTimezoneOptions,
} from "@/lib/settings/options";

export type FieldControl =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "number"
  | "color"
  | "textarea"
  | "select"
  | "searchable"
  | "boolean"
  | "stringList"
  | "multiSelect"
  | "json"
  | "date"
  | "hidden";

export type FieldMeta = {
  key: string;
  label: string;
  control: FieldControl;
  options?: SelectOption[];
  /** Lazy catalog for large ISO lists (country/currency/timezone…). */
  getOptions?: () => SelectOption[];
  hint?: string;
  fullWidth?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

/**
 * Canonical UI catalog for settings namespaces.
 * Keys marked `hidden` remove redundancy / raw JSON blobs from the UI.
 * Ownership:
 * - Localization → timezone, locale, formats (not currency — Currency page owns money)
 * - Currency → primary/display/rounding/FX
 * - Fiscal → calendar + year start (not on Company)
 * - Regional → operating country/regions (Company keeps HQ address country)
 */
const NS: Record<string, FieldMeta[]> = {
  general: [
    {
      key: "companyType",
      label: "Organization type",
      control: "searchable",
      getOptions: () => COMPANY_TYPE_OPTIONS,
    },
    {
      key: "industry",
      label: "Industry",
      control: "searchable",
      getOptions: () => INDUSTRY_OPTIONS,
    },
  ],
  company: [
    { key: "legalMentions", label: "Legal mentions", control: "textarea", fullWidth: true },
    { key: "termsUrl", label: "Terms of service URL", control: "url" },
    { key: "privacyPolicyUrl", label: "Privacy policy URL", control: "url" },
  ],
  localization: [
    {
      key: "timezone",
      label: "Timezone",
      control: "searchable",
      getOptions: getTimezoneOptions,
      hint: "IANA timezone — search by city or region",
    },
    {
      key: "locale",
      label: "Locale",
      control: "searchable",
      getOptions: getLocaleOptions,
    },
    {
      key: "defaultLanguage",
      label: "Default language",
      control: "searchable",
      getOptions: getLanguageOptions,
    },
    {
      key: "languages",
      label: "Available languages",
      control: "multiSelect",
      getOptions: getLanguageOptions,
      fullWidth: true,
      hint: "Languages offered in the product UI",
    },
    // currency owned by Currency page — keep backend key, hide here
    { key: "currency", label: "Currency", control: "hidden" },
    { key: "dateFormat", label: "Date format", control: "select", options: DATE_FORMAT_OPTIONS },
    { key: "timeFormat", label: "Time format", control: "select", options: TIME_FORMAT_OPTIONS },
    { key: "numberFormat", label: "Number format", control: "select", options: NUMBER_FORMAT_OPTIONS },
    { key: "decimalSeparator", label: "Decimal separator", control: "select", options: DECIMAL_SEP_OPTIONS },
    { key: "thousandsSeparator", label: "Thousands separator", control: "select", options: THOUSANDS_SEP_OPTIONS },
    { key: "firstDayOfWeek", label: "First day of week", control: "select", options: FIRST_DAY_OPTIONS },
    { key: "calendar", label: "Display calendar", control: "select", options: CALENDAR_OPTIONS },
    { key: "addressFormat", label: "Address format", control: "select", options: ADDRESS_FORMAT_OPTIONS },
    { key: "phoneFormat", label: "Phone format", control: "select", options: PHONE_FORMAT_OPTIONS },
    { key: "postalFormat", label: "Postal format", control: "select", options: POSTAL_FORMAT_OPTIONS },
  ],
  regional: [
    {
      key: "country",
      label: "Primary operating country",
      control: "searchable",
      getOptions: getCountryOptions,
      hint: "Use Align panel above to sync currency, timezone and locale",
    },
    {
      key: "preferredRegions",
      label: "Preferred regions",
      control: "stringList",
      fullWidth: true,
      hint: "ISO country codes or region names, one per line",
      placeholder: "BI\nRW\nKE",
    },
    { key: "addressFormatCountryRules", label: "Address rules", control: "hidden" },
  ],
  currency: [
    {
      key: "primary",
      label: "Primary currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    {
      key: "display",
      label: "Display currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    {
      key: "transaction",
      label: "Transaction currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    {
      key: "functional",
      label: "Functional currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    {
      key: "reporting",
      label: "Reporting currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    {
      key: "secondaries",
      label: "Secondary currencies",
      control: "stringList",
      fullWidth: true,
      hint: "One ISO code per line (USD, BIF, …)",
      placeholder: "USD\nBIF",
    },
    { key: "decimals", label: "Default decimals", control: "number", min: 0, max: 6 },
    { key: "roundingMode", label: "Rounding mode", control: "select", options: ROUNDING_OPTIONS },
    { key: "fxSource", label: "FX rate source", control: "select", options: FX_SOURCE_OPTIONS },
    { key: "fxUpdateFrequency", label: "FX update frequency", control: "select", options: FX_FREQUENCY_OPTIONS },
  ],
  fiscal: [
    { key: "calendar", label: "Fiscal calendar", control: "select", options: CALENDAR_OPTIONS },
    { key: "yearStartMonth", label: "Fiscal year start month", control: "select", options: MONTH_OPTIONS },
    { key: "yearStartDay", label: "Fiscal year start day", control: "select", options: DAY_OPTIONS },
    { key: "roundingFiscal", label: "Fiscal rounding", control: "select", options: ROUNDING_OPTIONS },
    { key: "reopenAllowed", label: "Allow reopening closed periods", control: "boolean" },
    { key: "withholdingEnabled", label: "Withholding tax enabled", control: "boolean" },
    { key: "closeRules", label: "Close rules", control: "hidden" },
  ],
  tax: [
    { key: "pricesIncludeTax", label: "Prices include tax", control: "boolean" },
    { key: "compoundTax", label: "Compound tax", control: "boolean" },
    { key: "defaultJurisdiction", label: "Default jurisdiction", control: "text", placeholder: "BI" },
    { key: "defaultCategory", label: "Default tax category", control: "text", placeholder: "standard" },
    { key: "reportingEnabled", label: "Tax reporting enabled", control: "boolean" },
  ],
  numbering: [
    { key: "manualAllowedDefault", label: "Allow manual numbers by default", control: "boolean" },
    { key: "uniquenessScope", label: "Uniqueness scope", control: "select", options: UNIQUENESS_SCOPE_OPTIONS },
  ],
  documents: [
    {
      key: "defaultLanguage",
      label: "Default document language",
      control: "searchable",
      getOptions: getLanguageOptions,
    },
    { key: "pdfFormat", label: "PDF paper size", control: "select", options: PAPER_FORMAT_OPTIONS },
    { key: "printFormat", label: "Print format", control: "select", options: PRINT_FORMAT_OPTIONS },
    { key: "watermarkEnabled", label: "Watermark enabled", control: "boolean" },
    { key: "defaultFooter", label: "Default footer", control: "textarea", fullWidth: true },
    { key: "defaultLegalMentions", label: "Default legal mentions", control: "textarea", fullWidth: true },
    { key: "defaultTerms", label: "Default terms", control: "textarea", fullWidth: true },
  ],
  branding: [
    { key: "displayName", label: "Brand display name", control: "text" },
    { key: "slogan", label: "Slogan", control: "text" },
    { key: "primaryColor", label: "Primary color", control: "color" },
    { key: "secondaryColor", label: "Secondary color", control: "color" },
    { key: "portalEnabled", label: "Customer portal branding", control: "boolean" },
    {
      key: "publicAppUrl",
      label: "Public app URL",
      control: "url",
      placeholder: "https://acme.example.com",
      hint: "Invitation and email links. Leave empty to use the tenant primary domain or subdomain.",
      fullWidth: true,
    },
    { key: "customDomain", label: "Custom domain", control: "text", placeholder: "app.example.com" },
    { key: "subdomain", label: "Subdomain", control: "text", placeholder: "acme" },
    { key: "themeLight", label: "Light theme", control: "hidden" },
    { key: "themeDark", label: "Dark theme", control: "hidden" },
    { key: "loginBranding", label: "Login branding", control: "hidden" },
    { key: "emailBranding", label: "Email branding", control: "hidden" },
    { key: "documentBranding", label: "Document branding", control: "hidden" },
    { key: "pdfBranding", label: "PDF branding", control: "hidden" },
  ],
  notifications: [
    { key: "emailEnabled", label: "Email notifications", control: "boolean" },
    {
      key: "mailFrom",
      label: "From address",
      control: "text",
      placeholder: "Acme <invites@acme.example.com>",
      hint: "Used for invitations and transactional email. Leave empty to use the platform default.",
      fullWidth: true,
    },
    { key: "smsEnabled", label: "SMS notifications", control: "boolean" },
    { key: "inAppEnabled", label: "In-app notifications", control: "boolean" },
    { key: "pushEnabled", label: "Push notifications", control: "boolean" },
    { key: "digestFrequency", label: "Digest frequency", control: "select", options: DIGEST_FREQUENCY_OPTIONS },
    { key: "channels", label: "Channels", control: "hidden" },
  ],
  integrations: [
    {
      key: "defaultSyncFrequency",
      label: "Default sync frequency",
      control: "select",
      options: FX_FREQUENCY_OPTIONS,
    },
    { key: "retryPolicy", label: "Retry policy", control: "hidden" },
  ],
  security: [
    { key: "mfaPolicy", label: "MFA policy", control: "select", options: MFA_POLICY_OPTIONS },
    {
      key: "mfaMethods",
      label: "Allowed MFA methods",
      control: "multiSelect",
      options: MFA_METHOD_OPTIONS,
      fullWidth: true,
    },
    { key: "sessionLifetimeMinutes", label: "Session lifetime (minutes)", control: "number", min: 5, max: 10080 },
    { key: "idleTimeoutMinutes", label: "Idle timeout (minutes)", control: "number", min: 1, max: 1440 },
    {
      key: "maxSessionDurationMinutes",
      label: "Max session duration (minutes)",
      control: "number",
      min: 5,
      max: 10080,
    },
    { key: "rememberMe", label: "Allow remember me", control: "boolean" },
    { key: "sessionConcurrency", label: "Max concurrent sessions", control: "number", min: 1, max: 100 },
    { key: "failedLoginThreshold", label: "Failed login threshold", control: "number", min: 1, max: 50 },
    { key: "accountLockoutMinutes", label: "Lockout duration (minutes)", control: "number", min: 1, max: 1440 },
    { key: "passwordMinLength", label: "Password min length", control: "number", min: 8, max: 128 },
    { key: "passwordRequireUpper", label: "Require uppercase", control: "boolean" },
    { key: "passwordRequireNumber", label: "Require number", control: "boolean" },
    { key: "passwordRequireSymbol", label: "Require symbol", control: "boolean" },
    {
      key: "ipAllowlist",
      label: "IP allowlist",
      control: "stringList",
      fullWidth: true,
      hint: "One IP or CIDR per line",
    },
    {
      key: "ipDenylist",
      label: "IP denylist",
      control: "stringList",
      fullWidth: true,
      hint: "One IP or CIDR per line",
    },
    {
      key: "countryRestrictions",
      label: "Country restrictions",
      control: "stringList",
      fullWidth: true,
      hint: "ISO country codes, one per line",
      placeholder: "BI\nRW",
    },
    { key: "organizationRestrictions", label: "Organization restrictions", control: "hidden" },
    { key: "devicePolicies", label: "Device policies", control: "hidden" },
    { key: "browserPolicies", label: "Browser policies", control: "hidden" },
    { key: "suspiciousLoginDetection", label: "Suspicious login detection", control: "boolean" },
    {
      key: "ssoProviders",
      label: "SSO providers",
      control: "multiSelect",
      options: SSO_PROVIDER_OPTIONS,
      fullWidth: true,
    },
  ],
  privacy: [
    { key: "dataRetentionDays", label: "Data retention (days)", control: "number", min: 30, max: 3650 },
    { key: "logRetentionDays", label: "Log retention (days)", control: "number", min: 7, max: 1825 },
    { key: "auditRetentionDays", label: "Audit retention (days)", control: "number", min: 30, max: 3650 },
    { key: "exportEnabled", label: "Allow data export", control: "boolean" },
    { key: "deletionEnabled", label: "Allow data deletion", control: "boolean" },
    { key: "anonymizationEnabled", label: "Allow anonymization", control: "boolean" },
    { key: "privacyPolicyUrl", label: "Privacy policy URL", control: "url" },
    { key: "consentRequired", label: "Consent required", control: "boolean" },
    { key: "legalHold", label: "Legal hold active", control: "boolean" },
    { key: "dataProcessingPolicies", label: "Processing policies", control: "hidden" },
  ],
  compliance: [
    {
      key: "frameworks",
      label: "Compliance frameworks",
      control: "stringList",
      fullWidth: true,
      hint: "One per line (GDPR, HIPAA, …)",
      placeholder: "GDPR\nISO27001",
    },
    {
      key: "policyDocumentRefs",
      label: "Policy document refs",
      control: "stringList",
      fullWidth: true,
      hint: "Document IDs or URLs, one per line",
    },
    { key: "hipaaMode", label: "HIPAA mode", control: "boolean" },
  ],
  data: [
    { key: "autoBackupEnabled", label: "Automatic backups", control: "boolean" },
    { key: "backupFrequency", label: "Backup frequency", control: "select", options: BACKUP_FREQUENCY_OPTIONS },
    {
      key: "purgeAfterDays",
      label: "Purge after (days)",
      control: "number",
      min: 0,
      max: 3650,
      hint: "0 = never purge",
    },
    { key: "migrationStatus", label: "Migration status", control: "select", options: MIGRATION_STATUS_OPTIONS },
  ],
  storage: [
    { key: "softQuotaGb", label: "Soft quota (GB)", control: "number", min: 0 },
    { key: "warnAtPercent", label: "Warn at % used", control: "number", min: 1, max: 100 },
  ],
  automation: [
    { key: "enabled", label: "Automation enabled", control: "boolean" },
    { key: "defaults", label: "Defaults", control: "hidden" },
  ],
  workflow: [
    { key: "enabled", label: "Workflows enabled", control: "boolean" },
    { key: "defaults", label: "Defaults", control: "hidden" },
  ],
  audit: [
    { key: "retentionDays", label: "Retention (days)", control: "number", min: 30, max: 3650 },
    { key: "exportEnabled", label: "Allow audit export", control: "boolean" },
  ],
  api: [
    { key: "defaultRateLimit", label: "Default rate limit / hour", control: "number", min: 10, max: 1_000_000 },
    {
      key: "allowedOrigins",
      label: "Allowed CORS origins",
      control: "stringList",
      fullWidth: true,
      hint: "One origin per line",
      placeholder: "https://app.example.com",
    },
    { key: "defaultApiVersion", label: "Default API version", control: "text", placeholder: "v1" },
  ],
  webhooks: [
    { key: "signingEnabled", label: "Sign webhook payloads", control: "boolean" },
    { key: "retryPolicy", label: "Retry policy", control: "hidden" },
  ],
  billing: [
    { key: "billingContactName", label: "Billing contact name", control: "text" },
    { key: "billingContactEmail", label: "Billing contact email", control: "email" },
    { key: "renewalDay", label: "Renewal day of month", control: "select", options: DAY_OPTIONS.slice(0, 28) },
    {
      key: "currency",
      label: "Billing currency",
      control: "searchable",
      getOptions: getCurrencyOptions,
    },
    { key: "paymentMethods", label: "Payment methods", control: "hidden" },
  ],
  advanced: [
    { key: "experimentalFeatures", label: "Experimental features", control: "boolean" },
    { key: "debugMode", label: "Debug mode", control: "boolean" },
    {
      key: "customJson",
      label: "Custom configuration (JSON)",
      control: "json",
      fullWidth: true,
      hint: "Advanced overrides only — invalid JSON will be rejected",
    },
  ],
  features: [
    { key: "invitations", label: "Invitations", control: "boolean" },
    { key: "keycloakSync", label: "Keycloak sync", control: "boolean" },
    {
      key: "enable_ctp",
      label: "CTP (managed in Commercial)",
      control: "hidden",
      hint: "Edit under Settings → Commercial (org)",
    },
    { key: "enable_loyalty", label: "Loyalty", control: "hidden" },
    { key: "enable_mobile_pos", label: "Mobile POS", control: "hidden" },
    { key: "enable_consignment", label: "Consignment", control: "hidden" },
    { key: "enable_ai_replenishment", label: "AI replenishment", control: "hidden" },
    { key: "commerce.loyalty", label: "Commerce loyalty alias", control: "hidden" },
    { key: "commerce.pos", label: "Commerce POS alias", control: "hidden" },
  ],
  commerce: [
    { key: "pricesIncludeTax", label: "Prices include tax", control: "boolean" },
    { key: "defaultPaymentMethods", label: "Default payment methods", control: "stringList" },
    {
      key: "allowNegativeStock",
      label: "Allow negative stock (deprecated)",
      control: "hidden",
      hint: "Use Inventory policies",
    },
  ],
  inventory: [
    {
      key: "valuationMethod",
      label: "Valuation / FEFO (deprecated)",
      control: "hidden",
      hint: "Use Commercial allocation strategy / Inventory policies FEFO",
    },
    { key: "defaultWarehouseId", label: "Default warehouse", control: "text" },
    {
      key: "allowNegativeStock",
      label: "Allow negative stock (deprecated)",
      control: "hidden",
      hint: "Use Inventory policies",
    },
    { key: "lotTrackingRequired", label: "Lot tracking required", control: "boolean" },
    { key: "expiryTrackingRequired", label: "Expiry tracking required", control: "boolean" },
  ],
};

function inferFallback(key: string, value: unknown): FieldMeta {
  if (typeof value === "boolean") {
    return { key, label: humanize(key), control: "boolean" };
  }
  if (typeof value === "number") {
    return { key, label: humanize(key), control: "number" };
  }
  if (Array.isArray(value)) {
    return {
      key,
      label: humanize(key),
      control: "stringList",
      fullWidth: true,
      hint: "One value per line",
    };
  }
  if (value !== null && typeof value === "object") {
    return { key, label: humanize(key), control: "hidden" };
  }
  return { key, label: humanize(key), control: "text" };
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[._]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function resolveFieldMeta(
  namespace: string,
  key: string,
  currentValue: unknown,
): FieldMeta {
  const catalog = NS[namespace] ?? [];
  const found = catalog.find((f) => f.key === key);
  if (found) return found;
  // modules / features boolean overlays
  if (namespace === "modules" || namespace === "features") {
    return { key, label: humanize(key), control: "boolean" };
  }
  return inferFallback(key, currentValue);
}

export function orderedNamespaceKeys(
  namespace: string,
  values: Record<string, unknown>,
): string[] {
  const catalog = NS[namespace] ?? [];
  const catalogKeys = catalog.map((f) => f.key);
  const valueKeys = Object.keys(values);
  const ordered: string[] = [];
  for (const k of catalogKeys) {
    if (k in values || catalog.find((f) => f.key === k)?.control !== "hidden") {
      if (k in values) ordered.push(k);
    }
  }
  for (const k of valueKeys.sort()) {
    if (!ordered.includes(k)) ordered.push(k);
  }
  return ordered.filter((k) => resolveFieldMeta(namespace, k, values[k]).control !== "hidden");
}

export function displayToDraft(meta: FieldMeta, value: unknown): string {
  if (value == null) return "";
  switch (meta.control) {
    case "boolean":
      return value === true ? "true" : "false";
    case "stringList":
    case "multiSelect":
      return Array.isArray(value) ? value.map(String).join("\n") : String(value);
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    case "number":
    case "select":
    case "color":
    case "text":
    case "email":
    case "url":
    case "tel":
    case "textarea":
      return String(value);
    default:
      return String(value ?? "");
  }
}

export function draftToValue(meta: FieldMeta, raw: string, current: unknown): unknown {
  switch (meta.control) {
    case "boolean":
      return raw === "true";
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : current;
    }
    case "stringList":
    case "multiSelect":
      return raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    case "json":
      try {
        return JSON.parse(raw || "{}") as unknown;
      } catch {
        return current;
      }
    case "select":
      if (typeof current === "number") {
        const n = Number(raw);
        return Number.isFinite(n) ? n : current;
      }
      return raw;
    default:
      return raw;
  }
}
