import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import DashboardPage from "./DashboardPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <App>
          <DashboardPage />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/dashboard/stats", () =>
      HttpResponse.json({
        totalBusinesses: 150,
        activeBusinesses: 120,
        totalSelfDeclarations: 45,
        totalProductRegistrations: 20,
        totalEligibilityCertificates: 10,
        totalCfsCertificates: 5,
        totalExportCertificates: 3,
        totalAdRegistrations: 2,
        expiringWithin30Days: 8,
        totalInspectionPlans: 15,
        totalInspectionResults: 30,
        inspectionViolationCount: 5,
        totalFoodPoisoningCases: 3,
        totalAlerts: 12,
        totalRiskAnalyses: 7,
        totalTestingResults: 20,
        licenseBreakdown: [],
        recentActivities: [],
      }),
    ),
  );
}

describe("DashboardPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders dashboard stats for authenticated user",
    { timeout: 15000 },
    async () => {
      mockData();
      useAuthStore.getState().setAuth({
        id: "user-1",
        name: "Test User",
        email: "test@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["ProvinceStaff"],
        permissions: [],
      });

      renderPage();

      expect(
        await screen.findByText("150", {}, { timeout: 10000 }),
      ).toBeInTheDocument();
      expect(screen.getByText("120 đang hoạt động")).toBeInTheDocument();
    },
  );
});
