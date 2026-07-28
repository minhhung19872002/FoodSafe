export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export const ALERT_CATEGORY = {
  FoodSafety: 1,
  Contamination: 2,
  Chemical: 3,
  Biological: 4,
  Physical: 5,
  Other: 6,
} as const;
export type AlertCategory =
  (typeof ALERT_CATEGORY)[keyof typeof ALERT_CATEGORY];

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  [ALERT_CATEGORY.FoodSafety]: "An toàn thực phẩm",
  [ALERT_CATEGORY.Contamination]: "Nhiễm bẩn",
  [ALERT_CATEGORY.Chemical]: "Hóa chất",
  [ALERT_CATEGORY.Biological]: "Sinh học",
  [ALERT_CATEGORY.Physical]: "Vật lý",
  [ALERT_CATEGORY.Other]: "Khác",
};

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
  [ALERT_SEVERITY.Low]: { color: "default", label: "Thấp" },
  [ALERT_SEVERITY.Medium]: { color: "blue", label: "Vừa" },
  [ALERT_SEVERITY.High]: { color: "orange", label: "Cao" },
  [ALERT_SEVERITY.Critical]: { color: "red", label: "Nghiêm trọng" },
};

export const ALERT_SOURCE = {
  Internal: 1,
  PublicReport: 2,
  ExternalSystem: 3,
} as const;
export type AlertSource = (typeof ALERT_SOURCE)[keyof typeof ALERT_SOURCE];

export const ALERT_SOURCE_LABELS: Record<AlertSource, string> = {
  [ALERT_SOURCE.Internal]: "Nội bộ",
  [ALERT_SOURCE.PublicReport]: "Từ dân",
  [ALERT_SOURCE.ExternalSystem]: "Hệ thống ngoài",
};

export const ALERT_STATUS = {
  Draft: 1,
  Published: 2,
  Recalled: 3,
} as const;
export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS];

export const ALERT_STATUS_CONFIG: Record<
  AlertStatus,
  { color: string; label: string }
> = {
  [ALERT_STATUS.Draft]: { color: "default", label: "Nháp" },
  [ALERT_STATUS.Published]: { color: "green", label: "Đã xuất bản" },
  [ALERT_STATUS.Recalled]: { color: "red", label: "Đã thu hồi" },
};

export const NEWS_STATUS = {
  Draft: 1,
  Published: 2,
  Recalled: 3,
} as const;
export type NewsStatus = (typeof NEWS_STATUS)[keyof typeof NEWS_STATUS];

export const NEWS_STATUS_CONFIG: Record<
  NewsStatus,
  { color: string; label: string }
> = {
  [NEWS_STATUS.Draft]: { color: "default", label: "Nháp" },
  [NEWS_STATUS.Published]: { color: "green", label: "Đã xuất bản" },
  [NEWS_STATUS.Recalled]: { color: "red", label: "Đã thu hồi" },
};

export interface AtpAlert {
  id: string;
  organizationId: string;
  alertNumber?: string;
  title: string;
  content: string;
  category: AlertCategory;
  severity: AlertSeverity;
  affectedArea?: string;
  affectedProducts?: string;
  businessId?: string;
  businessName?: string;
  source: AlertSource;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  status: AlertStatus;
  publishedById?: string;
  publishedAt?: string;
  recalledById?: string;
  recalledAt?: string;
  recallReason?: string;
  isPublic: boolean;
  creationTime: string;
}

export interface CreateUpdateAlertInput {
  title: string;
  content: string;
  category: AlertCategory;
  severity: AlertSeverity;
  source: AlertSource;
  alertNumber?: string;
  affectedArea?: string;
  affectedProducts?: string;
  businessId?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
}

export interface AlertFilter {
  filter?: string;
  category?: AlertCategory;
  severity?: AlertSeverity;
  source?: AlertSource;
  status?: AlertStatus;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface NewsLinkedAlert {
  id: string;
  alertId: string;
  alertTitle?: string;
}

export interface AtpNews {
  id: string;
  organizationId: string;
  title: string;
  summary?: string;
  content: string;
  thumbnailStoragePath?: string;
  category?: string;
  tags?: string;
  viewCount: number;
  status: NewsStatus;
  publishedAt?: string;
  publishedById?: string;
  recalledById?: string;
  recalledAt?: string;
  isPublic: boolean;
  isFeatured: boolean;
  source: AlertSource;
  reporterName?: string;
  reporterContact?: string;
  creationTime: string;
  linkedAlerts: NewsLinkedAlert[];
}

export interface CreateUpdateNewsInput {
  title: string;
  content: string;
  summary?: string;
  thumbnailStoragePath?: string;
  category?: string;
  tags?: string;
  isFeatured: boolean;
  linkedAlertIds: string[];
}

export interface NewsFilter {
  filter?: string;
  category?: string;
  status?: NewsStatus;
  source?: AlertSource;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

/** Chuyên mục tin tức dùng chung cho form soạn tin và bộ lọc danh sách. */
export const NEWS_CATEGORIES = [
  "Hoạt động ATTP",
  "Cảnh báo",
  "Văn bản pháp luật",
  "Tuyên truyền",
  "Phản ánh người dân",
  "Khác",
] as const;

export interface AlertOption {
  id: string;
  title: string;
  alertNumber?: string;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
