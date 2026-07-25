import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import MasterCatalogPage from "./MasterCatalogPage";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App>
        <MasterCatalogPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("MasterCatalogPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders catalog data through query hooks and validates creation input", async () => {
    server.use(
      http.get("*/api/v1/app/master-catalog/countries", () =>
        HttpResponse.json({
          items: [
            {
              id: "vn",
              codeAlpha2: "VN",
              nameVi: "Việt Nam",
              isActive: true,
              sortOrder: 0,
            },
          ],
          totalCount: 1,
        }),
      ),
      http.get("*/api/v1/app/master-catalog/product-groups", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
      http.get("*/api/v1/app/master-catalog/testing-centers", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
      http.get("*/api/v1/app/geographic-catalog/provinces", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
    );
    useAuthStore.getState().setAuth({
      id: "admin",
      name: "Quản trị viên",
      email: "admin@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["admin"],
      permissions: [
        "FoodSafe.Catalogs.Create",
        "FoodSafe.Catalogs.Edit",
        "FoodSafe.Catalogs.Delete",
      ],
    });
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText("Việt Nam")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /thêm mới/i }));
    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(await screen.findByText("Vui lòng nhập mã")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập tên")).toBeInTheDocument();
  });

  it("does not render write actions without catalog permissions", async () => {
    server.use(
      http.get("*/api/v1/app/master-catalog/*", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
      http.get("*/api/v1/app/geographic-catalog/provinces", () =>
        HttpResponse.json({ items: [], totalCount: 0 }),
      ),
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Danh mục dùng chung" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /thêm mới/i }),
    ).not.toBeInTheDocument();
  });
});
