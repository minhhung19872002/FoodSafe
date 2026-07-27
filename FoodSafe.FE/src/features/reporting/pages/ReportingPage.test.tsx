import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import ReportingPage from "./ReportingPage";

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
        <ReportingPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/ndtp-report", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "ndtp-1",
            periodMonth: 7,
            periodYear: 2026,
            status: 1,
            caseCount: 3,
            incidentCount: 1,
            submissionVersion: 1,
            creationTime: "2026-07-01T00:00:00",
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/atp-work-report", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
    http.get("*/api/v1/app/action-month-report", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
  );
}

describe("ReportingPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders NDTP tab with create button for full-permission user", { timeout: 15000 }, async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user-1",
      name: "Test User",
      email: "test@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.Reporting.NdtpReports.View",
        "FoodSafe.Reporting.NdtpReports.Create",
        "FoodSafe.Reporting.NdtpReports.Edit",
        "FoodSafe.Reporting.NdtpReports.Delete",
        "FoodSafe.Reporting.NdtpReports.Submit",
        "FoodSafe.Reporting.NdtpReports.Verify",
        "FoodSafe.Reporting.NdtpReports.Return",
        "FoodSafe.Reporting.NdtpReports.Complete",
      ],
    });

    renderPage();

    expect(
      await screen.findByText(/Tháng 7\/2026/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tạo báo cáo/ }),
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
      permissions: ["FoodSafe.Reporting.NdtpReports.View"],
    });

    renderPage();

    expect(
      await screen.findByText(/Tháng 7\/2026/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo báo cáo/ }),
    ).not.toBeInTheDocument();
  });
});
