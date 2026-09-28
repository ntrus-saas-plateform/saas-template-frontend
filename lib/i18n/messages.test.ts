import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/messages";
import { hasPermission } from "@/lib/access/permissions";

describe("i18n", () => {
  it("resolves fr and en keys", () => {
    expect(t("en", "shell.search")).toBe("Search…");
    expect(t("fr", "shell.search")).toBe("Rechercher…");
  });
});

describe("permissions", () => {
  it("matches wildcard", () => {
    expect(hasPermission(["customers:*"], "customers:read")).toBe(true);
  });
});
