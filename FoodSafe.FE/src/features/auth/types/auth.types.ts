export interface LoginRequest {
  userNameOrEmailAddress: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken?: string
}

export interface CurrentUserDto {
  id: string
  name: string
  email: string
  organizationId: string
  organizationName: string
  roles: string[]
  permissions: string[]
  passwordMustChange: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
