export const REPORT_STATUS = {
  Draft: 1,
  Submitted: 2,
  Verified: 3,
  Returned: 4,
  Completed: 5,
} as const;
export type ReportStatus =
  (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const REPORT_STATUS_CONFIG: Record<
  ReportStatus,
  { color: string; label: string }
> = {
  [REPORT_STATUS.Draft]: { color: "default", label: "Nháp" },
  [REPORT_STATUS.Submitted]: { color: "blue", label: "Đã gửi" },
  [REPORT_STATUS.Verified]: { color: "green", label: "Đã xác minh" },
  [REPORT_STATUS.Returned]: { color: "orange", label: "Trả lại" },
  [REPORT_STATUS.Completed]: { color: "purple", label: "Hoàn thành" },
};

export const REPORT_PERIOD_TYPE = {
  HalfYear: 1,
  FullYear: 2,
} as const;
export type ReportPeriodType =
  (typeof REPORT_PERIOD_TYPE)[keyof typeof REPORT_PERIOD_TYPE];

export const REPORT_PERIOD_TYPE_CONFIG: Record<
  ReportPeriodType,
  { label: string }
> = {
  [REPORT_PERIOD_TYPE.HalfYear]: { label: "6 tháng" },
  [REPORT_PERIOD_TYPE.FullYear]: { label: "Cả năm" },
};

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

interface BaseReportFields {
  id: string;
  organizationId: string;
  status: ReportStatus;
  submissionVersion: number;
  submittedById: string | null;
  submittedAt: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  returnedById: string | null;
  returnedAt: string | null;
  returnReason: string | null;
  completedById: string | null;
  completedAt: string | null;
  notes: string | null;
  creationTime: string;
}

export interface NdtpReport extends BaseReportFields {
  periodYear: number;
  periodMonth: number;
  caseCount: number;
  caseAffected: number;
  caseHospitalized: number;
  caseDeaths: number;
  incidentCount: number;
  incidentAffected: number;
  incidentHospitalized: number;
  incidentDeaths: number;
  preventionActivities: string | null;
  riskFactors: string | null;
  recommendations: string | null;
}

export interface AtpWorkReport extends BaseReportFields {
  periodType: ReportPeriodType;
  periodYear: number;
  periodHalf: number | null;
  totalBusinesses: number;
  newBusinesses: number;
  inactiveBusinesses: number;
  businessesWithCertificate: number;
  dkcbIssued: number;
  selfDeclarationsReceived: number;
  adRegistrationsIssued: number;
  eligibilityCertificatesIssued: number;
  cfsIssued: number;
  exportCertificatesIssued: number;
  totalInspectionPlans: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineTotalAmount: number;
  poisoningCaseCount: number;
  poisoningIncidentCount: number;
  totalAffected: number;
  totalDeaths: number;
  trainingSessions: number;
  trainingParticipants: number;
  mediaAppearances: number;
  documentsIssued: number;
  overview: string | null;
  achievements: string | null;
  limitations: string | null;
  solutions: string | null;
  nextPeriodPlan: string | null;
}

export interface ActionMonthReport extends BaseReportFields {
  periodYear: number;
  actionMonthTheme: string | null;
  actionMonthDates: string | null;
  mediaArticles: number;
  broadcastPrograms: number;
  propagandaSessions: number;
  participants: number;
  postersDistributed: number;
  leafletsDistributed: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineAmount: number;
  newSelfDeclarations: number;
  achievements: string | null;
  limitations: string | null;
  lessonsLearned: string | null;
  nextSteps: string | null;
}

export interface CreateNdtpReportInput {
  periodYear: number;
  periodMonth: number;
  notes?: string;
}

export interface UpdateNdtpReportStatsInput {
  caseCount: number;
  caseAffected: number;
  caseHospitalized: number;
  caseDeaths: number;
  incidentCount: number;
  incidentAffected: number;
  incidentHospitalized: number;
  incidentDeaths: number;
}

export interface UpdateNdtpReportNarrativeInput {
  preventionActivities?: string;
  riskFactors?: string;
  recommendations?: string;
  notes?: string;
}

export interface CreateAtpWorkReportInput {
  periodType: ReportPeriodType;
  periodYear: number;
  periodHalf?: number;
  notes?: string;
}

export interface UpdateAtpWorkReportStatsInput {
  totalBusinesses: number;
  newBusinesses: number;
  inactiveBusinesses: number;
  businessesWithCertificate: number;
  dkcbIssued: number;
  selfDeclarationsReceived: number;
  adRegistrationsIssued: number;
  eligibilityCertificatesIssued: number;
  cfsIssued: number;
  exportCertificatesIssued: number;
  totalInspectionPlans: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineTotalAmount: number;
  poisoningCaseCount: number;
  poisoningIncidentCount: number;
  totalAffected: number;
  totalDeaths: number;
  trainingSessions: number;
  trainingParticipants: number;
  mediaAppearances: number;
  documentsIssued: number;
}

export interface UpdateAtpWorkReportNarrativeInput {
  overview?: string;
  achievements?: string;
  limitations?: string;
  solutions?: string;
  nextPeriodPlan?: string;
  notes?: string;
}

export interface CreateActionMonthReportInput {
  periodYear: number;
  actionMonthTheme?: string;
  actionMonthDates?: string;
  notes?: string;
}

export interface UpdateActionMonthReportStatsInput {
  mediaArticles: number;
  broadcastPrograms: number;
  propagandaSessions: number;
  participants: number;
  postersDistributed: number;
  leafletsDistributed: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineAmount: number;
  newSelfDeclarations: number;
}

export interface UpdateActionMonthReportNarrativeInput {
  actionMonthTheme?: string;
  actionMonthDates?: string;
  achievements?: string;
  limitations?: string;
  lessonsLearned?: string;
  nextSteps?: string;
  notes?: string;
}

export interface ReturnReportInput {
  returnReason: string;
}

export interface NdtpReportFilter {
  filter?: string;
  status?: ReportStatus;
  periodYear?: number;
  periodMonth?: number;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface AtpWorkReportFilter {
  filter?: string;
  status?: ReportStatus;
  periodType?: ReportPeriodType;
  periodYear?: number;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface ActionMonthReportFilter {
  filter?: string;
  status?: ReportStatus;
  periodYear?: number;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export const REPORT_ERROR_NOTIFICATION_STATUS = {
  Pending: 1,
  Acknowledged: 2,
  Corrected: 3,
} as const;
export type ReportErrorNotificationStatus =
  (typeof REPORT_ERROR_NOTIFICATION_STATUS)[keyof typeof REPORT_ERROR_NOTIFICATION_STATUS];

export const REPORT_ERROR_NOTIFICATION_STATUS_CONFIG: Record<
  ReportErrorNotificationStatus,
  { color: string; label: string }
> = {
  [REPORT_ERROR_NOTIFICATION_STATUS.Pending]: {
    color: "gold",
    label: "Chờ xử lý",
  },
  [REPORT_ERROR_NOTIFICATION_STATUS.Acknowledged]: {
    color: "blue",
    label: "Đã tiếp nhận",
  },
  [REPORT_ERROR_NOTIFICATION_STATUS.Corrected]: {
    color: "green",
    label: "Đã phản hồi",
  },
};

export interface ReportErrorNotification {
  id: string;
  fromOrganizationId: string;
  errorFields: string;
  correctionDetails: string;
  status: ReportErrorNotificationStatus;
  response: string | null;
  respondedAt: string | null;
  respondedById: string | null;
  creationTime: string;
}

export interface CreateReportErrorNotificationInput {
  errorFields: string;
  correctionDetails: string;
}

export interface RespondReportErrorNotificationInput {
  response: string;
}
