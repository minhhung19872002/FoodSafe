import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { authApi } from "./authApi";
import { useAuthStore } from "../store/authStore";
import type {
  ChangePasswordRequest,
  CompleteInitialPasswordChangeRequest,
  LoginRequest,
} from "../types/auth.types";

class InitialPasswordChangeRequiredError extends Error {
  readonly userNameOrEmailAddress: string;

  constructor(userNameOrEmailAddress: string) {
    super("Initial password change required");
    this.userNameOrEmailAddress = userNameOrEmailAddress;
  }
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await authApi.login(data);
      if (response.result === 4) {
        throw new InitialPasswordChangeRequiredError(
          data.userNameOrEmailAddress,
        );
      }
      if (response.result !== 1) {
        throw new Error(response.description);
      }
      const user = await authApi.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
      setAuth({
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        roles: user.roles,
        permissions: user.permissions,
      });

      if (user.passwordMustChange) {
        navigate("/account/change-password");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      if (error instanceof InitialPasswordChangeRequiredError) {
        navigate("/account/complete-password-change", {
          state: { userName: error.userNameOrEmailAddress },
        });
        return;
      }
      message.error("Tên đăng nhập hoặc mật khẩu không đúng.");
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
      clearAuth();
      navigate("/login");
    },
  });
}

export function useCompleteInitialPasswordChange() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: CompleteInitialPasswordChangeRequest) =>
      authApi.completeInitialPasswordChange(data),
    onSuccess: () => {
      message.success("Mật khẩu đã được thay đổi. Vui lòng đăng nhập.");
      navigate("/login");
    },
    onError: () => {
      message.error(
        "Không thể thay đổi mật khẩu. Kiểm tra thông tin và thử lại.",
      );
    },
  });
}

export function useChangePassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await authApi.changePassword(data);
      return authApi.getCurrentUser();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
      setAuth(user);
      message.success("Đổi mật khẩu thành công.");
      navigate("/");
    },
    onError: () => {
      message.error(
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      );
    },
  });
}
