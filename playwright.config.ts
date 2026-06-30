import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

if (!process.env.CI) {
  dotenv.config({ quiet: true });
}

export default defineConfig({
  timeout: 120000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "on-failure" }],
    ["list"],
  ],
  expect: {
    timeout: 15000,
  },
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "task_chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 1500 },
        baseURL: process.env.ENVS || "https://qa-task.redvike.rocks/",
      },
    },
  ],
});
