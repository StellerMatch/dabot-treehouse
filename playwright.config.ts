import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  reporter: "line",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:8091",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "TREEHOUSE_TASK_PACKET_DIR=./test-results/treehouse-task-packets npm run dev -- --host 127.0.0.1 --port 8091",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:8091/levels",
  },
});
