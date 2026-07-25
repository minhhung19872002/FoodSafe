import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";
import {
  ChangePasswordPage,
  DashboardPage,
  ForgotPasswordPage,
  GeographicCatalogPage,
  LoginPage,
  OrganizationListPage,
  ResetPasswordPage,
  RouteLoading,
} from "./routeComponents";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/account/forgot-password",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/account/reset-password",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/",
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
        path: "dashboard",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "organizations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Organizations.View">
              <OrganizationListPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "geography",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.GeographicCatalogs.View">
              <GeographicCatalogPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "account/change-password",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ChangePasswordPage />
          </Suspense>
        ),
      },
    ],
  },
]);
