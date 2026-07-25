import { api } from "@/lib/axios";
import type {
  ChangePasswordRequest,
  CompleteInitialPasswordChangeRequest,
  CurrentUserDto,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from "../types/auth.types";

export const authApi = {
  initializeCsrf: (): Promise<void> =>
    api
      .get("/abp/application-configuration", {
        params: { IncludeLocalizationResources: false },
      })
      .then(() => undefined),

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await authApi.initializeCsrf();
    const response = await api.post<LoginResponse>("/account/login", data);
    if (response.data.result === 1) {
      await authApi.initializeCsrf();
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await authApi.initializeCsrf();
    return api.post<void>("/account/logout").then(() => undefined);
  },

  getCurrentUser: (): Promise<CurrentUserDto> =>
    api.get<CurrentUserDto>("/v1/app/current-user-context").then((r) => r.data),

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await authApi.initializeCsrf();
    return api
      .post<void>("/v1/app/account-security/change-password", data)
      .then(() => undefined);
  },

  completeInitialPasswordChange: async (
    data: CompleteInitialPasswordChangeRequest,
  ): Promise<void> => {
    await authApi.initializeCsrf();
    return api
      .post<void>(
        "/v1/app/account-security/complete-initial-password-change",
        data,
      )
      .then(() => undefined);
  },

  sendPasswordResetCode: async (email: string): Promise<void> => {
    await authApi.initializeCsrf();
    return api
      .post<void>("/account/send-password-reset-code", {
        email,
        appName: "Angular",
      })
      .then(() => undefined);
  },

  verifyPasswordResetToken: async (
    userId: string,
    resetToken: string,
  ): Promise<void> => {
    await authApi.initializeCsrf();
    return api
      .post<void>("/account/verify-password-reset-token", {
        userId,
        resetToken,
      })
      .then(() => undefined);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await authApi.initializeCsrf();
    return api
      .post<void>("/v1/app/account-security/reset-password", data)
      .then(() => undefined);
  },
};
