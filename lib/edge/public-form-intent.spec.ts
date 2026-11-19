import { describe, expect, it } from "vitest";
import type { PublicFormPayload } from "@/types/edge-acquisition";
import { resolvePublicFormSubmitIntent } from "./public-form-intent";

function basePayload(
  overrides?: Partial<{
    publicationMeta: Record<string, unknown>;
    schemaMeta: Record<string, unknown>;
    versionMeta: Record<string, unknown>;
    schemaCode: string;
    schemaName: string;
  }>,
): PublicFormPayload {
  return {
    publication: {
      id: "pub-1",
      formSchemaId: "schema-1",
      formVersionId: "ver-1",
      channel: "PUBLIC_WEB",
      publicSlug: "demo",
      status: "PUBLISHED",
      publishedAt: "2026-01-01T00:00:00.000Z",
      publishedBy: "actor",
      expiresAt: null,
      metadata: overrides?.publicationMeta ?? {},
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    formVersion: {
      id: "ver-1",
      formSchemaId: "schema-1",
      versionNumber: 1,
      schemaDefinition: { fields: [] },
      conditionRules: [],
      status: "PUBLISHED",
      publishedAt: "2026-01-01T00:00:00.000Z",
      publishedBy: "actor",
      immutableAfterPublish: true,
      metadata: overrides?.versionMeta ?? {},
      createdBy: "actor",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    schema: {
      id: "schema-1",
      code: overrides?.schemaCode ?? "generic-form",
      name: overrides?.schemaName ?? "Generic form",
      description: null,
      status: "PUBLISHED",
      productId: null,
      commercialPlanId: null,
      currentPublishedVersionId: "ver-1",
      metadata: overrides?.schemaMeta ?? {},
      createdBy: "actor",
      updatedBy: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
    },
  };
}

describe("resolvePublicFormSubmitIntent", () => {
  it("returns LEAD when payload is null", () => {
    expect(resolvePublicFormSubmitIntent(null)).toBe("LEAD");
  });

  it("maps CONTACT / DEMO metadata to LEAD", () => {
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({ publicationMeta: { formType: "CONTACT" } }),
      ),
    ).toBe("LEAD");
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({ schemaMeta: { formType: "DEMO_REQUEST" } }),
      ),
    ).toBe("LEAD");
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({ versionMeta: { publicSubmitMode: "LEAD" } }),
      ),
    ).toBe("LEAD");
  });

  it("maps APPLICATION metadata to APPLICATION", () => {
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({ publicationMeta: { formIntent: "APPLICATION" } }),
      ),
    ).toBe("APPLICATION");
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({ schemaMeta: { publicSubmitMode: "FULL_APPLICATION" } }),
      ),
    ).toBe("APPLICATION");
  });

  it("defaults to APPLICATION when schema looks like acquisition", () => {
    expect(
      resolvePublicFormSubmitIntent(
        basePayload({
          schemaCode: "pharmacy-acquisition",
          schemaName: "Candidature onboarding",
        }),
      ),
    ).toBe("APPLICATION");
  });

  it("defaults to APPLICATION when no lead/application cue is present", () => {
    expect(resolvePublicFormSubmitIntent(basePayload())).toBe("APPLICATION");
  });
});
