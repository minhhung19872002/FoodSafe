export interface LoginRequest {
  userNameOrEmailAddress: string;
  password: string;
  captchaToken: string;
  rememberMe?: boolean;
}

export interface CaptchaConfig {
  provider: "turnstile";
  siteKey: string;
  action: string;
}

export interface LoginResponse {
  result: number;
  description: string;
}

export interface CurrentUserDto {
  id: string;
  userName: string;
  name: string;
  email: string;
  organizationId: string | null;
  organizationName: string | null;
  roles: string[];
  permissions: string[];
  passwordMustChange: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  userId: string;
  resetToken: string;
  password: string;
}
