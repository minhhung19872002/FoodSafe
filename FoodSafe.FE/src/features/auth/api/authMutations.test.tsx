import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../store/authStore";
import type { CurrentUserDto, LoginRequest } from "../types/auth.types";
import { authApi } from "./authApi";
import { useLogin, useLogout } from "./authMutations";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

const currentUser: CurrentUserDto = {
  id: "user-2",
  userName: "commune.staff",
  name: "Cán bộ xã",
  email: "commune.staff@foodsafe.local",
  organizationId: "org-commune",
  organizationName: "Trạm Y tế xã",
  roles: ["CommuneStaff"],
  permissions: ["FoodSafe.BusinessManagement.Businesses.Create"],
  passwordMustChange: false,
};

const loginRequest: LoginRequest = {
  userNameOrEmailAddress: "commune.staff",
  password: "Secret@123",
  captchaToken: "captcha-token",
  rememberMe: false,
};

describe("auth query-cache isolation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it("removes scoped data from the previous session after login", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(["organizations", "tree"], {
      items: [{ id: "org-from-previous-user" }],
    });
    vi.spyOn(authApi, "login").mockResolvedValue({
      result: 1,
      description: "Success",
    });
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(currentUser);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync(loginRequest);
    });

    expect(queryClient.getQueryData(["organizations", "tree"])).toBeUndefined();
    expect(queryClient.getQueryData(["auth", "current-user"])).toEqual(
      currentUser,
    );
  });

  it("removes all scoped data after logout", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(["auth", "current-user"], currentUser);
    queryClient.setQueryData(["organizations", "tree"], {
      items: [{ id: "org-current-user" }],
    });
    vi.spyOn(authApi, "logout").mockResolvedValue();

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(["auth", "current-user"])).toBeUndefined();
    expect(queryClient.getQueryData(["organizations", "tree"])).toBeUndefined();
  });
});
