import { api } from '@/lib/axios'
import type { ChangePasswordRequest, CurrentUserDto, LoginRequest, LoginResponse } from '../types/auth.types'

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    api.post<LoginResponse>('/account/login', data).then((r) => r.data),

  logout: (): Promise<void> =>
    api.post<void>('/account/logout').then(() => undefined),

  getCurrentUser: (): Promise<CurrentUserDto> =>
    api.get<CurrentUserDto>('/identity/my-profile').then((r) => r.data),

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    api.post<void>('/account/my-profile/change-password', data).then(() => undefined),
}
