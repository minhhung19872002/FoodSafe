import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApi } from './authApi'
import { useAuthStore } from '../store/authStore'
import type { ChangePasswordRequest, LoginRequest } from '../types/auth.types'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await authApi.login(data)
      const user = await authApi.getCurrentUser()
      return { token: response.accessToken, user }
    },
    onSuccess: ({ token, user }) => {
      setAuth(token, {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        roles: user.roles,
        permissions: user.permissions,
      })

      if (user.passwordMustChange) {
        navigate('/account/change-password')
      } else {
        navigate('/')
      }
    },
    onError: () => {
      message.error('Tên đăng nhập hoặc mật khẩu không đúng.')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth()
      navigate('/login')
    },
  })
}

export function useChangePassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      message.success('Đổi mật khẩu thành công.')
      navigate('/')
    },
    onError: () => {
      message.error('Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    },
  })
}
