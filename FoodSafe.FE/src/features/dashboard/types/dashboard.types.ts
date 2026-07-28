export interface DashboardStatsFilter {
  year?: number;
  organizationId?: string;
}

export interface LicenseBreakdownItem {
  category: string;
  count: number;
}

export interface RecentActivityItem {
  entityType: string;
  description: string;
  creationTime: string;
  creatorName?: string;
}

export interface DashboardFilter {
  year?: number;
  organizationId?: string;
}

export interface ReportComplianceRow {
  organizationId: string;
  organizationName: string;
  ndtpSubmittedMonths: number;
  ndtpExpectedMonths: number;
  atpWorkSubmitted: number;
  atpWorkExpected: number;
  actionMonthSubmitted: number;
  actionMonthExpected: number;
}

export interface ExpiringLicense {
  id: string;
  licenseType: string;
  licenseNumber: string;
  businessId: string;
  businessName: string;
  expiryDate: string;
  daysRemaining: number;
  /** Warning tier: 30, 60 or 90 days. */
  warningTier: number;
}

export interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalSelfDeclarations: number;
  totalProductRegistrations: number;
  totalEligibilityCertificates: number;
  totalCfsCertificates: number;
  totalExportCertificates: number;
  totalAdRegistrations: number;
  expiringWithin30Days: number;
  totalInspectionPlans: number;
  totalInspectionResults: number;
  inspectionViolationCount: number;
  totalFoodPoisoningCases: number;
  totalAlerts: number;
  totalRiskAnalyses: number;
  totalTestingResults: number;
  licenseBreakdown: LicenseBreakdownItem[];
  recentActivities: RecentActivityItem[];
}
