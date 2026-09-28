/**
 * Atlas ERP — Bibliothèque de thèmes (36 thèmes complets, 18 familles × clair/sombre).
 * Tokens extraits de `erp-design-system.html` (référence de design).
 */

export type AtlasThemeId =
  | "corp-light"
  | "corp-dark"
  | "fin-light"
  | "fin-dark"
  | "health-light"
  | "health-dark"
  | "ind-light"
  | "ind-dark"
  | "retail-light"
  | "retail-dark"
  | "log-light"
  | "log-dark"
  | "agri-light"
  | "agri-dark"
  | "con-light"
  | "con-dark"
  | "tech-light"
  | "tech-dark"
  | "legal-light"
  | "legal-dark"
  | "edu-light"
  | "edu-dark"
  | "energy-light"
  | "energy-dark"
  | "gov-light"
  | "gov-dark"
  | "hosp-light"
  | "hosp-dark"
  | "pharma-light"
  | "pharma-dark"
  | "lux-light"
  | "lux-dark"
  | "a11y-light"
  | "a11y-dark"
  | "mono-light"
  | "mono-dark";

export type AtlasMode = "light" | "dark";

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  bgApp: string;
  bgSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  onPrimary: string;
}

export interface AtlasTheme {
  id: AtlasThemeId;
  name: string;
  family: string;
  modeLabel: "Clair" | "Sombre";
  mode: AtlasMode;
  colors: ThemePalette;
}

function t(
  id: AtlasThemeId,
  name: string,
  family: string,
  mode: "light" | "dark",
  colors: ThemePalette,
): AtlasTheme {
  return { id, name, family, mode, modeLabel: mode === "dark" ? "Sombre" : "Clair", colors };
}

export const THEMES: AtlasTheme[] = [
  // ---- Corporate & Professionnel ----
  t("corp-light", "Corporate Slate", "Corporate & Professionnel", "light", {
    primary: "#2563EB", secondary: "#475569", accent: "#0EA5E9",
    success: "#16A34A", warning: "#D97706", danger: "#DC2626", info: "#0284C7",
    bgApp: "#F8FAFC", bgSurface: "#FFFFFF", textPrimary: "#0F172A",
    textSecondary: "#475569", textMuted: "#94A3B8", border: "#E2E8F0",
    borderStrong: "#CBD5E1", onPrimary: "#FFFFFF",
  }),
  t("corp-dark", "Corporate Slate", "Corporate & Professionnel", "dark", {
    primary: "#3B82F6", secondary: "#94A3B8", accent: "#38BDF8",
    success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", info: "#38BDF8",
    bgApp: "#0B1220", bgSurface: "#111827", textPrimary: "#F1F5F9",
    textSecondary: "#CBD5E1", textMuted: "#64748B", border: "#1E293B",
    borderStrong: "#334155", onPrimary: "#FFFFFF",
  }),

  // ---- Finance & Banque ----
  t("fin-light", "Finance Navy", "Finance & Banque", "light", {
    primary: "#1E3A5F", secondary: "#B08D57", accent: "#0F6E5C",
    success: "#157A4A", warning: "#C77D14", danger: "#B3261E", info: "#2C6F9B",
    bgApp: "#F4F6F8", bgSurface: "#FFFFFF", textPrimary: "#0B1F33",
    textSecondary: "#45607A", textMuted: "#8DA0B3", border: "#DDE3E9",
    borderStrong: "#C3CDD6", onPrimary: "#FFFFFF",
  }),
  t("fin-dark", "Finance Navy", "Finance & Banque", "dark", {
    primary: "#4A7FB5", secondary: "#D4B778", accent: "#2FA98C",
    success: "#3FB273", warning: "#E0A93D", danger: "#E5615A", info: "#5A9BC9",
    bgApp: "#0A1420", bgSurface: "#101E30", textPrimary: "#E8EEF3",
    textSecondary: "#A9BCCB", textMuted: "#5E7387", border: "#1D2E42",
    borderStrong: "#2C4157", onPrimary: "#FFFFFF",
  }),

  // ---- Santé ----
  t("health-light", "Healthcare Teal", "Santé", "light", {
    primary: "#0D9488", secondary: "#64748B", accent: "#14B8A6",
    success: "#22A45D", warning: "#D97706", danger: "#DC2626", info: "#0891B2",
    bgApp: "#F5FBFA", bgSurface: "#FFFFFF", textPrimary: "#0F2A27",
    textSecondary: "#4B6663", textMuted: "#8FA6A3", border: "#DCEEEC",
    borderStrong: "#BEDDD9", onPrimary: "#FFFFFF",
  }),
  t("health-dark", "Healthcare Teal", "Santé", "dark", {
    primary: "#2DD4BF", secondary: "#94A3B8", accent: "#5EEAD4",
    success: "#34D399", warning: "#F5A83D", danger: "#F0645D", info: "#22D3EE",
    bgApp: "#08151A", bgSurface: "#0E2024", textPrimary: "#E6F4F2",
    textSecondary: "#A7C5C1", textMuted: "#5C7A76", border: "#1B3532",
    borderStrong: "#275048", onPrimary: "#04211D",
  }),

  // ---- Industrie & Manufacturing ----
  t("ind-light", "Manufacturing Steel", "Industrie & Manufacturing", "light", {
    primary: "#475569", secondary: "#F59E0B", accent: "#DC2626",
    success: "#16A34A", warning: "#F59E0B", danger: "#DC2626", info: "#2563EB",
    bgApp: "#F7F8FA", bgSurface: "#FFFFFF", textPrimary: "#1E2530",
    textSecondary: "#52606D", textMuted: "#94A0AC", border: "#E1E5EA",
    borderStrong: "#C9D0D8", onPrimary: "#FFFFFF",
  }),
  t("ind-dark", "Manufacturing Steel", "Industrie & Manufacturing", "dark", {
    primary: "#94A3B8", secondary: "#FBBF24", accent: "#F87171",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F87171", info: "#60A5FA",
    bgApp: "#0E1013", bgSurface: "#16191D", textPrimary: "#EAEDEF",
    textSecondary: "#B0B8C1", textMuted: "#626B75", border: "#262B31",
    borderStrong: "#383F47", onPrimary: "#12161B",
  }),

  // ---- Commerce & Retail ----
  t("retail-light", "Retail Coral", "Commerce & Retail", "light", {
    primary: "#E85D45", secondary: "#2D3142", accent: "#F2A65A",
    success: "#2E9E5B", warning: "#E0A63D", danger: "#D64545", info: "#3D7EC0",
    bgApp: "#FFFAF7", bgSurface: "#FFFFFF", textPrimary: "#2A211E",
    textSecondary: "#6B5B54", textMuted: "#A6968D", border: "#F1E1DA",
    borderStrong: "#E3C7BA", onPrimary: "#FFFFFF",
  }),
  t("retail-dark", "Retail Coral", "Commerce & Retail", "dark", {
    primary: "#F0836B", secondary: "#B8BEC9", accent: "#F5BC7C",
    success: "#4FBE7C", warning: "#EFC069", danger: "#E8746B", info: "#6AA3DA",
    bgApp: "#170F0D", bgSurface: "#201613", textPrimary: "#F6EBE7",
    textSecondary: "#CBB6AE", textMuted: "#7D6A63", border: "#33231D",
    borderStrong: "#4A322A", onPrimary: "#2A130C",
  }),

  // ---- Logistique & Transport ----
  t("log-light", "Logistics Amber", "Logistique & Transport", "light", {
    primary: "#B45309", secondary: "#1F2937", accent: "#2563EB",
    success: "#15803D", warning: "#D97706", danger: "#B91C1C", info: "#1D4ED8",
    bgApp: "#FFFBF5", bgSurface: "#FFFFFF", textPrimary: "#24211B",
    textSecondary: "#6B5E4C", textMuted: "#A79A83", border: "#F0E4CF",
    borderStrong: "#E1CDA6", onPrimary: "#FFFFFF",
  }),
  t("log-dark", "Logistics Amber", "Logistique & Transport", "dark", {
    primary: "#F0A73B", secondary: "#94A3B8", accent: "#5B8DEF",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F0645D", info: "#7AA6F0",
    bgApp: "#150F08", bgSurface: "#1E1610", textPrimary: "#F5ECDD",
    textSecondary: "#C9B591", textMuted: "#7A6C54", border: "#30251A",
    borderStrong: "#473526", onPrimary: "#241705",
  }),

  // ---- Agriculture & Agroalimentaire ----
  t("agri-light", "Agriculture Sage", "Agriculture & Agroalimentaire", "light", {
    primary: "#4D7C4E", secondary: "#8B7355", accent: "#A3B18A",
    success: "#3F8B4C", warning: "#C68A2E", danger: "#B3452F", info: "#4A7A8C",
    bgApp: "#F7F9F4", bgSurface: "#FFFFFF", textPrimary: "#232A1F",
    textSecondary: "#5A6650", textMuted: "#97A28A", border: "#E3E9D9",
    borderStrong: "#CBD7B8", onPrimary: "#FFFFFF",
  }),
  t("agri-dark", "Agriculture Sage", "Agriculture & Agroalimentaire", "dark", {
    primary: "#8FBB7F", secondary: "#C2A87C", accent: "#B7C79E",
    success: "#6FCB7C", warning: "#E0AA55", danger: "#E07B62", info: "#6FA6BB",
    bgApp: "#0F130D", bgSurface: "#171C13", textPrimary: "#E9EFE3",
    textSecondary: "#B6C2A9", textMuted: "#66735A", border: "#262E1E",
    borderStrong: "#38442A", onPrimary: "#10190D",
  }),

  // ---- BTP & Construction ----
  t("con-light", "Construction Ochre", "BTP & Construction", "light", {
    primary: "#C2760C", secondary: "#2B2B2B", accent: "#EAB308",
    success: "#2F7A3D", warning: "#C2760C", danger: "#B23A2E", info: "#2A5F8A",
    bgApp: "#FCF9F3", bgSurface: "#FFFFFF", textPrimary: "#241E12",
    textSecondary: "#6B5E45", textMuted: "#A69878", border: "#EDE0C4",
    borderStrong: "#DEC994", onPrimary: "#FFFFFF",
  }),
  t("con-dark", "Construction Ochre", "BTP & Construction", "dark", {
    primary: "#E8A23D", secondary: "#A8A8A8", accent: "#F2D14E",
    success: "#5CAE68", warning: "#E8A23D", danger: "#E37862", info: "#5C93C0",
    bgApp: "#141008", bgSurface: "#1E1810", textPrimary: "#F4EBDA",
    textSecondary: "#C9B892", textMuted: "#7A6E53", border: "#2E2517",
    borderStrong: "#453623", onPrimary: "#211505",
  }),

  // ---- Tech & SaaS ----
  t("tech-light", "Tech SaaS Indigo", "Tech & SaaS", "light", {
    primary: "#4F46E5", secondary: "#64748B", accent: "#EC4899",
    success: "#10B981", warning: "#F59E0B", danger: "#EF4444", info: "#3B82F6",
    bgApp: "#F8F8FC", bgSurface: "#FFFFFF", textPrimary: "#1B1B2E",
    textSecondary: "#52526B", textMuted: "#9393AC", border: "#E4E4F1",
    borderStrong: "#CDCDE6", onPrimary: "#FFFFFF",
  }),
  t("tech-dark", "Tech SaaS Indigo", "Tech & SaaS", "dark", {
    primary: "#818CF8", secondary: "#A1A1B5", accent: "#F472B6",
    success: "#34D399", warning: "#FBBF24", danger: "#F87171", info: "#60A5FA",
    bgApp: "#0C0C14", bgSurface: "#14141F", textPrimary: "#ECECF6",
    textSecondary: "#B7B7CB", textMuted: "#63637A", border: "#22222F",
    borderStrong: "#333349", onPrimary: "#14122E",
  }),

  // ---- Juridique & Conseil ----
  t("legal-light", "Legal Burgundy", "Juridique & Conseil", "light", {
    primary: "#7B2D3B", secondary: "#2E2A26", accent: "#A9825C",
    success: "#2F6B3F", warning: "#B5792C", danger: "#9B2A2A", info: "#385A78",
    bgApp: "#FAF7F5", bgSurface: "#FFFFFF", textPrimary: "#241A1B",
    textSecondary: "#665052", textMuted: "#A38C8D", border: "#ECDFE0",
    borderStrong: "#DABEC0", onPrimary: "#FFFFFF",
  }),
  t("legal-dark", "Legal Burgundy", "Juridique & Conseil", "dark", {
    primary: "#B25A6B", secondary: "#A69B8F", accent: "#C79E71",
    success: "#5A9C6C", warning: "#D69A55", danger: "#C6635F", info: "#5F87A5",
    bgApp: "#140D0E", bgSurface: "#1E1416", textPrimary: "#F2E4E5",
    textSecondary: "#C6A9AC", textMuted: "#755B5D", border: "#2C1B1D",
    borderStrong: "#44282B", onPrimary: "#FFFFFF",
  }),

  // ---- Éducation ----
  t("edu-light", "Education Sky", "Éducation", "light", {
    primary: "#0284C7", secondary: "#475569", accent: "#F59E0B",
    success: "#16A34A", warning: "#F59E0B", danger: "#DC2626", info: "#0284C7",
    bgApp: "#F5FAFE", bgSurface: "#FFFFFF", textPrimary: "#0C2333",
    textSecondary: "#48657A", textMuted: "#8CA5B7", border: "#DCEBF5",
    borderStrong: "#BEDCED", onPrimary: "#FFFFFF",
  }),
  t("edu-dark", "Education Sky", "Éducation", "dark", {
    primary: "#38BDF8", secondary: "#94A3B8", accent: "#FBBF24",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F87171", info: "#38BDF8",
    bgApp: "#071319", bgSurface: "#0D1F29", textPrimary: "#E4F2FA",
    textSecondary: "#A9C8D8", textMuted: "#587786", border: "#182F3A",
    borderStrong: "#234657", onPrimary: "#052330",
  }),

  // ---- Énergie & Utilities ----
  t("energy-light", "Energy Emerald", "Énergie & Utilities", "light", {
    primary: "#047857", secondary: "#1E293B", accent: "#84CC16",
    success: "#059669", warning: "#D97706", danger: "#DC2626", info: "#0369A1",
    bgApp: "#F5FBF7", bgSurface: "#FFFFFF", textPrimary: "#0D211A",
    textSecondary: "#47645A", textMuted: "#8AA69C", border: "#DCEEE4",
    borderStrong: "#BEDECE", onPrimary: "#FFFFFF",
  }),
  t("energy-dark", "Energy Emerald", "Énergie & Utilities", "dark", {
    primary: "#34D399", secondary: "#94A3B8", accent: "#A3E635",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F87171", info: "#38BDF8",
    bgApp: "#071310", bgSurface: "#0D211B", textPrimary: "#E3F5EC",
    textSecondary: "#A6CCBC", textMuted: "#588470", border: "#17332A",
    borderStrong: "#234E3F", onPrimary: "#04211A",
  }),

  // ---- Secteur public ----
  t("gov-light", "Government Blue", "Secteur public", "light", {
    primary: "#1E40AF", secondary: "#374151", accent: "#6366F1",
    success: "#15803D", warning: "#B45309", danger: "#B91C1C", info: "#1D4ED8",
    bgApp: "#F7F8FA", bgSurface: "#FFFFFF", textPrimary: "#131A26",
    textSecondary: "#4B5768", textMuted: "#8D97A6", border: "#E2E5EB",
    borderStrong: "#C7CDD8", onPrimary: "#FFFFFF",
  }),
  t("gov-dark", "Government Blue", "Secteur public", "dark", {
    primary: "#6D8FE0", secondary: "#9AA5B5", accent: "#9295F5",
    success: "#4ADE80", warning: "#E0A93D", danger: "#E5615A", info: "#7AA0EE",
    bgApp: "#0A0E15", bgSurface: "#101623", textPrimary: "#E9ECF3",
    textSecondary: "#AEB8C9", textMuted: "#5D6879", border: "#1C2435",
    borderStrong: "#2C374D", onPrimary: "#FFFFFF",
  }),

  // ---- Hôtellerie & Restauration ----
  t("hosp-light", "Hospitality Terracotta", "Hôtellerie & Restauration", "light", {
    primary: "#C1502E", secondary: "#4A4038", accent: "#D9A566",
    success: "#3F7D4E", warning: "#C1802E", danger: "#A63A2A", info: "#3B6C82",
    bgApp: "#FCF8F4", bgSurface: "#FFFFFF", textPrimary: "#291E17",
    textSecondary: "#6C5A4C", textMuted: "#A99483", border: "#EFE1D3",
    borderStrong: "#E0C7AC", onPrimary: "#FFFFFF",
  }),
  t("hosp-dark", "Hospitality Terracotta", "Hôtellerie & Restauration", "dark", {
    primary: "#E38A63", secondary: "#B6A99B", accent: "#E8C081",
    success: "#63AD76", warning: "#E0AA55", danger: "#E37862", info: "#6A9CB0",
    bgApp: "#160F0B", bgSurface: "#201612", textPrimary: "#F5EAE1",
    textSecondary: "#CBB5A6", textMuted: "#7C685D", border: "#33241C",
    borderStrong: "#4C332A", onPrimary: "#2A1610",
  }),

  // ---- Pharma & Sciences de la vie ----
  t("pharma-light", "Pharma Cyan", "Pharma & Sciences de la vie", "light", {
    primary: "#0891B2", secondary: "#334155", accent: "#6366F1",
    success: "#16A34A", warning: "#D97706", danger: "#DC2626", info: "#0891B2",
    bgApp: "#F5FBFD", bgSurface: "#FFFFFF", textPrimary: "#0C2028",
    textSecondary: "#45606C", textMuted: "#8AA3AC", border: "#DCEEF2",
    borderStrong: "#BEDEE6", onPrimary: "#FFFFFF",
  }),
  t("pharma-dark", "Pharma Cyan", "Pharma & Sciences de la vie", "dark", {
    primary: "#22D3EE", secondary: "#94A3B8", accent: "#818CF8",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F87171", info: "#38BDF8",
    bgApp: "#06131A", bgSurface: "#0C2028", textPrimary: "#E1F4F9",
    textSecondary: "#A3C7D1", textMuted: "#567680", border: "#16323C",
    borderStrong: "#214956", onPrimary: "#052227",
  }),

  // ---- Luxe & Premium ----
  t("lux-light", "Charcoal & Gold", "Luxe & Premium", "light", {
    primary: "#1A1A1A", secondary: "#6B6459", accent: "#B8975A",
    success: "#3F7D4E", warning: "#B8975A", danger: "#A6392F", info: "#3B5D74",
    bgApp: "#FAF9F7", bgSurface: "#FFFFFF", textPrimary: "#17171A",
    textSecondary: "#5C5952", textMuted: "#9B9689", border: "#E7E3DB",
    borderStrong: "#D3CCBC", onPrimary: "#FFFFFF",
  }),
  t("lux-dark", "Charcoal & Gold", "Luxe & Premium", "dark", {
    primary: "#E8E6E1", secondary: "#A69C89", accent: "#D4B26A",
    success: "#5DAE72", warning: "#D4B26A", danger: "#D0685D", info: "#6F97AC",
    bgApp: "#0C0C0C", bgSurface: "#161615", textPrimary: "#F4F2EE",
    textSecondary: "#C4BDAD", textMuted: "#756E60", border: "#262523",
    borderStrong: "#38352F", onPrimary: "#17171A",
  }),

  // ---- Accessibilité (WCAG AAA) ----
  t("a11y-light", "High Contrast", "Accessibilité (WCAG AAA)", "light", {
    primary: "#0000CC", secondary: "#1A1A1A", accent: "#B30000",
    success: "#006600", warning: "#995C00", danger: "#CC0000", info: "#0000CC",
    bgApp: "#FFFFFF", bgSurface: "#FFFFFF", textPrimary: "#000000",
    textSecondary: "#1A1A1A", textMuted: "#4D4D4D", border: "#000000",
    borderStrong: "#000000", onPrimary: "#FFFFFF",
  }),
  t("a11y-dark", "High Contrast", "Accessibilité (WCAG AAA)", "dark", {
    primary: "#66B3FF", secondary: "#E6E6E6", accent: "#FF6666",
    success: "#66FF66", warning: "#FFCC66", danger: "#FF6666", info: "#66B3FF",
    bgApp: "#000000", bgSurface: "#000000", textPrimary: "#FFFFFF",
    textSecondary: "#E6E6E6", textMuted: "#B3B3B3", border: "#FFFFFF",
    borderStrong: "#FFFFFF", onPrimary: "#001433",
  }),

  // ---- Minimal ----
  t("mono-light", "Minimal Monochrome", "Minimal", "light", {
    primary: "#18181B", secondary: "#52525B", accent: "#71717A",
    success: "#16A34A", warning: "#CA8A04", danger: "#DC2626", info: "#2563EB",
    bgApp: "#FAFAFA", bgSurface: "#FFFFFF", textPrimary: "#18181B",
    textSecondary: "#52525B", textMuted: "#A1A1AA", border: "#E4E4E7",
    borderStrong: "#D4D4D8", onPrimary: "#FFFFFF",
  }),
  t("mono-dark", "Minimal Monochrome", "Minimal", "dark", {
    primary: "#FAFAFA", secondary: "#A1A1AA", accent: "#D4D4D8",
    success: "#4ADE80", warning: "#FBBF24", danger: "#F87171", info: "#60A5FA",
    bgApp: "#09090B", bgSurface: "#131316", textPrimary: "#FAFAFA",
    textSecondary: "#D4D4D8", textMuted: "#71717A", border: "#27272A",
    borderStrong: "#3A3A3F", onPrimary: "#18181B",
  }),
];

/* ============================== Helpers ============================== */

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Simple lighten/darken toward a target hex. */
export function mix(hex: string, target: string, amt: number): string {
  const h1 = hex.replace("#", "");
  const h2 = target.replace("#", "");
  const r = Math.round(parseInt(h1.substring(0, 2), 16) * (1 - amt) + parseInt(h2.substring(0, 2), 16) * amt);
  const g = Math.round(parseInt(h1.substring(2, 4), 16) * (1 - amt) + parseInt(h2.substring(2, 4), 16) * amt);
  const b = Math.round(parseInt(h1.substring(4, 6), 16) * (1 - amt) + parseInt(h2.substring(4, 6), 16) * amt);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Derived palette values used across the design (hover, soft surfaces). */
export interface DerivedPalette {
  primaryHover: string;
  onPrimary: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  infoSoft: string;
  primarySoft: string;
  surfaceMuted: string;
}

export function derivePalette(t: AtlasTheme): DerivedPalette {
  const c = t.colors;
  const dark = t.mode === "dark";
  return {
    primaryHover: mix(c.primary, "#000000", 0.14),
    onPrimary: c.onPrimary,
    successSoft: hexToRgba(c.success, 0.14),
    warningSoft: hexToRgba(c.warning, 0.14),
    dangerSoft: hexToRgba(c.danger, 0.14),
    infoSoft: hexToRgba(c.info, 0.14),
    primarySoft: hexToRgba(c.primary, 0.14),
    // neutral "raised chip" surface for the app's --secondary / --surface-muted
    surfaceMuted: mix(c.bgSurface, c.textPrimary, dark ? 0.14 : 0.055),
  };
}

const THEME_INDEX = new Map<string, AtlasTheme>(THEMES.map((x) => [x.id, x]));

export function getTheme(id: AtlasThemeId): AtlasTheme {
  const theme = THEME_INDEX.get(id);
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  return theme;
}

export function isThemeKnown(id: string): id is AtlasThemeId {
  return THEME_INDEX.has(id);
}

/** Light/dark sibling within the same family. */
export function siblingTheme(id: AtlasThemeId): AtlasThemeId {
  const theme = getTheme(id);
  return THEMES.find(
    (x) => x.family === theme.family && x.mode !== theme.mode,
  )?.id ?? id;
}

/** Themes grouped by family, preserving the reference order. */
export interface ThemeFamilyGroup {
  family: string;
  themes: AtlasTheme[];
}

export const themeFamilies: ThemeFamilyGroup[] = THEMES.reduce<
  ThemeFamilyGroup[]
>((acc, theme) => {
  const last = acc[acc.length - 1];
  if (last && last.family === theme.family) {
    last.themes.push(theme);
  } else {
    acc.push({ family: theme.family, themes: [theme] });
  }
  return acc;
}, []);

/** Token chips shown in the palette panel (design `TOKEN_LABELS`). */
export const TOKEN_LABELS: Array<[keyof ThemePalette, string]> = [
  ["primary", "Primaire"],
  ["secondary", "Secondaire"],
  ["accent", "Accent"],
  ["success", "Succès"],
  ["warning", "Avertissement"],
  ["danger", "Danger"],
  ["info", "Info"],
  ["bgApp", "Fond app"],
  ["bgSurface", "Surface"],
  ["textPrimary", "Texte principal"],
  ["textSecondary", "Texte secondaire"],
  ["textMuted", "Texte atténué"],
  ["border", "Bordure"],
  ["borderStrong", "Bordure forte"],
];

/** Complete CSS export for the given theme (faithful to the reference exporter). */
export function buildThemeCss(t: AtlasTheme): string {
  const c = t.colors;
  const d = derivePalette(t);
  return (
    `/* ${t.name} — ${t.modeLabel} (${t.family}) */\n:root{\n` +
    `  --primary: ${c.primary};\n  --primary-hover: ${d.primaryHover};\n  --on-primary: ${c.onPrimary};\n` +
    `  --secondary: ${c.secondary};\n  --accent: ${c.accent};\n\n` +
    `  --success: ${c.success};\n  --warning: ${c.warning};\n  --danger: ${c.danger};\n  --info: ${c.info};\n` +
    `  --success-soft: ${d.successSoft};\n  --warning-soft: ${d.warningSoft};\n  --danger-soft: ${d.dangerSoft};\n  --info-soft: ${d.infoSoft};\n\n` +
    `  --bg-app: ${c.bgApp};\n  --bg-surface: ${c.bgSurface};\n  --bg-elevated: ${c.bgSurface};\n\n` +
    `  --text-primary: ${c.textPrimary};\n  --text-secondary: ${c.textSecondary};\n  --text-muted: ${c.textMuted};\n\n` +
    `  --border: ${c.border};\n  --border-strong: ${c.borderStrong};\n\n` +
    `  --radius: 10px;\n  --radius-sm: 6px;\n}`
  );
}

/**
 * Map pathname → module theme (each workspace module carries its reference theme).
 * POS is checked before Commerce. Outside modules → null (keep current theme).
 */
export function resolveModuleTheme(_pathname: string): AtlasThemeId | null {
  return null;
}

/** Legacy module-id mapping for storage migration. */
export const LEGACY_MODULE_TO_THEME: Record<string, AtlasThemeId> = {
  pharmacy: "pharma-light",
  commerce: "corp-light",
  pos: "tech-light",
};