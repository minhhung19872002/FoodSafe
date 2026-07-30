import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { PrivateRoute } from "./PrivateRoute";
import { PublicGuard } from "./PublicGuard";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { PermissionRoute } from "./PermissionRoute";
import { ROUTE_PERMISSIONS } from "./routePermissions";
import {
  ChangePasswordPage,
  ProfilePage,
  BusinessManagementPage,
  SelfDeclarationPage,
  ProductRegistrationPage,
  AdvertisementRegistrationPage,
  EligibilityCertificatePage,
  VsattpCommitmentPage,
  CfsCertificatePage,
  ExportFoodCertificatePage,
  InspectionPage,
  AlertsNewsPage,
  FoodPoisoningPage,
  ReportingPage,
  RiskAnalysisPage,
  TestingResultsPage,
  DocumentsPage,
  CompleteInitialPasswordChangePage,
  DashboardPage,
  ForgotPasswordPage,
  GeographicCatalogPage,
  IdentityAdministrationPage,
  LoginPage,
  MasterCatalogPage,
  OrganizationListPage,
  ResetPasswordPage,
  StatisticsPage,
  AuditLogPage,
  SystemSettingsPage,
  DataIntegrationPage,
  RouteLoading,
  PublicPortalHomePage,
  PublicGeneralSearchPage,
  PublicCertificateSearchPage,
  PublicWarnedBusinessesPage,
  PublicNewsPage,
  PublicRiskAnalysisSearchPage,
  PublicTestingResultSearchPage,
  PublicDocumentsPage,
  CitizenAlertReportPage,
  CitizenNewsReportPage,
  CitizenReportLookupPage,
} from "./routeComponents";

const appRoutes: RouteObject[] = [
  // ── Public portal routes ─────────────────────────────────────────────────
  {
    path: "/cong-thong-tin",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicPortalHomePage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-chung",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicGeneralSearchPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-giay-phep",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicCertificateSearchPage />
      </Suspense>
    ),
  },
  {
    path: "/danh-sach-canh-bao",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicWarnedBusinessesPage />
      </Suspense>
    ),
  },
  {
    path: "/tin-tuc",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicNewsPage />
      </Suspense>
    ),
  },
  {
    path: "/tin-tuc/:id",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicNewsPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-phan-tich-nguy-co",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicRiskAnalysisSearchPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-ket-qua-kiem-nghiem",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicTestingResultSearchPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-van-ban",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicDocumentsPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-van-ban/:id",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicDocumentsPage />
      </Suspense>
    ),
  },
  {
    path: "/gui-phan-anh",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <CitizenAlertReportPage />
      </Suspense>
    ),
  },
  {
    path: "/gui-tin",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <CitizenNewsReportPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-phan-anh",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <CitizenReportLookupPage />
      </Suspense>
    ),
  },
  // ── End public portal routes ──────────────────────────────────────────────
  {
    path: "/tra-cuu-giay-du-dieu-kien",
    element: <Navigate to="/tra-cuu-giay-phep?tab=eligibility" replace />,
  },
  {
    path: "/tra-cuu-cfs",
    element: <Navigate to="/tra-cuu-giay-phep?tab=cfs" replace />,
  },
  {
    path: "/tra-cuu-gcn-xuat-khau",
    element: <Navigate to="/tra-cuu-giay-phep?tab=export-food" replace />,
  },
  {
    path: "/tra-cuu-dang-ky-cong-bo",
    element: <Navigate to="/tra-cuu-giay-phep?tab=product-registrations" replace />,
  },
  {
    path: "/tra-cuu-co-so",
    element: <Navigate to="/tra-cuu-chung?tab=businesses" replace />,
  },
  {
    path: "/tra-cuu-tu-cong-bo",
    element: <Navigate to="/tra-cuu-giay-phep?tab=self-declarations" replace />,
  },
  {
    path: "/tra-cuu-dang-ky-quang-cao",
    element: <Navigate to="/tra-cuu-giay-phep?tab=ad-registrations" replace />,
  },
  {
    path: "/login",
    element: (
      <PublicGuard>
        <Suspense fallback={<RouteLoading />}>
          <LoginPage />
        </Suspense>
      </PublicGuard>
    ),
  },
  {
    path: "/account/forgot-password",
    element: (
      <PublicGuard>
        <Suspense fallback={<RouteLoading />}>
          <ForgotPasswordPage />
        </Suspense>
      </PublicGuard>
    ),
  },
  {
    path: "/account/reset-password",
    element: (
      <PublicGuard>
        <Suspense fallback={<RouteLoading />}>
          <ResetPasswordPage />
        </Suspense>
      </PublicGuard>
    ),
  },
  {
    path: "/account/complete-password-change",
    element: (
      <PublicGuard>
        <Suspense fallback={<RouteLoading />}>
          <CompleteInitialPasswordChangePage />
        </Suspense>
      </PublicGuard>
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
            <PermissionRoute permission={ROUTE_PERMISSIONS.organizations}>
              <OrganizationListPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "geography",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.geography}>
              <GeographicCatalogPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "businesses",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.businesses}>
              <BusinessManagementPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "self-declarations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.selfDeclarations}>
              <SelfDeclarationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "product-registrations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute
              permission={ROUTE_PERMISSIONS.productRegistrations}
            >
              <ProductRegistrationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "advertisement-registrations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.adRegistrations}>
              <AdvertisementRegistrationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "eligibility-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute
              permission={ROUTE_PERMISSIONS.eligibilityCertificates}
            >
              <EligibilityCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "vsattp-commitments",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.vsattpCommitments}>
              <VsattpCommitmentPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "cfs-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.cfsCertificates}>
              <CfsCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "export-food-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.exportCertificates}>
              <ExportFoodCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "inspection",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.inspection}>
              <InspectionPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "alerts-news",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.alertsNews}>
              <AlertsNewsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "food-poisoning",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.foodPoisoning}>
              <FoodPoisoningPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "reporting",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.reporting}>
              <ReportingPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "risk-analysis",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.riskAnalysis}>
              <RiskAnalysisPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "testing-results",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.testingResults}>
              <TestingResultsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "documents",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.documents}>
              <DocumentsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "data-integration",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.dataIntegration}>
              <DataIntegrationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "statistics",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <StatisticsPage />
          </Suspense>
        ),
      },
      {
        path: "catalogs",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.catalogs}>
              <MasterCatalogPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "administration/audit-logs",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.auditLogs}>
              <AuditLogPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "administration/settings",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.settings}>
              <SystemSettingsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "administration/identity",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission={ROUTE_PERMISSIONS.identity}>
              <IdentityAdministrationPage />
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
      {
        path: "account/profile",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        // Bắt mọi đường dẫn không khớp. Đặt BÊN TRONG layout đã đăng nhập để
        // người dùng đang làm việc gõ nhầm URL vẫn còn menu và header mà quay
        // lại — không bị ném ra một trang trắng mất phương hướng.
        // Khách chưa đăng nhập gõ nhầm URL sẽ được `PrivateRoute` đưa về trang
        // đăng nhập; đó là đích đúng cho một hệ thống nội bộ và cũng không để
        // lộ danh sách đường dẫn bên trong.
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router = createBrowserRouter([
  {
    // Route gốc không có `path`, chỉ tồn tại để gắn `errorElement` cho toàn bộ
    // cây route: lỗi render hoặc lỗi tải lazy chunk ở bất kỳ route con nào cũng
    // nổi lên đây thay vì rơi vào màn hình lỗi tiếng Anh mặc định của React Router.
    errorElement: <RouteErrorBoundary />,
    children: appRoutes,
  },
]);
