import { lazy } from "react";
import { Spin } from "antd";

export const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
export const ChangePasswordPage = lazy(
  () => import("@/features/auth/pages/ChangePasswordPage"),
);
export const ForgotPasswordPage = lazy(
  () => import("@/features/auth/pages/ForgotPasswordPage"),
);
export const ResetPasswordPage = lazy(
  () => import("@/features/auth/pages/ResetPasswordPage"),
);
export const CompleteInitialPasswordChangePage = lazy(
  () => import("@/features/auth/pages/CompleteInitialPasswordChangePage"),
);
export const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage"),
);
export const OrganizationListPage = lazy(
  () => import("@/features/organizations/pages/OrganizationListPage"),
);
export const GeographicCatalogPage = lazy(
  () => import("@/features/geography/pages/GeographicCatalogPage"),
);
export const IdentityAdministrationPage = lazy(
  () => import("@/features/identity/pages/IdentityAdministrationPage"),
);
export const MasterCatalogPage = lazy(
  () => import("@/features/catalogs/pages/MasterCatalogPage"),
);
export const BusinessManagementPage = lazy(
  () => import("@/features/businesses/pages/BusinessManagementPage"),
);

export function RouteLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}
