import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import EligibilityCertificatePage from "./EligibilityCertificatePage";

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
        <EligibilityCertificatePage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/eligibility-certificate", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "certificate-1",
            businessId: "business-1",
            businessName: "Cơ sở đủ điều kiện",
            organizationId: "org-1",
            certificateNumber: "DDK-001",
            issueDate: "2026-07-01",
            expiryDate: "2026-08-10",
            status: 1,
            daysUntilExpiry: 16,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/eligibility-certificate/business-options", () =>
      HttpResponse.json([]),
    ),
  );
}

describe("EligibilityCertificatePage", () => {
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
        "FoodSafe.Licensing.EligibilityCertificates.View",
        "FoodSafe.Licensing.EligibilityCertificates.Create",
        "FoodSafe.Licensing.EligibilityCertificates.Edit",
        "FoodSafe.Licensing.EligibilityCertificates.Delete",
      ],
    });
    renderPage();
    expect(await screen.findByText("DDK-001")).toBeInTheDocument();
    expect(screen.getByText("Còn 16 ngày")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cấp giấy/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sửa DDK-001" }),
    ).toBeInTheDocument();
  });

  it("keeps files read-only for a viewer", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["DistrictStaff"],
      permissions: ["FoodSafe.Licensing.EligibilityCertificates.View"],
    });
    renderPage();
    expect(await screen.findByText("DDK-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cấp giấy/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tệp DDK-001" }),
    ).toBeInTheDocument();
  });
});
