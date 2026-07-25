import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/store/authStore'
import { PermissionRoute } from './PermissionRoute'

const user = {
  id: 'user-1',
  name: 'Quản trị viên',
  email: 'admin@foodsafe.local',
  organizationId: null,
  organizationName: null,
  roles: ['admin'],
  permissions: ['FoodSafe.Organizations.View'],
}

describe('PermissionRoute', () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('renders protected content when the permission is granted', () => {
    useAuthStore.getState().setAuth(user)

    render(
      <PermissionRoute permission="FoodSafe.Organizations.View">
        <div>Danh sách đơn vị</div>
      </PermissionRoute>,
    )

    expect(screen.getByText('Danh sách đơn vị')).toBeInTheDocument()
  })

  it('renders a forbidden result when the permission is missing', () => {
    useAuthStore.getState().setAuth({ ...user, permissions: [] })

    render(
      <PermissionRoute permission="FoodSafe.Organizations.View">
        <div>Danh sách đơn vị</div>
      </PermissionRoute>,
    )

    expect(screen.queryByText('Danh sách đơn vị')).not.toBeInTheDocument()
    expect(screen.getByText('Không có quyền truy cập')).toBeInTheDocument()
  })
})
