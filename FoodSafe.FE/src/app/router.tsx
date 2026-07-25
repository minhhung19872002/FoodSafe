import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { PrivateRoute } from './PrivateRoute'
import { PermissionRoute } from './PermissionRoute'
import {
  ChangePasswordPage,
  DashboardPage,
  LoginPage,
  OrganizationListPage,
  RouteLoading,
} from './routeComponents'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<RouteLoading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'organizations',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Organizations.View">
              <OrganizationListPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: 'account/change-password',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ChangePasswordPage />
          </Suspense>
        ),
      },
    ],
  },
])
