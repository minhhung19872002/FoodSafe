// ── Shared paged result ─────────────────────────────────────────────────────

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface PagedFilter {
  Keyword?: string;
  SkipCount: number;
  MaxResultCount: number;
}

export interface PublicBusinessFilter extends PagedFilter {
  BusinessTypeIds?: string[];
}

export interface PublicProductFilter extends PagedFilter {
  ProductGroupId?: string;
}

export interface PublicTestingResultFilter extends PagedFilter {
  Outcome?: TestingOutcome;
}

export interface PublicDocumentFilter extends PagedFilter {
  DocumentTypeId?: string;
}

export interface CatalogOption {
  id: string;
  name: string;
}

// ── Business status ──────────────────────────────────────────────────────────

export const BUSINESS_STATUS = {
  Active: 1,
  Inactive: 2,
  Suspended: 3,
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

export const BUSINESS_STATUS_CONFIG: Record<
  BusinessStatus,
  { color: string; label: string }
> = {
  [BUSINESS_STATUS.Active]: { color: "green", label: "Đang hoạt động" },
  [BUSINESS_STATUS.Inactive]: { color: "default", label: "Ngừng hoạt động" },
  [BUSINESS_STATUS.Suspended]: { color: "red", label: "Đình chỉ" },
};

// ── Alert severity ──────────────────────────────────────────────────────────

export const ALERT_SEVERITY = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const;

export type AlertSeverity =
  (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY];

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { color: string; label: string }
> = {
  [ALERT_SEVERITY.Low]: { color: "blue", label: "Thấp" },
  [ALERT_SEVERITY.Medium]: { color: "orange", label: "Trung bình" },
  [ALERT_SEVERITY.High]: { color: "red", label: "Cao" },
  [ALERT_SEVERITY.Critical]: { color: "purple", label: "Nghiêm trọng" },
};

export interface PublicAlertFilter extends PagedFilter {
  Categories?: AlertCategory[];
}

// ── Risk level ───────────────────────────────────────────────────────────────

export const RISK_LEVEL = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const;

export type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { color: string; label: string }
> = {
  [RISK_LEVEL.Low]: { color: "blue", label: "Thấp" },
  [RISK_LEVEL.Medium]: { color: "orange", label: "Trung bình" },
  [RISK_LEVEL.High]: { color: "red", label: "Cao" },
  [RISK_LEVEL.Critical]: { color: "purple", label: "Nghiêm trọng" },
};

// ── Alert category ───────────────────────────────────────────────────────────

export const ALERT_CATEGORY = {
  FoodSafety: 1,
  Pollution: 2,
  Chemical: 3,
  Biological: 4,
  Physical: 5,
  Other: 6,
} as const;

export type AlertCategory =
  (typeof ALERT_CATEGORY)[keyof typeof ALERT_CATEGORY];

export const ALERT_CATEGORY_CONFIG: Record<AlertCategory, { label: string }> = {
  [ALERT_CATEGORY.FoodSafety]: { label: "An toàn thực phẩm" },
  [ALERT_CATEGORY.Pollution]: { label: "Ô nhiễm" },
  [ALERT_CATEGORY.Chemical]: { label: "Hóa chất" },
  [ALERT_CATEGORY.Biological]: { label: "Sinh học" },
  [ALERT_CATEGORY.Physical]: { label: "Vật lý" },
  [ALERT_CATEGORY.Other]: { label: "Khác" },
};

// ── Entities ─────────────────────────────────────────────────────────────────

export interface PublicBusiness {
  name: string;
  code: string;
  businessTypeName: string;
  addressText: string;
  status: BusinessStatus;
  hasVsattpCommitment: boolean;
  hasEligibilityCertificate: boolean;
  // TODO: The backend GET /v1/public/businesses/search endpoint currently does not
  // return coordinates. Request BE to include addressLatitude and addressLongitude
  // in the public business search response to enable the map view on the public portal.
  addressLatitude?: number;
  addressLongitude?: number;
}

export interface PublicProduct {
  name: string;
  code: string;
  brandName: string;
  manufacturer: string | null;
  businessName: string;
  productGroupName: string;
}

export interface PublicCertificate {
  id: string;
  number: string;
  businessName: string;
  productName: string;
  issueDate: string;
  expiryDate: string;
  certifyingAuthority: string;
  statusLabel: string;
}

export interface PublicAlert {
  id: string;
  title: string;
  alertNumber: string;
  category: AlertCategory;
  severity: AlertSeverity;
  affectedArea: string;
  affectedProducts: string;
  publishedAt: string;
  content: string;
}

export const NEWS_CATEGORIES = [
  "Hoạt động ATTP",
  "Cảnh báo",
  "Văn bản pháp luật",
  "Tuyên truyền",
  "Phản ánh người dân",
  "Khác",
] as const;

export interface PublicNewsFilter extends PagedFilter {
  Categories?: string[];
}

export interface PublicNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string;
}

export interface PublicNewsDetail extends PublicNewsItem {
  content: string;
  linkedAlerts: PublicAlert[];
}

export interface PublicRiskAnalysisFilter extends PagedFilter {
  Categories?: AlertCategory[];
}

export interface PublicRiskAnalysis {
  id: string;
  title: string;
  category: string;
  riskLevel: RiskLevel;
  relatedProducts: string;
  recommendations: string;
  publishedAt: string;
  content: string;
}

export interface PublicWarnedBusiness {
  businessName: string;
  businessCode: string;
  addressText: string;
  alertTitle: string;
  alertNumber: string;
  severity: AlertSeverity;
  publishedAt: string;
  content: string;
}

export interface PublicDocument {
  documentNumber: string;
  title: string;
  documentTypeName: string;
  issuingAuthority: string;
  issuedDate: string;
  effectiveDate: string;
  summary: string;
}

// ── Testing result outcome ───────────────────────────────────────────────────

export const TESTING_OUTCOME = {
  Pass: 1,
  Fail: 2,
  Conditional: 3,
} as const;

export type TestingOutcome =
  (typeof TESTING_OUTCOME)[keyof typeof TESTING_OUTCOME];

export const TESTING_OUTCOME_CONFIG: Record<
  TestingOutcome,
  { color: string; label: string }
> = {
  [TESTING_OUTCOME.Pass]: { color: "green", label: "Đạt" },
  [TESTING_OUTCOME.Fail]: { color: "red", label: "Không đạt" },
  [TESTING_OUTCOME.Conditional]: { color: "orange", label: "Đạt có điều kiện" },
};

// ── Inspection type ──────────────────────────────────────────────────────────

export const INSPECTION_TYPE = {
  Scheduled: 1,
  Unscheduled: 2,
  FollowUp: 3,
  Emergency: 4,
} as const;

export type InspectionType =
  (typeof INSPECTION_TYPE)[keyof typeof INSPECTION_TYPE];

export const INSPECTION_TYPE_CONFIG: Record<InspectionType, { label: string }> =
  {
    [INSPECTION_TYPE.Scheduled]: { label: "Theo kế hoạch" },
    [INSPECTION_TYPE.Unscheduled]: { label: "Đột xuất" },
    [INSPECTION_TYPE.FollowUp]: { label: "Kiểm tra lại" },
    [INSPECTION_TYPE.Emergency]: { label: "Khẩn cấp" },
  };

// ── Inspection overall result ─────────────────────────────────────────────────

export const INSPECTION_OVERALL_RESULT = {
  Pass: 1,
  Fail: 2,
  ConditionalPass: 3,
} as const;

export type InspectionOverallResult =
  (typeof INSPECTION_OVERALL_RESULT)[keyof typeof INSPECTION_OVERALL_RESULT];

export const INSPECTION_OVERALL_RESULT_CONFIG: Record<
  InspectionOverallResult,
  { color: string; label: string }
> = {
  [INSPECTION_OVERALL_RESULT.Pass]: { color: "green", label: "Đạt" },
  [INSPECTION_OVERALL_RESULT.Fail]: { color: "red", label: "Không đạt" },
  [INSPECTION_OVERALL_RESULT.ConditionalPass]: {
    color: "orange",
    label: "Đạt có điều kiện",
  },
};

// ── Testing & Inspection results ─────────────────────────────────────────────

export interface PublicTestingResult {
  id: string;
  sampleCode: string;
  sampleName: string;
  businessName: string | null;
  testingCenterName: string | null;
  sampleDate: string;
  resultDate: string | null;
  outcome: TestingOutcome;
  hasFailedIndicators: boolean;
}

export interface PublicInspectionResult {
  id: string;
  businessName: string;
  businessAddress: string | null;
  inspectionDate: string;
  inspectionType: InspectionType;
  overallResult: InspectionOverallResult;
  hasViolation: boolean;
}

// ── Alert report submission ──────────────────────────────────────────────────

export interface AlertReportInput {
  title: string;
  content: string;
  category: AlertCategory;
  affectedArea?: string;
  affectedProducts?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  captchaToken: string;
}

export interface AlertReportResult {
  id: string;
  message: string;
  /** Opaque tracking code (format: FD-XXXXXX). Present for citizen reports. */
  trackingCode?: string | null;
}

// ── Citizen report tracking ──────────────────────────────────────────────────

/** One of: Submitted | UnderReview | Resolved | Rejected */
export type CitizenReportTrackingStatus =
  "Submitted" | "UnderReview" | "Resolved" | "Rejected";

export interface CitizenReportStatus {
  trackingCode: string;
  submittedAt: string;
  status: CitizenReportTrackingStatus;
  updatedAt: string;
}

export const CITIZEN_REPORT_STATUS_CONFIG: Record<
  CitizenReportTrackingStatus,
  { color: string; label: string }
> = {
  Submitted: { color: "blue", label: "Đã tiếp nhận" },
  UnderReview: { color: "orange", label: "Đang xem xét" },
  Resolved: { color: "green", label: "Đã xử lý" },
  Rejected: { color: "red", label: "Không được chấp nhận" },
};
