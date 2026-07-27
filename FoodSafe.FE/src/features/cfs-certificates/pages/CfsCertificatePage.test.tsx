import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import CfsCertificatePage from "./CfsCertificatePage";

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
        <CfsCertificatePage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/cfs-certificate", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "cfs-1",
            businessId: "business-1",
            businessName: "Cơ sở kiểm thử",
            organizationId: "organization-1",
            certificateNumber: "CFS-001",
            destinationCountryId: "country-1",
            destinationCountryName: "Nhật Bản",
            linkedProductName: "Sản phẩm kiểm thử",
            issueDate: "2026-07-01",
            expiryDate: "2026-08-10",
            status: 1,
            daysUntilExpiry: 16,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/cfs-certificate/business-options", () =>
      HttpResponse.json([]),
    ),
    http.get("*/api/v1/app/cfs-certificate/country-options", () =>
      HttpResponse.json([]),
    ),
  );
}

describe("CfsCertificatePage", () => {
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
        "FoodSafe.Licensing.CfsCertificates.View",
        "FoodSafe.Licensing.CfsCertificates.Create",
        "FoodSafe.Licensing.CfsCertificates.Edit",
        "FoodSafe.Licensing.CfsCertificates.Delete",
      ],
    });

    renderPage();

    expect(await screen.findByText("CFS-001")).toBeInTheDocument();
    expect(screen.getByText("Còn 16 ngày")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thêm CFS/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sửa CFS-001" }),
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
      permissions: ["FoodSafe.Licensing.CfsCertificates.View"],
    });

    renderPage();

    expect(await screen.findByText("CFS-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm CFS/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sửa CFS-001" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp CFS-001" }),
    ).toBeInTheDocument();
  });
});
