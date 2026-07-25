import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import AdvertisementRegistrationPage from "./AdvertisementRegistrationPage";

function renderPage() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <App>
        <AdvertisementRegistrationPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/advertisement-registration", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "ad-1",
            businessId: "business-1",
            businessName: "Cơ sở quảng cáo",
            organizationId: "org-1",
            registrationNumber: "QC-001",
            registrationDate: "2026-07-01",
            expiryDate: "2026-08-10",
            status: 1,
            daysUntilExpiry: 16,
            products: [{ id: "p-1", name: "Sản phẩm A" }],
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/advertisement-registration/business-options", () =>
      HttpResponse.json([]),
    ),
    http.get(
      "*/api/v1/app/advertisement-registration/advertisement-type-options",
      () => HttpResponse.json([]),
    ),
  );
}

describe("AdvertisementRegistrationPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("shows warnings and mutation controls with permissions", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user",
      name: "User",
      email: "user@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.Licensing.AdRegistrations.View",
        "FoodSafe.Licensing.AdRegistrations.Create",
        "FoodSafe.Licensing.AdRegistrations.Edit",
        "FoodSafe.Licensing.AdRegistrations.Delete",
      ],
    });
    renderPage();
    expect(await screen.findByText("QC-001")).toBeInTheDocument();
    expect(screen.getByText("Còn 16 ngày")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thêm đăng ký/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sửa QC-001" }),
    ).toBeInTheDocument();
  });

  it("hides mutations for a read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["CommuneStaff"],
      permissions: ["FoodSafe.Licensing.AdRegistrations.View"],
    });
    renderPage();
    expect(await screen.findByText("QC-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm đăng ký/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp QC-001" }),
    ).toBeInTheDocument();
  });
});
