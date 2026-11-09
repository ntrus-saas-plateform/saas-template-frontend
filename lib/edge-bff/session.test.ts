import { describe, expect, it } from "vitest";
import { EDGE_SESSION_COOKIE, edgeSessionOptions } from "./session";

describe("edge BFF session", () => {
  it("uses okapi_edge_bff_session cookie name (isolated from ERP edge_bff_session)", () => {
    expect(EDGE_SESSION_COOKIE).toBe("okapi_edge_bff_session");
    expect(edgeSessionOptions.cookieName).toBe("okapi_edge_bff_session");
    expect(edgeSessionOptions.cookieName).not.toBe("edge_bff_session");
  });

  it("keeps Edge session cookies httpOnly", () => {
    expect(edgeSessionOptions.cookieOptions?.httpOnly).toBe(true);
    expect(edgeSessionOptions.cookieOptions?.path).toBe("/");
  });
});
