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
export const SelfDeclarationPage = lazy(
  () => import("@/features/self-declarations/pages/SelfDeclarationPage"),
);
export const ProductRegistrationPage = lazy(
  () =>
    import("@/features/product-registrations/pages/ProductRegistrationPage"),
);
export const PublicProductRegistrationLookupPage = lazy(
  () =>
    import("@/features/product-registrations/pages/PublicProductRegistrationLookupPage"),
);
export const AdvertisementRegistrationPage = lazy(
  () =>
    import("@/features/advertisement-registrations/pages/AdvertisementRegistrationPage"),
);
export const EligibilityCertificatePage = lazy(
  () =>
    import("@/features/eligibility-certificates/pages/EligibilityCertificatePage"),
);
export const PublicEligibilityCertificateLookupPage = lazy(
  () =>
    import("@/features/eligibility-certificates/pages/PublicEligibilityCertificateLookupPage"),
);
export const CfsCertificatePage = lazy(
  () =>
    import("@/features/cfs-certificates/pages/CfsCertificatePage"),
);
export const PublicCfsCertificateLookupPage = lazy(
  () =>
    import("@/features/cfs-certificates/pages/PublicCfsCertificateLookupPage"),
);
export const ExportFoodCertificatePage = lazy(
  () =>
    import("@/features/export-food-certificates/pages/ExportFoodCertificatePage"),
);
export const PublicExportFoodCertificateLookupPage = lazy(
  () =>
    import("@/features/export-food-certificates/pages/PublicExportFoodCertificateLookupPage"),
);
export const InspectionPage = lazy(
  () => import("@/features/inspection/pages/InspectionPage"),
);
export const AlertsNewsPage = lazy(
  () => import("@/features/alerts-news/pages/AlertsNewsPage"),
);
export const FoodPoisoningPage = lazy(
  () => import("@/features/food-poisoning/pages/FoodPoisoningPage"),
);
export const ReportingPage = lazy(
  () => import("@/features/reporting/pages/ReportingPage"),
);
export const RiskAnalysisPage = lazy(
  () => import("@/features/risk-analysis/pages/RiskAnalysisPage"),
);
export const TestingResultsPage = lazy(
  () => import("@/features/testing-results/pages/TestingResultsPage"),
);
export const DocumentsPage = lazy(
  () => import("@/features/documents/pages/DocumentsPage"),
);

export function RouteLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 320,
        padding: 48,
      }}
    >
      <Spin size="large" />
    </div>
  );
}
