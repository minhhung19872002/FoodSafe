import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import InspectionPage from "./InspectionPage";

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
        <InspectionPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/inspection-plan", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "plan-1",
            planCode: "KH-001",
            title: "Kế hoạch Q3",
            planType: 1,
            year: 2026,
            completedItems: 3,
            totalItems: 10,
            status: 1,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/inspection-plan/business-options", () =>
      HttpResponse.json([]),
    ),
    http.get("*/api/v1/app/inspection-result", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
  );
}

describe("InspectionPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders plans tab with create button for full-permission user", { timeout: 15000 }, async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user",
      name: "User",
      email: "user@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.Inspection.Plans.Create",
        "FoodSafe.Inspection.Plans.Edit",
        "FoodSafe.Inspection.Plans.Delete",
        "FoodSafe.Inspection.Plans.Approve",
        "FoodSafe.Inspection.Results.Create",
        "FoodSafe.Inspection.Results.Edit",
        "FoodSafe.Inspection.Results.Delete",
      ],
    });
    renderPage();
    expect(await screen.findByText("KH-001")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tạo kế hoạch/ }),
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
      roles: ["DistrictStaff"],
      permissions: ["FoodSafe.Inspection.Plans.View"],
    });
    renderPage();
    expect(await screen.findByText("KH-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo kế hoạch/ }),
    ).not.toBeInTheDocument();
  });
});
