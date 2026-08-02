/**
 * Nguồn sự thật DUY NHẤT cho quyền truy cập từng trang.
 *
 * `router.tsx` (PermissionRoute) và `AppLayout.tsx` (menu) trước đây tự khai
 * báo danh sách quyền riêng và đã lệch nhau ba lần: menu Ngộ độc hiện với
 * Incidents.View nhưng route chỉ nhận Cases.View; menu Báo cáo hiện với
 * AtpWork/ActionMonth nhưng route chỉ nhận NdtpReports; route Tích hợp dữ
 * liệu nhận Partners.View nhưng menu thì không (UIA-006). Người dùng hoặc bị
 * dẫn vào trang 403, hoặc không thấy trang mình có quyền dùng.
 *
 * Quy ước: giá trị là DANH SÁCH quyền — người dùng có BẤT KỲ quyền nào trong
 * danh sách thì thấy menu và vào được trang. Trang nhiều tab tự ẩn tab mà
 * người dùng thiếu quyền xem.
 */
export const ROUTE_PERMISSIONS = {
  organizations: ["FoodSafe.Organizations.View"],
  geography: ["FoodSafe.GeographicCatalogs.View"],
  businesses: [
    "FoodSafe.BusinessManagement.Businesses.View",
    "FoodSafe.BusinessManagement.Products.View",
  ],
  selfDeclarations: ["FoodSafe.BusinessManagement.SelfDeclarations.View"],
  productRegistrations: ["FoodSafe.Licensing.ProductRegistrations.View"],
  adRegistrations: ["FoodSafe.Licensing.AdRegistrations.View"],
  eligibilityCertificates: ["FoodSafe.Licensing.EligibilityCertificates.View"],
  vsattpCommitments: ["FoodSafe.Licensing.VsattpCommitments.View"],
  cfsCertificates: ["FoodSafe.Licensing.CfsCertificates.View"],
  exportCertificates: ["FoodSafe.Licensing.ExportCertificates.View"],
  productRecalls: ["FoodSafe.ProductRecalls.View"],
  inspection: [
    "FoodSafe.Inspection.Plans.View",
    "FoodSafe.Inspection.Results.View",
  ],
  foodPoisoning: [
    "FoodSafe.FoodPoisoning.Cases.View",
    "FoodSafe.FoodPoisoning.Incidents.View",
  ],
  alertsNews: [
    "FoodSafe.AlertsAndTesting.Alerts.View",
    "FoodSafe.AlertsAndTesting.News.View",
  ],
  riskAnalysis: ["FoodSafe.AlertsAndTesting.RiskAnalyses.View"],
  testingResults: ["FoodSafe.AlertsAndTesting.TestingResults.View"],
  documents: ["FoodSafe.AlertsAndTesting.Documents.View"],
  reporting: [
    "FoodSafe.Reporting.NdtpReports.View",
    "FoodSafe.Reporting.AtpWorkReports.View",
    "FoodSafe.Reporting.ActionMonthReports.View",
  ],
  dataIntegration: [
    "FoodSafe.DataIntegration.ApiEndpoints.View",
    "FoodSafe.DataIntegration.CallHistory.View",
    "FoodSafe.DataIntegration.Partners.View",
    "FoodSafe.DataIntegration.ApiSpecs.View",
  ],
  catalogs: ["FoodSafe.Catalogs.View"],
  identity: ["FoodSafe.SystemAdmin"],
  auditLogs: ["FoodSafe.SystemAdmin.AuditLogs"],
  settings: ["FoodSafe.SystemAdmin.Settings"],
} as const;

export type RoutePermissionKey = keyof typeof ROUTE_PERMISSIONS;
