import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
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
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <App>
          <DataIntegrationPage />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
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
    http.get("*/v1/app/data-sharing/inspection-result-options", () =>
      HttpResponse.json([
        {
          id: "result-1",
          businessName: "Cơ sở mẫu",
          inspectionDate: "2026-07-30T00:00:00",
          adminDecisionNumber: "QĐ-001",
        },
      ]),
    ),
    http.get("*/v1/app/data-sharing/food-poisoning-options", () =>
      HttpResponse.json([
        {
          id: "incident-1",
          incidentCode: "NĐTP-001",
          occurrenceDate: "2026-07-30T00:00:00",
        },
      ]),
    ),
    http.get("*/v1/app/data-sharing/license-options", () =>
      HttpResponse.json([
        {
          id: "license-1",
          kind: "eligibility",
          number: "GCN-001",
          businessName: "Cơ sở mẫu",
          issueDate: "2026-07-30T00:00:00",
        },
      ]),
    ),
    http.get("*/v1/app/data-sharing/product-options", () =>
      HttpResponse.json([
        { id: "product-1", code: "SP-001", name: "Sản phẩm mẫu" },
      ]),
    ),
    http.get("*/v1/app/data-sharing/news-options", () =>
      HttpResponse.json([
        { id: "news-1", title: "Tin tức mẫu", category: "ATTP" },
      ]),
    ),
    http.get("*/v1/app/data-sharing/business-options", () =>
      HttpResponse.json([
        { id: "business-1", code: "CS-001", name: "Cơ sở mẫu" },
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

  it("requires selecting a concrete inspection result when sharing", async () => {
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
    await user.click(
      screen.getByRole("tab", {
        name: "Kết quả thanh kiểm tra",
      }),
    );
    await user.click(screen.getByRole("button", { name: /Chia sẻ dữ liệu/ }));

    expect(
      await screen.findByText("Tìm theo cơ sở hoặc số quyết định"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kết quả thanh, kiểm tra", { selector: "label" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Ngộ độc thực phẩm", "Tìm theo mã vụ ngộ độc"],
    ["Giấy phép", "Tìm theo số giấy phép hoặc cơ sở"],
    ["Sản phẩm, thực phẩm", "Tìm theo mã, tên hoặc thương hiệu"],
    ["Tin tức, hoạt động", "Tìm theo tiêu đề hoặc danh mục"],
    ["Cơ sở SXKD", "Tìm theo mã, tên hoặc mã số thuế"],
  ])(
    "requires selecting a concrete record for %s",
    async (tabName, placeholder) => {
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
      await user.click(screen.getByRole("tab", { name: tabName }));
      await user.click(screen.getByRole("button", { name: /Chia sẻ dữ liệu/ }));

      expect(await screen.findByText(placeholder)).toBeInTheDocument();
    },
  );
});
