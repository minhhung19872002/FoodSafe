export interface CategoryCount {
  name: string;
  count: number;
}

export interface MonthlyCount {
  year: number;
  month: number;
  label: string;
  count: number;
}

export interface StatisticsDto {
  businessByStatus: CategoryCount[];
  businessByType: CategoryCount[];
  productByGroup: CategoryCount[];
  licenseByCategory: CategoryCount[];
  licenseByStatus: CategoryCount[];
  inspectionsByMonth: MonthlyCount[];
  violationsByMonth: MonthlyCount[];
  poisoningCasesByMonth: MonthlyCount[];
  inspectionOutcome: CategoryCount[];
}

export interface StatisticsFilter {
  year?: number;
  month?: number;
  quarter?: number;
  organizationId?: string;
}

export interface LicensesByBusinessTypeRow {
  businessTypeName: string;
  selfDeclarations: number;
  productRegistrations: number;
  eligibilityCertificates: number;
  cfsCertificates: number;
  exportCertificates: number;
  adRegistrations: number;
  total: number;
}

export interface PoisoningByAreaRow {
  areaName: string;
  caseCount: number;
  hospitalizedCount: number;
  deceasedCount: number;
}

export interface InspectionSummaryRow {
  organizationName: string;
  planCount: number;
  inspectionCount: number;
  violationCount: number;
  sanctionCount: number;
}

export interface BusinessBreakdownRow {
  groupName: string;
  count: number;
}

export interface ReportStatisticsDto {
  licensesByBusinessType: LicensesByBusinessTypeRow[];
  poisoningByArea: PoisoningByAreaRow[];
  inspectionByOrganization: InspectionSummaryRow[];
  businessesByType: BusinessBreakdownRow[];
  businessesByRegion: BusinessBreakdownRow[];
  businessesByProvince: BusinessBreakdownRow[];
  businessesByOrganization: BusinessBreakdownRow[];
}

export type ReportExportKind =
  | "licenses-by-business-type"
  | "poisoning-by-area"
  | "inspection-summary"
  | "business-breakdown";
