export const INSPECTION_PLAN_TYPE = {
  Annual: 1,
  Periodic: 2,
  Irregular: 3,
  FollowUp: 4,
} as const;

export type InspectionPlanType =
  (typeof INSPECTION_PLAN_TYPE)[keyof typeof INSPECTION_PLAN_TYPE];

export const INSPECTION_PLAN_TYPE_LABELS: Record<InspectionPlanType, string> = {
  [INSPECTION_PLAN_TYPE.Annual]: "Hàng năm",
  [INSPECTION_PLAN_TYPE.Periodic]: "Định kỳ",
  [INSPECTION_PLAN_TYPE.Irregular]: "Đột xuất",
  [INSPECTION_PLAN_TYPE.FollowUp]: "Tái kiểm tra",
};

export const INSPECTION_PLAN_STATUS = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  InProgress: 4,
  Completed: 5,
  Cancelled: 6,
} as const;

export type InspectionPlanStatus =
  (typeof INSPECTION_PLAN_STATUS)[keyof typeof INSPECTION_PLAN_STATUS];

export const INSPECTION_PLAN_STATUS_CONFIG: Record<
  InspectionPlanStatus,
  { color: string; label: string }
> = {
  [INSPECTION_PLAN_STATUS.Draft]: { color: "default", label: "Nháp" },
  [INSPECTION_PLAN_STATUS.Submitted]: { color: "blue", label: "Đã gửi" },
  [INSPECTION_PLAN_STATUS.Approved]: { color: "green", label: "Đã duyệt" },
  [INSPECTION_PLAN_STATUS.InProgress]: {
    color: "processing",
    label: "Đang thực hiện",
  },
  [INSPECTION_PLAN_STATUS.Completed]: { color: "success", label: "Hoàn thành" },
  [INSPECTION_PLAN_STATUS.Cancelled]: { color: "error", label: "Đã hủy" },
};

export const INSPECTION_PLAN_ITEM_STATUS = {
  Pending: 1,
  InProgress: 2,
  Completed: 3,
  Skipped: 4,
} as const;

export type InspectionPlanItemStatus =
  (typeof INSPECTION_PLAN_ITEM_STATUS)[keyof typeof INSPECTION_PLAN_ITEM_STATUS];

export const INSPECTION_PLAN_ITEM_STATUS_CONFIG: Record<
  InspectionPlanItemStatus,
  { color: string; label: string }
> = {
  [INSPECTION_PLAN_ITEM_STATUS.Pending]: {
    color: "default",
    label: "Chờ kiểm tra",
  },
  [INSPECTION_PLAN_ITEM_STATUS.InProgress]: {
    color: "processing",
    label: "Đang kiểm tra",
  },
  [INSPECTION_PLAN_ITEM_STATUS.Completed]: {
    color: "success",
    label: "Đã kiểm tra",
  },
  [INSPECTION_PLAN_ITEM_STATUS.Skipped]: { color: "warning", label: "Bỏ qua" },
};

export const INSPECTION_TYPE = {
  Scheduled: 1,
  Unscheduled: 2,
  FollowUp: 3,
  Emergency: 4,
} as const;

export type InspectionType =
  (typeof INSPECTION_TYPE)[keyof typeof INSPECTION_TYPE];

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  [INSPECTION_TYPE.Scheduled]: "Theo kế hoạch",
  [INSPECTION_TYPE.Unscheduled]: "Đột xuất",
  [INSPECTION_TYPE.FollowUp]: "Tái kiểm tra",
  [INSPECTION_TYPE.Emergency]: "Khẩn cấp",
};

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
  [INSPECTION_OVERALL_RESULT.Pass]: { color: "success", label: "Đạt" },
  [INSPECTION_OVERALL_RESULT.Fail]: { color: "error", label: "Không đạt" },
  [INSPECTION_OVERALL_RESULT.ConditionalPass]: {
    color: "warning",
    label: "Đạt có điều kiện",
  },
};

export const FOLLOW_UP_RESULT = {
  Passed: 1,
  StillFailed: 2,
} as const;

export type FollowUpResult =
  (typeof FOLLOW_UP_RESULT)[keyof typeof FOLLOW_UP_RESULT];

export interface InspectionPlanItem {
  id: string;
  planId: string;
  businessId: string;
  businessName?: string;
  sequenceNumber: number;
  plannedDate?: string;
  assignedInspectorId?: string;
  status: InspectionPlanItemStatus;
  notes?: string;
}

export interface InspectionPlan {
  id: string;
  organizationId: string;
  planCode: string;
  title: string;
  planType: InspectionPlanType;
  year: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  objectives?: string;
  status: InspectionPlanStatus;
  submittedById?: string;
  submittedAt?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedReason?: string;
  cancelledReason?: string;
  creationTime: string;
  totalItems: number;
  completedItems: number;
  items: InspectionPlanItem[];
}

export interface CreateUpdatePlanItemInput {
  businessId: string;
  sequenceNumber: number;
  plannedDate?: string;
  assignedInspectorId?: string;
  notes?: string;
}

export interface CreateUpdateInspectionPlanInput {
  planCode: string;
  title: string;
  planType: InspectionPlanType;
  year: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  objectives?: string;
  items: CreateUpdatePlanItemInput[];
}

export interface InspectionPlanFilter {
  filter?: string;
  planType?: InspectionPlanType;
  status?: InspectionPlanStatus;
  year?: number;
  skipCount?: number;
  maxResultCount?: number;
}

export interface InspectionViolation {
  id: string;
  inspectionResultId: string;
  violationCode?: string;
  description: string;
  regulationReference?: string;
  fineAmount?: number;
  remedyRequired?: string;
  remedyDeadline?: string;
  isRemedied: boolean;
  remediedAt?: string;
  remediedNotes?: string;
}

export interface InspectionResultInspector {
  userId: string;
  isTeamLeader: boolean;
}

export interface InspectionResult {
  id: string;
  planId?: string;
  planItemId?: string;
  businessId: string;
  businessName?: string;
  organizationId: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  teamLeader?: string;
  teamMembersText?: string;
  overallResult: InspectionOverallResult;
  hasViolation: boolean;
  violationDescription?: string;
  fineAmount?: number;
  fineCurrency: string;
  adminDecisionNumber?: string;
  adminDecisionDate?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpResultValue?: FollowUpResult;
  recommendations?: string;
  notes?: string;
  isFinalized: boolean;
  finalizedAt?: string;
  creationTime: string;
  violations: InspectionViolation[];
  inspectors: InspectionResultInspector[];
}

export interface CreateUpdateViolationInput {
  violationCode?: string;
  description: string;
  regulationReference?: string;
  fineAmount?: number;
  remedyRequired?: string;
  remedyDeadline?: string;
}

export interface InspectorInput {
  userId: string;
  isTeamLeader: boolean;
}

export interface CreateUpdateInspectionResultInput {
  businessId: string;
  planId?: string;
  planItemId?: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  teamLeader?: string;
  teamMembersText?: string;
  overallResult: InspectionOverallResult;
  hasViolation: boolean;
  violationDescription?: string;
  fineAmount?: number;
  adminDecisionNumber?: string;
  adminDecisionDate?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  recommendations?: string;
  notes?: string;
  violations: CreateUpdateViolationInput[];
  inspectors: InspectorInput[];
}

export interface InspectionResultFilter {
  filter?: string;
  businessId?: string;
  planId?: string;
  inspectionType?: InspectionType;
  overallResult?: InspectionOverallResult;
  hasViolation?: boolean;
  fromDate?: string;
  toDate?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface BusinessOption {
  id: string;
  code?: string;
  name: string;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
