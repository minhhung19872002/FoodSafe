import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { CurrentUserDto } from "@/features/auth/types/auth.types";
import { PrivateRoute } from "./PrivateRoute";

const currentUser: CurrentUserDto = {
  id: "user-1",
  userName: "admin",
  name: "Quản trị viên",
  email: "admin@foodsafe.local",
  organizationId: null,
  organizationName: null,
  roles: ["admin"],
  permissions: ["FoodSafe.Organizations.View"],
  passwordMustChange: false,
};

function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Đăng nhập</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <div>Nội dung được bảo vệ</div>
              </PrivateRoute>
            }
          />
          <Route
            path="/account/change-password"
            element={
              <PrivateRoute>
                <div>Đổi mật khẩu bắt buộc</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PrivateRoute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it("hydrates the in-memory session from the server before rendering content", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(currentUser);

    renderRoute();

    expect(await screen.findByText("Nội dung được bảo vệ")).toBeInTheDocument();
    expect(useAuthStore.getState().user?.id).toBe(currentUser.id);
  });

  it("redirects to login and clears stale state when the server rejects the session", async () => {
    useAuthStore.getState().setAuth({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      organizationId: null,
      organizationName: null,
      roles: currentUser.roles,
      permissions: currentUser.permissions,
    });
    vi.spyOn(authApi, "getCurrentUser").mockRejectedValue(
      new Error("Unauthorized"),
    );

    renderRoute();

    expect(await screen.findByText("Đăng nhập")).toBeInTheDocument();
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
  });

  it("forces an expired-password session into the change-password route", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      ...currentUser,
      passwordMustChange: true,
    });

    renderRoute();

    expect(
      await screen.findByText("Đổi mật khẩu bắt buộc"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nội dung được bảo vệ")).not.toBeInTheDocument();
  });
});
