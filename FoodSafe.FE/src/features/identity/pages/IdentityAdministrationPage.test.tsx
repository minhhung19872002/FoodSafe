import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import IdentityAdministrationPage from "./IdentityAdministrationPage";

function mockApis() {
  server.use(
    http.get("*/api/v1/administration/users", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "user-1",
            userName: "admin",
            fullName: "Nguyễn Admin",
            email: "admin@foodsafe.local",
            organizationName: "Chi cục ATVSTP",
            roleNames: ["Admin"],
            isActive: true,
            isLocked: false,
            mustChangePassword: false,
          },
        ],
      }),
    ),
    http.get("*/api/v1/administration/roles", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "role-1",
            name: "Admin",
            description: "Quản trị viên",
            isActive: true,
            isStatic: true,
            userCount: 3,
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/organization/tree", () =>
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
        <IdentityAdministrationPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("IdentityAdministrationPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders user tab with create button for admin",
    { timeout: 15000 },
    async () => {
      mockApis();
      useAuthStore.getState().setAuth({
        id: "admin-1",
        name: "Admin",
        email: "admin@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["Admin"],
        permissions: [
          "FoodSafe.SystemAdmin.Users",
          "FoodSafe.SystemAdmin.Users.Create",
          "FoodSafe.SystemAdmin.Users.Edit",
          "FoodSafe.SystemAdmin.Roles",
          "FoodSafe.SystemAdmin.Roles.Create",
        ],
      });

      renderPage();

      expect(screen.getByText("Tài khoản và quyền")).toBeInTheDocument();
      expect(
        await screen.findByText("Nguyễn Admin", {}, { timeout: 10000 }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Tạo tài khoản/ }),
      ).toBeInTheDocument();
    },
  );

  it("hides user tab for user without Users permission", async () => {
    mockApis();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: ["FoodSafe.SystemAdmin.Roles"],
    });

    renderPage();

    expect(screen.getByText("Tài khoản và quyền")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo tài khoản/ }),
    ).not.toBeInTheDocument();
  });
});
