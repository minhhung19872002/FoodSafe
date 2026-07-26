import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";
import {
  ChangePasswordPage,
  BusinessManagementPage,
  SelfDeclarationPage,
  ProductRegistrationPage,
  PublicProductRegistrationLookupPage,
  AdvertisementRegistrationPage,
  EligibilityCertificatePage,
  PublicEligibilityCertificateLookupPage,
  CfsCertificatePage,
  PublicCfsCertificateLookupPage,
  ExportFoodCertificatePage,
  PublicExportFoodCertificateLookupPage,
  InspectionPage,
  AlertsNewsPage,
  FoodPoisoningPage,
  ReportingPage,
  RiskAnalysisPage,
  TestingResultsPage,
  DocumentsPage,
  PublicBusinessLookupPage,
  PublicSelfDeclarationLookupPage,
  CompleteInitialPasswordChangePage,
  DashboardPage,
  ForgotPasswordPage,
  GeographicCatalogPage,
  IdentityAdministrationPage,
  LoginPage,
  MasterCatalogPage,
  OrganizationListPage,
  ResetPasswordPage,
  RouteLoading,
} from "./routeComponents";

export const router = createBrowserRouter([
  {
    path: "/tra-cuu-giay-du-dieu-kien",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicEligibilityCertificateLookupPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-cfs",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicCfsCertificateLookupPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-gcn-xuat-khau",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicExportFoodCertificateLookupPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-dang-ky-cong-bo",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicProductRegistrationLookupPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-co-so",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicBusinessLookupPage />
      </Suspense>
    ),
  },
  {
    path: "/tra-cuu-tu-cong-bo",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <PublicSelfDeclarationLookupPage />
      </Suspense>
    ),
  },
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
    path: "/account/complete-password-change",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <CompleteInitialPasswordChangePage />
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
        path: "businesses",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute
              permission={[
                "FoodSafe.BusinessManagement.Businesses.View",
                "FoodSafe.BusinessManagement.Products.View",
              ]}
            >
              <BusinessManagementPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "self-declarations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute
              permission={"FoodSafe.BusinessManagement.SelfDeclarations.View"}
            >
              <SelfDeclarationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "product-registrations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Licensing.ProductRegistrations.View">
              <ProductRegistrationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "advertisement-registrations",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Licensing.AdRegistrations.View">
              <AdvertisementRegistrationPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "eligibility-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Licensing.EligibilityCertificates.View">
              <EligibilityCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "cfs-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Licensing.CfsCertificates.View">
              <CfsCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "export-food-certificates",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Licensing.ExportCertificates.View">
              <ExportFoodCertificatePage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "inspection",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Inspection.Plans.View">
              <InspectionPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "alerts-news",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.AlertsAndTesting.Alerts.View">
              <AlertsNewsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "food-poisoning",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.FoodPoisoning.Cases.View">
              <FoodPoisoningPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "reporting",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Reporting.NdtpReports.View">
              <ReportingPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "risk-analysis",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.AlertsAndTesting.RiskAnalyses.View">
              <RiskAnalysisPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "testing-results",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.AlertsAndTesting.TestingResults.View">
              <TestingResultsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "documents",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.AlertsAndTesting.Documents.View">
              <DocumentsPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "catalogs",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.Catalogs.View">
              <MasterCatalogPage />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "administration/identity",
        element: (
          <Suspense fallback={<RouteLoading />}>
            <PermissionRoute permission="FoodSafe.SystemAdministration">
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
    ],
  },
]);
