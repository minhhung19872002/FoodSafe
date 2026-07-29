import type { AlertCategory } from "@/features/alerts-news/types/alertsNews.types";

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

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
  [RISK_LEVEL.Low]: { color: "green", label: "Thấp" },
  [RISK_LEVEL.Medium]: { color: "gold", label: "Vừa" },
  [RISK_LEVEL.High]: { color: "orange", label: "Cao" },
  [RISK_LEVEL.Critical]: { color: "red", label: "Nghiêm trọng" },
};

export const RISK_ANALYSIS_STATUS = {
  Draft: 1,
  Published: 2,
} as const;
export type RiskAnalysisStatus =
  (typeof RISK_ANALYSIS_STATUS)[keyof typeof RISK_ANALYSIS_STATUS];

export const RISK_ANALYSIS_STATUS_CONFIG: Record<
  RiskAnalysisStatus,
  { color: string; label: string }
> = {
  [RISK_ANALYSIS_STATUS.Draft]: { color: "default", label: "Nháp" },
  [RISK_ANALYSIS_STATUS.Published]: { color: "green", label: "Đã xuất bản" },
};

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface RiskAnalysis {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: AlertCategory;
  riskLevel: RiskLevel;
  productGroupIds: string[];
  productGroupNames: string[];
  relatedProducts: string | null;
  evidence: string | null;
  recommendations: string | null;
  status: RiskAnalysisStatus;
  isPublic: boolean;
  publishedById: string | null;
  publishedAt: string | null;
  creationTime: string;
}

export interface CreateUpdateRiskAnalysisInput {
  title: string;
  content: string;
  category: AlertCategory;
  riskLevel: RiskLevel;
  productGroupIds: string[];
  relatedProducts?: string;
  evidence?: string;
  recommendations?: string;
}

export interface RiskAnalysisFilter {
  filter?: string;
  category?: AlertCategory;
  riskLevel?: RiskLevel;
  status?: RiskAnalysisStatus;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}
