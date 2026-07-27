import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import TestingResultsPage from "./TestingResultsPage";

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
        <TestingResultsPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/testing-result", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "tr-1",
            organizationId: "org-1",
            sampleCode: "MAU-001",
            sampleName: "Mẫu kiểm thử",
            testingCenterName: "Trung tâm KN",
            businessName: "Cơ sở KN",
            sampleDate: "2026-07-01",
            outcome: 1,
          },
        ],
      }),
    ),
  );
}

describe("TestingResultsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders data and write actions for full-permission user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user-1",
      name: "Test User",
      email: "test@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.AlertsAndTesting.TestingResults.View",
        "FoodSafe.AlertsAndTesting.TestingResults.Create",
        "FoodSafe.AlertsAndTesting.TestingResults.Edit",
        "FoodSafe.AlertsAndTesting.TestingResults.Delete",
      ],
    });

    renderPage();

    expect(await screen.findByText("MAU-001")).toBeInTheDocument();
    expect(screen.getByText("Mẫu kiểm thử")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nhập kết quả/ }),
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
      permissions: ["FoodSafe.AlertsAndTesting.TestingResults.View"],
    });

    renderPage();

    expect(await screen.findByText("MAU-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Nhập kết quả/ }),
    ).not.toBeInTheDocument();
  });
});
