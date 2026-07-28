import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import SelfDeclarationPage from "./SelfDeclarationPage";

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
        <SelfDeclarationPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/self-declaration", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "declaration-1",
            businessId: "business-1",
            businessName: "Cơ sở kiểm thử",
            organizationId: "organization-1",
            declarationNumber: "TCB-001",
            declarationDate: "2026-07-01",
            productName: "Sản phẩm kiểm thử",
            expiryDate: "2026-08-10",
            status: 1,
            daysUntilExpiry: 16,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/self-declaration/business-options", () =>
      HttpResponse.json([
        {
          id: "business-1",
          code: "CS-01",
          name: "Cơ sở kiểm thử",
        },
      ]),
    ),
  );
}

describe("SelfDeclarationPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders scoped declarations, expiry warning and write actions",
    { timeout: 30000 },
    async () => {
      mockData();
      useAuthStore.getState().setAuth({
        id: "licensing-user",
        name: "Licensing user",
        email: "licensing@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["ProvinceStaff"],
        permissions: [
          "FoodSafe.BusinessManagement.SelfDeclarations.View",
          "FoodSafe.BusinessManagement.SelfDeclarations.Create",
          "FoodSafe.BusinessManagement.SelfDeclarations.Edit",
          "FoodSafe.BusinessManagement.SelfDeclarations.Delete",
        ],
      });

      renderPage();

      expect(
        await screen.findByRole("heading", {
          name: "Hồ sơ tự công bố",
        }),
      ).toBeInTheDocument();
      expect(await screen.findByText("TCB-001")).toBeInTheDocument();
      expect(screen.getByText("Còn 16 ngày")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Thêm hồ sơ/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sửa TCB-001" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Thao tác TCB-001" }),
      ).toBeInTheDocument();
    },
  );

  it("hides all mutation controls for a read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: ["FoodSafe.BusinessManagement.SelfDeclarations.View"],
    });

    renderPage();

    expect(await screen.findByText("TCB-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm hồ sơ/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sửa TCB-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Thao tác TCB-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp TCB-001" }),
    ).toBeInTheDocument();
  });
});
