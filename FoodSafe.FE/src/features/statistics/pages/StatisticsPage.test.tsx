import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import StatisticsPage from "./StatisticsPage";

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
        <StatisticsPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/statistics", () =>
      HttpResponse.json({
        businessByType: [
          { name: "Sản xuất", count: 40 },
          { name: "Kinh doanh", count: 60 },
        ],
        businessByStatus: [
          { name: "Hoạt động", count: 85 },
          { name: "Ngừng hoạt động", count: 15 },
        ],
        licenseByCategory: [],
        licenseByStatus: [],
        inspectionsByMonth: [],
        violationsByMonth: [],
        poisoningCasesByMonth: [],
        inspectionOutcome: [],
      }),
    ),
  );
}

describe("StatisticsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders statistics page heading", { timeout: 15000 }, async () => {
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

    expect(await screen.findByText("Thống kê tổng hợp")).toBeInTheDocument();
  });
});
