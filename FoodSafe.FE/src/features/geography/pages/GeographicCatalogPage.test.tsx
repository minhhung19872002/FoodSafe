import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import GeographicCatalogPage from "./GeographicCatalogPage";

function mockApis() {
  server.use(
    http.get("*/api/v1/app/geographic-catalog/provinces", () =>
      HttpResponse.json({
        items: [{ id: "p-1", code: "22", name: "Quảng Ninh", isActive: true }],
      }),
    ),
    http.get("*/api/v1/app/geographic-catalog/districts", () =>
      HttpResponse.json({ items: [] }),
    ),
    http.get("*/api/v1/app/geographic-catalog/communes", () =>
      HttpResponse.json({ items: [] }),
    ),
  );
}

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
        <GeographicCatalogPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("GeographicCatalogPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders geographic catalog with province data",
    { timeout: 15000 },
    async () => {
      mockApis();
      useAuthStore.getState().setAuth({
        id: "user-1",
        name: "Admin",
        email: "admin@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["Admin"],
        permissions: ["FoodSafe.GeographicCatalogs.Manage"],
      });

      renderPage();

      expect(screen.getByText("Địa bàn hành chính")).toBeInTheDocument();
      expect(
        await screen.findByText("Quảng Ninh", {}, { timeout: 10000 }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Thêm tỉnh\/thành phố/ }),
      ).toBeInTheDocument();
    },
  );

  it(
    "hides manage buttons for read-only user",
    { timeout: 15000 },
    async () => {
      mockApis();
      useAuthStore.getState().setAuth({
        id: "viewer",
        name: "Viewer",
        email: "viewer@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["Viewer"],
        permissions: [],
      });

      renderPage();

      expect(
        await screen.findByText("Quảng Ninh", {}, { timeout: 10000 }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Thêm tỉnh\/thành phố/ }),
      ).not.toBeInTheDocument();
    },
  );
});
