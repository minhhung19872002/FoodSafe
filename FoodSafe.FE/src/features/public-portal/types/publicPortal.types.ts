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

// ── Risk level ───────────────────────────────────────────────────────────────

export const RISK_LEVEL = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const;

export type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

export const RISK_LEVEL_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
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
}

export interface PublicProduct {
  name: string;
  code: string;
  brandName: string;
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
}
