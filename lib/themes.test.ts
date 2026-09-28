import { describe, expect, it } from "vitest";
import {
  buildThemeCss,
  getTheme,
  derivePalette,
  resolveModuleTheme,
  siblingTheme,
  themeFamilies,
  THEMES,
} from "@/lib/themes";

describe("resolveModuleTheme", () => {
  it("returns null for identity and home routes", () => {
    expect(resolveModuleTheme("/")).toBeNull();
    expect(resolveModuleTheme("/identity/organizations")).toBeNull();
    expect(resolveModuleTheme("/identity/users")).toBeNull();
  });
});

describe("theme library", () => {
  it("exposes the 36 reference themes across 18 families", () => {
    expect(THEMES).toHaveLength(36);
    expect(themeFamilies).toHaveLength(18);
    const families = new Set(
      THEMES.map((t) => `${t.family}:${t.mode}`).map((s) => s.replace(/:light|:dark/g, "")),
    );
    expect(families.size).toBe(18);
  });

  it("each family has a light and a dark variant", () => {
    for (const group of themeFamilies) {
      const modes = group.themes.map((t) => t.mode).sort();
      expect(modes).toEqual(["dark", "light"]);
    }
  });

  it("sibling switches mode within the same family", () => {
    expect(siblingTheme("corp-light")).toBe("corp-dark");
    expect(siblingTheme("corp-dark")).toBe("corp-light");
    expect(siblingTheme("tech-light")).toBe("tech-dark");
  });

  it("getTheme returns the requested palette", () => {
    const theme = getTheme("corp-light");
    expect(theme.colors.primary).toBe("#2563EB");
    expect(theme.colors.bgSurface).toBe("#FFFFFF");
    expect(theme.colors.onPrimary).toBe("#FFFFFF");
  });

  it("derives hover/soft tokens", () => {
    const d = derivePalette(getTheme("corp-light"));
    expect(d.primaryHover).toBe("#2055ca");
    expect(d.successSoft.startsWith("rgba(22, 163, 74,")).toBe(true);
    expect(d.dangerSoft.startsWith("rgba(220, 38, 38,")).toBe(true);
  });

  it("keeps palette secondary distinct from surface muted", () => {
    const theme = getTheme("corp-light");
    const d = derivePalette(theme);
    expect(theme.colors.secondary).toBe("#475569");
    expect(d.surfaceMuted).not.toBe(theme.colors.secondary);
  });

  it("builds an exportable CSS block", () => {
    const css = buildThemeCss(getTheme("mono-dark"));
    expect(css).toContain("/* Minimal Monochrome — Sombre (Minimal) */");
    expect(css).toContain("--radius: 10px;");
    expect(css).toContain("--radius-sm: 6px;");
  });
});