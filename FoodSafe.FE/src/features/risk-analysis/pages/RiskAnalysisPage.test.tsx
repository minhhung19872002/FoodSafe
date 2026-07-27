import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import RiskAnalysisPage from "./RiskAnalysisPage";

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
        <RiskAnalysisPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/risk-analysis", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "ra-1",
            organizationId: "org-1",
            title: "Phân tích nguy cơ kiểm thử",
            category: 1,
            riskLevel: 2,
            analysisDate: "2026-07-01",
            status: 1,
          },
        ],
      }),
    ),
  );
}

describe("RiskAnalysisPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders data and create button for full-permission user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user-1",
      name: "Test User",
      email: "test@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.AlertsAndTesting.RiskAnalyses.View",
        "FoodSafe.AlertsAndTesting.RiskAnalyses.Create",
        "FoodSafe.AlertsAndTesting.RiskAnalyses.Edit",
        "FoodSafe.AlertsAndTesting.RiskAnalyses.Delete",
        "FoodSafe.AlertsAndTesting.RiskAnalyses.Publish",
      ],
    });

    renderPage();

    expect(
      await screen.findByText("Phân tích nguy cơ kiểm thử"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tạo phân tích/ }),
    ).toBeInTheDocument();
  });

  it("hides mutation controls for read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: ["FoodSafe.AlertsAndTesting.RiskAnalyses.View"],
    });

    renderPage();

    expect(
      await screen.findByText("Phân tích nguy cơ kiểm thử"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo phân tích/ }),
    ).not.toBeInTheDocument();
  });
});
