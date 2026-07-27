import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import ExportFoodCertificatePage from "./ExportFoodCertificatePage";

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
        <ExportFoodCertificatePage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/export-food-certificate", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "cert-1",
            businessId: "b-1",
            businessName: "Cơ sở XK",
            certificateNumber: "XK-001",
            linkedProductName: "SP XK",
            lotNumber: "LOT-1",
            quantity: 100,
            quantityUnit: "kg",
            destinationCountryName: "Japan",
            issueDate: "2026-01-15",
            expiryDate: "2027-01-15",
            status: 1,
            daysUntilExpiry: 200,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/export-food-certificate/business-options", () =>
      HttpResponse.json([{ id: "b-1", code: "CS-XK", name: "Cơ sở XK" }]),
    ),
    http.get("*/api/v1/app/export-food-certificate/country-options", () =>
      HttpResponse.json([{ id: "c-1", code: "JP", name: "Japan" }]),
    ),
  );
}

describe("ExportFoodCertificatePage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders page heading and write actions for a full-permission user", { timeout: 15000 }, async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user",
      name: "User",
      email: "user@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.Licensing.ExportCertificates.View",
        "FoodSafe.Licensing.ExportCertificates.Create",
        "FoodSafe.Licensing.ExportCertificates.Edit",
        "FoodSafe.Licensing.ExportCertificates.Delete",
      ],
    });

    renderPage();

    expect(
      await screen.findByText("Giấy chứng nhận xuất khẩu thực phẩm"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("XK-001", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thêm GCN XK/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sửa XK-001" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Thu hồi XK-001" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xóa XK-001" }),
    ).toBeInTheDocument();
  });

  it("hides write actions for a read-only user but keeps file attachment button", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["CommuneStaff"],
      permissions: ["FoodSafe.Licensing.ExportCertificates.View"],
    });

    renderPage();

    expect(
      await screen.findByText("XK-001", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm GCN XK/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sửa XK-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Thu hồi XK-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp XK-001" }),
    ).toBeInTheDocument();
  });
});
