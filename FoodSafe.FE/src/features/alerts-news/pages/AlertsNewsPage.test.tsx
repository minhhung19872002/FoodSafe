import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import AlertsNewsPage from "./AlertsNewsPage";

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
        <AlertsNewsPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/atp-alert", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "alert-1",
            title: "Cảnh báo nguy cơ kiểm thử",
            category: 1,
            severity: 2,
            source: 1,
            status: 1,
            creationTime: "2026-07-01T00:00:00",
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/atp-news", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
  );
}

describe("AlertsNewsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders alerts tab with create button for full-permission user",
    { timeout: 30000 },
    async () => {
      mockData();
      useAuthStore.getState().setAuth({
        id: "user-1",
        name: "Test User",
        email: "test@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["ProvinceStaff"],
        permissions: [
          "FoodSafe.AlertsAndTesting.Alerts.View",
          "FoodSafe.AlertsAndTesting.Alerts.Create",
          "FoodSafe.AlertsAndTesting.Alerts.Edit",
          "FoodSafe.AlertsAndTesting.Alerts.Delete",
          "FoodSafe.AlertsAndTesting.Alerts.Publish",
          "FoodSafe.AlertsAndTesting.News.View",
          "FoodSafe.AlertsAndTesting.News.Create",
          "FoodSafe.AlertsAndTesting.News.Edit",
          "FoodSafe.AlertsAndTesting.News.Delete",
          "FoodSafe.AlertsAndTesting.News.Publish",
        ],
      });

      renderPage();

      expect(
        await screen.findByText("Cảnh báo nguy cơ kiểm thử"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Tạo cảnh báo/ }),
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
      roles: ["Viewer"],
      permissions: ["FoodSafe.AlertsAndTesting.Alerts.View"],
    });

    renderPage();

    expect(
      await screen.findByText("Cảnh báo nguy cơ kiểm thử"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo cảnh báo/ }),
    ).not.toBeInTheDocument();
  });
});
