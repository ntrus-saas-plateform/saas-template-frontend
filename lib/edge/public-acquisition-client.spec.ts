import { afterEach, describe, expect, it, vi } from "vitest";
import {
  postPublicAcquisitionApplication,
  postPublicAcquisitionLead,
} from "./public-acquisition-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("postPublicAcquisitionApplication fail-closed", () => {
  it("succeeds only when applicationId is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: { applicationId: "app-1", status: "SUBMITTED" },
        }),
      ),
    );
    await expect(
      postPublicAcquisitionApplication({
        publicFormSlug: "slug",
        email: "a@b.com",
      }),
    ).resolves.toEqual({
      applicationId: "app-1",
      status: "SUBMITTED",
      prospectId: undefined,
      formPublicationId: undefined,
    });
  });

  it("throws when HTTP ok but applicationId missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { status: "SUBMITTED" } })),
    );
    await expect(
      postPublicAcquisitionApplication({
        publicFormSlug: "slug",
        email: "a@b.com",
      }),
    ).rejects.toThrow(/identifiant dossier/i);
  });
});

describe("postPublicAcquisitionLead fail-closed", () => {
  it("succeeds only when leadId is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { leadId: "lead-9" } })),
    );
    await expect(
      postPublicAcquisitionLead({ email: "a@b.com" }),
    ).resolves.toEqual({ leadId: "lead-9" });
  });

  it("throws when HTTP ok but leadId missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { ok: true } })),
    );
    await expect(postPublicAcquisitionLead({ email: "a@b.com" })).rejects.toThrow(
      /identifiant Edge/i,
    );
  });
});
