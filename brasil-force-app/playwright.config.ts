import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { proveIsolation, SITE_URL } from "./scripts/first-seller/isolation.mjs";
const local = await proveIsolation();
export default defineConfig({
  testDir: "./e2e/first-seller",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240000,
  outputDir: "test-results/first-seller/browser",
  reporter: [["list"]],
  use: {
    baseURL: SITE_URL,
    trace: "off",
    video: "off",
    screenshot: "off",
    actionTimeout: 15000,
    navigationTimeout: 45000,
    launchOptions: {
      ...(existsSync("/usr/bin/chromium")
        ? { executablePath: "/usr/bin/chromium" }
        : {}),
      args: ["--no-sandbox"],
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "chromium-mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 -p 3200",
    url: SITE_URL + "/api/health",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.anonKey,
      SITE_URL,
      AUTH_REGISTRATION_ENABLED: "true",
      AUTH_GOOGLE_ENABLED: "false",
      AUTH_APPLE_ENABLED: "false",
      BF_AI_ENABLED: "false",
      SHIPPING_ENABLED: "false",
      SHIPPING_PRODUCTION_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
