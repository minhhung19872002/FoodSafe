import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import FoodPoisoningPage from "./FoodPoisoningPage";

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
        <MemoryRouter>
          <FoodPoisoningPage />
        </MemoryRouter>
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/food-poisoning-case", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "case-1",
            caseCode: "CA-001",
            reportDate: "2026-07-01",
            victimName: "Nguyễn Văn A",
            victimGender: 1,
            victimAge: 35,
            suspectedFood: "Cá nóc",
            treatmentResult: 1,
            status: 1,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/food-poisoning-incident", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "inc-1",
            incidentCode: "VU-001",
            occurrenceDate: "2026-07-01T10:00:00",
            locationDescription: "Nhà hàng X",
            affectedCount: 10,
            hospitalizedCount: 5,
            deathCount: 0,
            caseCount: 3,
            status: 1,
          },
        ],
      }),
    ),
  );
}

describe("FoodPoisoningPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders cases tab with create button for full-permission user",
    { timeout: 30000 },
    async () => {
      mockData();
      useAuthStore.getState().setAuth({
        id: "user",
        name: "User",
        email: "user@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["ProvinceStaff"],
        // Tab "Ca ngộ độc" chỉ hiện khi có Cases.View — người dùng thật luôn
        // có View kèm các quyền thao tác, fixture phải phản ánh đúng như vậy.
        permissions: [
          "FoodSafe.FoodPoisoning.Cases.View",
          "FoodSafe.FoodPoisoning.Cases.Create",
          "FoodSafe.FoodPoisoning.Cases.Edit",
          "FoodSafe.FoodPoisoning.Cases.Delete",
          "FoodSafe.FoodPoisoning.Cases.Verify",
        ],
      });

      renderPage();

      expect(await screen.findByText("CA-001")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Tạo ca ngộ độc/ }),
      ).toBeInTheDocument();
    },
  );

  it("hides mutation controls for read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["CommuneStaff"],
      permissions: ["FoodSafe.FoodPoisoning.Cases.View"],
    });

    renderPage();

    expect(await screen.findByText("CA-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo ca ngộ độc/ }),
    ).not.toBeInTheDocument();
  });
});
