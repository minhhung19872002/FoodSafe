import { create } from 'zustand'

interface UserInfo {
  id: string
  name: string
  email: string
  organizationId: string | null
  organizationName: string | null
  roles: string[]
  permissions: string[]
}

interface AuthState {
  user: UserInfo | null
  isAuthenticated: boolean
  setAuth: (user: UserInfo) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,

  setAuth: (user) => set({ user, isAuthenticated: true }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),

  hasPermission: (permission) =>
    get().user?.permissions.includes(permission) ?? false,
}))
