import { api } from '@/lib/axios'
import type { ChangePasswordRequest, CurrentUserDto, LoginRequest, LoginResponse } from '../types/auth.types'

export const authApi = {
  initializeCsrf: (): Promise<void> =>
    api.get('/abp/application-configuration', {
      params: { IncludeLocalizationResources: false },
    }).then(() => undefined),

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await authApi.initializeCsrf()
    return api.post<LoginResponse>('/account/login', data).then((r) => r.data)
  },

  logout: async (): Promise<void> => {
    await authApi.initializeCsrf()
    return api.post<void>('/account/logout').then(() => undefined)
  },

  getCurrentUser: (): Promise<CurrentUserDto> =>
    api.get<CurrentUserDto>('/app/current-user-context').then((r) => r.data),

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await authApi.initializeCsrf()
    return api.post<void>('/app/account-security/change-password', data).then(() => undefined)
  },
}
