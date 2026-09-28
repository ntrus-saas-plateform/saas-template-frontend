export type NamespaceStageDef = {
  id: string;
  label: string;
  description?: string;
  keys: string[];
};

/** Named field groups so namespace pages become a stepper instead of one long form. */
export const NAMESPACE_STAGES: Record<string, NamespaceStageDef[]> = {
  localization: [
    {
      id: "locale",
      label: "Locale",
      description: "Timezone and languages for this tenant.",
      keys: ["timezone", "locale", "defaultLanguage", "languages"],
    },
    {
      id: "formats",
      label: "Formats",
      description: "How dates, times, and numbers are written.",
      keys: [
        "dateFormat",
        "timeFormat",
        "numberFormat",
        "decimalSeparator",
        "thousandsSeparator",
      ],
    },
    {
      id: "conventions",
      label: "Conventions",
      description: "Calendar, week start, and address or phone layout.",
      keys: [
        "firstDayOfWeek",
        "calendar",
        "addressFormat",
        "phoneFormat",
        "postalFormat",
      ],
    },
  ],
  currency: [
    {
      id: "codes",
      label: "Currencies",
      description: "Primary and related ISO codes.",
      keys: [
        "primary",
        "display",
        "transaction",
        "functional",
        "reporting",
        "secondaries",
      ],
    },
    {
      id: "fx",
      label: "FX & rounding",
      description: "Decimals, rounding, and rate updates.",
      keys: ["decimals", "roundingMode", "fxSource", "fxUpdateFrequency"],
    },
  ],
  fiscal: [
    {
      id: "calendar",
      label: "Calendar",
      description: "Fiscal year start and calendar type.",
      keys: ["calendar", "yearStartMonth", "yearStartDay"],
    },
    {
      id: "rules",
      label: "Rules",
      description: "Rounding, reopen, and withholding.",
      keys: ["roundingFiscal", "reopenAllowed", "withholdingEnabled"],
    },
  ],
  tax: [
    {
      id: "defaults",
      label: "Defaults",
      description: "How prices and tax categories behave.",
      keys: ["pricesIncludeTax", "compoundTax", "defaultJurisdiction", "defaultCategory"],
    },
    {
      id: "reporting",
      label: "Reporting",
      description: "Tax reporting switches.",
      keys: ["reportingEnabled"],
    },
  ],
  documents: [
    {
      id: "output",
      label: "Output",
      description: "Language, paper, and print defaults.",
      keys: ["defaultLanguage", "pdfFormat", "printFormat", "watermarkEnabled"],
    },
    {
      id: "boilerplate",
      label: "Boilerplate",
      description: "Footer, legal mentions, and terms on documents.",
      keys: ["defaultFooter", "defaultLegalMentions", "defaultTerms"],
    },
  ],
  branding: [
    {
      id: "identity",
      label: "Identity",
      description: "Name, slogan, and colors.",
      keys: ["displayName", "slogan", "primaryColor", "secondaryColor"],
    },
    {
      id: "portal",
      label: "Portal & domain",
      description: "Customer portal and custom hostnames.",
      keys: ["portalEnabled", "customDomain", "subdomain"],
    },
  ],
  notifications: [
    {
      id: "channels",
      label: "Channels",
      description: "Which channels the tenant may use.",
      keys: ["emailEnabled", "smsEnabled", "inAppEnabled", "pushEnabled"],
    },
    {
      id: "digest",
      label: "Digest",
      description: "How often to batch notifications.",
      keys: ["digestFrequency"],
    },
  ],
  privacy: [
    {
      id: "retention",
      label: "Retention",
      description: "How long data, logs, and audit stay.",
      keys: ["dataRetentionDays", "logRetentionDays", "auditRetentionDays"],
    },
    {
      id: "rights",
      label: "Rights",
      description: "Export, deletion, anonymization, and consent.",
      keys: [
        "exportEnabled",
        "deletionEnabled",
        "anonymizationEnabled",
        "privacyPolicyUrl",
        "consentRequired",
        "legalHold",
      ],
    },
  ],
  security: [
    {
      id: "mfa",
      label: "MFA",
      description: "Policy and allowed methods.",
      keys: ["mfaPolicy", "mfaMethods"],
    },
    {
      id: "session",
      label: "Sessions",
      description: "Lifetime, idle timeout, and concurrency.",
      keys: [
        "sessionLifetimeMinutes",
        "idleTimeoutMinutes",
        "maxSessionDurationMinutes",
        "rememberMe",
        "sessionConcurrency",
      ],
    },
    {
      id: "password",
      label: "Password",
      description: "Length and complexity rules.",
      keys: [
        "passwordMinLength",
        "passwordRequireUpper",
        "passwordRequireNumber",
        "passwordRequireSymbol",
        "failedLoginThreshold",
        "accountLockoutMinutes",
      ],
    },
    {
      id: "network",
      label: "Network",
      description: "IP and country restrictions.",
      keys: [
        "ipAllowlist",
        "ipDenylist",
        "countryRestrictions",
        "suspiciousLoginDetection",
        "ssoProviders",
      ],
    },
  ],
  data: [
    {
      id: "backup",
      label: "Backup",
      description: "Automatic backups and frequency.",
      keys: ["autoBackupEnabled", "backupFrequency"],
    },
    {
      id: "lifecycle",
      label: "Lifecycle",
      description: "Purge and migration status.",
      keys: ["purgeAfterDays", "migrationStatus"],
    },
  ],
  api: [
    {
      id: "limits",
      label: "Limits",
      description: "Rate limit and default version.",
      keys: ["defaultRateLimit", "defaultApiVersion"],
    },
    {
      id: "cors",
      label: "CORS",
      description: "Origins allowed to call the API.",
      keys: ["allowedOrigins"],
    },
  ],
  billing: [
    {
      id: "contact",
      label: "Contact",
      description: "Who receives billing communication.",
      keys: ["billingContactName", "billingContactEmail"],
    },
    {
      id: "terms",
      label: "Terms",
      description: "Renewal day and billing currency.",
      keys: ["renewalDay", "currency"],
    },
  ],
  advanced: [
    {
      id: "flags",
      label: "Flags",
      description: "Experimental and debug switches.",
      keys: ["experimentalFeatures", "debugMode"],
    },
    {
      id: "overrides",
      label: "Overrides",
      description: "Raw JSON configuration.",
      keys: ["customJson"],
    },
  ],
  company: [
    {
      id: "legal",
      label: "Legal links",
      description: "Mentions and policy URLs.",
      keys: ["legalMentions", "termsUrl", "privacyPolicyUrl"],
    },
  ],
};

export function stageNamespaceKeys(
  namespace: string,
  keys: string[],
): NamespaceStageDef[] {
  if (keys.length === 0) return [];
  const defined = NAMESPACE_STAGES[namespace];
  if (!defined) {
    if (keys.length <= 5) {
      return [{ id: "settings", label: "Settings", keys }];
    }
    const chunks: NamespaceStageDef[] = [];
    for (let i = 0; i < keys.length; i += 4) {
      const slice = keys.slice(i, i + 4);
      chunks.push({
        id: `group-${Math.floor(i / 4) + 1}`,
        label: `Group ${Math.floor(i / 4) + 1}`,
        keys: slice,
      });
    }
    return chunks;
  }

  const used = new Set<string>();
  const stages: NamespaceStageDef[] = [];
  for (const stage of defined) {
    const matched = stage.keys.filter((k) => keys.includes(k));
    matched.forEach((k) => used.add(k));
    if (matched.length > 0) {
      stages.push({ ...stage, keys: matched });
    }
  }
  const rest = keys.filter((k) => !used.has(k));
  if (rest.length > 0) {
    stages.push({ id: "more", label: "More", keys: rest });
  }
  return stages.length > 0
    ? stages
    : [{ id: "settings", label: "Settings", keys }];
}
