import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const authEnabled = process.env.EDGE_E2E_AUTH === "1";
const storageState =
  process.env.EDGE_E2E_STORAGE_STATE ??
  path.join("e2e", ".auth", "edge-user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    ...(authEnabled
      ? [
          {
            name: "edge-auth-setup",
            testMatch: /auth\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: authEnabled ? ["edge-auth-setup"] : [],
    },
    ...(authEnabled
      ? [
          {
            name: "chromium-edge-auth",
            use: {
              ...devices["Desktop Chrome"],
              storageState,
            },
            testMatch: /edge-(marketing|commercial)-scenarios\.spec\.ts/,
            dependencies: ["edge-auth-setup"],
          },
        ]
      : []),
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
