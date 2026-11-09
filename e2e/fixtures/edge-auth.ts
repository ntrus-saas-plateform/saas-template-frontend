import path from "node:path";

export const edgeAuthEnabled = process.env.EDGE_E2E_AUTH === "1";

export const edgeStorageStatePath =
  process.env.EDGE_E2E_STORAGE_STATE ??
  path.join("e2e", ".auth", "edge-user.json");

export function edgeAuthSkipReason(): string {
  return "Set EDGE_E2E_AUTH=1 with EDGE_E2E_USERNAME/PASSWORD (or prebuilt storage state) to run authenticated UI flows";
}
