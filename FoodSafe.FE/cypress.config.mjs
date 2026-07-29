import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
    supportFile: false,
  },
  env: {
    adminPassword: process.env.E2E_ADMIN_PASSWORD,
  },
  video: false,
});
