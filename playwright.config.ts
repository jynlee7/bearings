import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/harness",
  use: { baseURL: "http://127.0.0.1:3001" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001/design-preview",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
