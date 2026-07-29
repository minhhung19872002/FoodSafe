import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import BusinessManagementPage from "./BusinessManagementPage";

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
        <BusinessManagementPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("BusinessManagementPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders scoped businesses and products through feature hooks", async () => {
    server.use(
      http.get("*/api/v1/app/business", () =>
        HttpResponse.json({
          totalCount: 1,
          hasRestrictedScope: false,
          items: [
            {
              id: "business-1",
              organizationId: "org-1",
              code: "CS-01",
              name: "Cơ sở kiểm thử",
              status: 1,
              hasEligibilityCertificate: true,
              hasVsattpCommitment: false,
              productGroupIds: [],
              handlers: [],
            },
          ],
        }),
      ),
      http.get("*/api/v1/app/product", () =>
        HttpResponse.json({
          totalCount: 1,
          items: [
            {
              id: "product-1",
              businessId: "business-1",
              organizationId: "org-1",
              code: "SP-01",
              name: "Sản phẩm kiểm thử",
              status: 1,
            },
          ],
        }),
      ),
      http.get("*/api/v1/app/product/business-options", () =>
        HttpResponse.json([
          { id: "business-1", code: "CS-01", name: "Cơ sở kiểm thử" },
        ]),
      ),
      http.get("*/api/v1/app/organization/tree", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("*/api/v1/app/master-catalog/*", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
    );
    useAuthStore.getState().setAuth({
      id: "admin",
      name: "Admin",
      email: "admin@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["admin"],
      permissions: [
        "FoodSafe.BusinessManagement.Businesses.View",
        "FoodSafe.BusinessManagement.Businesses.Create",
        "FoodSafe.BusinessManagement.Businesses.Import",
        "FoodSafe.BusinessManagement.Products.View",
        "FoodSafe.BusinessManagement.Products.Create",
        "FoodSafe.BusinessManagement.Products.Import",
      ],
    });
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText("Cơ sở kiểm thử")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm cơ sở/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Bản đồ" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Sản phẩm" }));
    expect(await screen.findByText("Sản phẩm kiểm thử")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm sản phẩm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /tệp đính kèm sản phẩm kiểm thử/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("hides all write controls for a read-only session", async () => {
    server.use(
      http.get("*/api/v1/app/business", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
      http.get("*/api/v1/app/product", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
      http.get("*/api/v1/app/product/business-options", () =>
        HttpResponse.json([]),
      ),
      http.get("*/api/v1/app/organization/tree", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("*/api/v1/app/master-catalog/*", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
    );
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: [
        "FoodSafe.BusinessManagement.Businesses.View",
        "FoodSafe.BusinessManagement.Products.View",
      ],
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Cơ sở và sản phẩm" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /thêm cơ sở/i }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Sản phẩm" }));
    expect(
      screen.queryByRole("button", { name: /thêm sản phẩm/i }),
    ).not.toBeInTheDocument();
  });

  it("supports a product-only permission without requesting the business API", async () => {
    let businessRequested = false;
    server.use(
      http.get("*/api/v1/app/business", () => {
        businessRequested = true;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
      http.get("*/api/v1/app/product", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
      http.get("*/api/v1/app/product/business-options", () =>
        HttpResponse.json([]),
      ),
      http.get("*/api/v1/app/organization/tree", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("*/api/v1/app/master-catalog/*", () =>
        HttpResponse.json({ totalCount: 0, items: [] }),
      ),
    );
    useAuthStore.getState().setAuth({
      id: "product-user",
      name: "Product user",
      email: "product@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProductStaff"],
      permissions: ["FoodSafe.BusinessManagement.Products.View"],
    });

    renderPage();

    expect(await screen.findByRole("tab", { name: "Sản phẩm" })).toBeVisible();
    expect(
      screen.queryByRole("tab", { name: "Cơ sở SXKD" }),
    ).not.toBeInTheDocument();
    expect(businessRequested).toBe(false);
  });
});
