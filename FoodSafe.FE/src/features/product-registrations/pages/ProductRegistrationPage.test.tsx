import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import ProductRegistrationPage from "./ProductRegistrationPage";

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
        <ProductRegistrationPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/product-registration", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "registration-1",
            businessId: "business-1",
            businessName: "Cơ sở kiểm thử",
            organizationId: "organization-1",
            registrationNumber: "DKCB-001",
            receiptNumber: "TN-001",
            registrationDate: "2026-07-01",
            productName: "Sản phẩm kiểm thử",
            expiryDate: "2026-08-10",
            status: 1,
            daysUntilExpiry: 16,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/product-registration/business-options", () =>
      HttpResponse.json([]),
    ),
  );
}

describe("ProductRegistrationPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders expiry warning and licensed write actions", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user",
      name: "User",
      email: "user@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.Licensing.ProductRegistrations.View",
        "FoodSafe.Licensing.ProductRegistrations.Create",
        "FoodSafe.Licensing.ProductRegistrations.Edit",
        "FoodSafe.Licensing.ProductRegistrations.Delete",
      ],
    });

    renderPage();

    expect(await screen.findByText("DKCB-001")).toBeInTheDocument();
    expect(screen.getByText("Còn 16 ngày")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thêm đăng ký/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sửa DKCB-001" }),
    ).toBeInTheDocument();
  });

  it("keeps a read-only user free of mutation controls", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["CommuneStaff"],
      permissions: ["FoodSafe.Licensing.ProductRegistrations.View"],
    });

    renderPage();

    expect(await screen.findByText("DKCB-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm đăng ký/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sửa DKCB-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp DKCB-001" }),
    ).toBeInTheDocument();
  });
});
