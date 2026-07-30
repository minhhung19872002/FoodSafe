import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import DataIntegrationPage from "./DataIntegrationPage";

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
        <DataIntegrationPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/v1/app/api-endpoint", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "ep-1",
            name: "Sync Bộ Y tế",
            url: "https://external.example.com/api/v1/sync",
            httpMethod: "POST",
            externalSystem: "Bộ Y tế",
            authType: 1,
            status: 1,
          },
        ],
      }),
    ),
    http.get("*/v1/app/api-call-log", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
    http.get("*/v1/app/data-sharing/alert-options", () =>
      HttpResponse.json([
        { id: "alert-1", alertNumber: "CB-001", title: "Cảnh báo mẫu" },
      ]),
    ),
  );
}

describe("DataIntegrationPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders endpoints tab with create button for full-permission user",
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
          "FoodSafe.DataIntegration.ApiEndpoints.View",
          "FoodSafe.DataIntegration.ApiEndpoints.Create",
          "FoodSafe.DataIntegration.ApiEndpoints.Edit",
          "FoodSafe.DataIntegration.ApiEndpoints.Delete",
        ],
      });

      renderPage();

      expect(await screen.findByText("Sync Bộ Y tế")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Thêm endpoint/ }),
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
      permissions: ["FoodSafe.DataIntegration.ApiEndpoints.View"],
    });

    renderPage();

    expect(await screen.findByText("Sync Bộ Y tế")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm endpoint/ }),
    ).not.toBeInTheDocument();
  });

  it("requires selecting a concrete alert when sharing alert data", async () => {
    mockData();
    const user = userEvent.setup();
    useAuthStore.getState().setAuth({
      id: "integration-user",
      name: "Integration User",
      email: "integration@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Integration"],
      permissions: [
        "FoodSafe.DataIntegration.ApiEndpoints.View",
        "FoodSafe.DataIntegration.CallHistory.View",
        "FoodSafe.DataIntegration.Share",
      ],
    });

    renderPage();

    await user.click(
      await screen.findByRole("tab", { name: "Lịch sử gọi API" }),
    );
    await user.click(screen.getByRole("button", { name: /Chia sẻ dữ liệu/ }));

    expect(
      await screen.findByText("Tìm theo mã hoặc tiêu đề cảnh báo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cảnh báo ATTP", { selector: "label" }),
    ).toBeInTheDocument();
  });
});
