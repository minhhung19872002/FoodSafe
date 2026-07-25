import { lazy } from 'react'
import { Spin } from 'antd'

export const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
export const ChangePasswordPage = lazy(() => import('@/features/auth/pages/ChangePasswordPage'))
export const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
export const OrganizationListPage = lazy(() => import('@/features/organizations/pages/OrganizationListPage'))

export function RouteLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  )
}
