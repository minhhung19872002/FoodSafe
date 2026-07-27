import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import SystemSettingsPage from "./SystemSettingsPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <App>
        <SystemSettingsPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("SystemSettingsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders editable configuration form from API values",
    { timeout: 15000 },
    async () => {
      server.use(
        http.get("*/api/v1/app/system-settings", () =>
          HttpResponse.json({
            passwordRequiredLength: 10,
            passwordMaxLength: 128,
            passwordRequireDigit: true,
            passwordRequireLowercase: true,
            passwordRequireUppercase: true,
            passwordRequireNonAlphanumeric: true,
            lockoutMaxFailedAttempts: 5,
            lockoutDurationMinutes: 30,
            smtpHost: "smtp.foodsafe.local",
            smtpPort: 587,
            smtpEnableSsl: true,
            hasSmtpPassword: false,
            homepageTitle: "Hệ thống ATTP",
            hasLogo: false,
            hasLoginBackground: false,
          }),
        ),
      );
      useAuthStore.getState().setAuth({
        id: "user-1",
        name: "Admin",
        email: "admin@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["Admin"],
        permissions: ["FoodSafe.SystemAdmin.Settings"],
      });

      renderPage();

      expect(
        await screen.findByText("Cấu hình hệ thống", {}, { timeout: 10000 }),
      ).toBeInTheDocument();
      expect(
        await screen.findByDisplayValue("smtp.foodsafe.local"),
      ).toBeInTheDocument();
      expect(
        await screen.findByDisplayValue("10", {}, { timeout: 5000 }),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Hệ thống ATTP")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Lưu cấu hình/ }),
      ).toBeInTheDocument();
    },
  );
});
