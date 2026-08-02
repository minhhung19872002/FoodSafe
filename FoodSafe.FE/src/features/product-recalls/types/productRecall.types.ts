export const RECALL_TYPE = {
  Voluntary: 1,
  Mandatory: 2,
} as const;

export type RecallType = (typeof RECALL_TYPE)[keyof typeof RECALL_TYPE];

export const POST_RECALL_ACTION = {
  FixLabeling: 1,
  RepurposeUse: 2,
  ReExport: 3,
  Destroy: 4,
} as const;

export type PostRecallAction =
  (typeof POST_RECALL_ACTION)[keyof typeof POST_RECALL_ACTION];

export const PRODUCT_RECALL_STATUS = {
  Draft: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4,
} as const;

export type ProductRecallStatus =
  (typeof PRODUCT_RECALL_STATUS)[keyof typeof PRODUCT_RECALL_STATUS];

export const RECALL_TYPE_CONFIG: Record<
  RecallType,
  { color: string; label: string }
> = {
  [RECALL_TYPE.Voluntary]: { color: "blue", label: "Tự nguyện" },
  [RECALL_TYPE.Mandatory]: { color: "red", label: "Bắt buộc" },
};

export const RECALL_STATUS_CONFIG: Record<
  ProductRecallStatus,
  { color: string; label: string }
> = {
  [PRODUCT_RECALL_STATUS.Draft]: { color: "default", label: "Nháp" },
  [PRODUCT_RECALL_STATUS.InProgress]: {
    color: "processing",
    label: "Đang thu hồi",
  },
  [PRODUCT_RECALL_STATUS.Completed]: { color: "green", label: "Hoàn thành" },
  [PRODUCT_RECALL_STATUS.Cancelled]: { color: "orange", label: "Đã hủy" },
};

export const RECALL_TYPE_OPTIONS: ReadonlyArray<{
  value: RecallType;
  label: string;
}> = (Object.keys(RECALL_TYPE_CONFIG).map(Number) as RecallType[]).map(
  (value) => ({ value, label: RECALL_TYPE_CONFIG[value].label }),
);

export const RECALL_STATUS_OPTIONS: ReadonlyArray<{
  value: ProductRecallStatus;
  label: string;
}> = (
  Object.keys(RECALL_STATUS_CONFIG).map(Number) as ProductRecallStatus[]
).map((value) => ({ value, label: RECALL_STATUS_CONFIG[value].label }));

export const POST_RECALL_ACTION_LABELS: Record<PostRecallAction, string> = {
  [POST_RECALL_ACTION.FixLabeling]: "Khắc phục lỗi ghi nhãn",
  [POST_RECALL_ACTION.RepurposeUse]: "Chuyển mục đích sử dụng",
  [POST_RECALL_ACTION.ReExport]: "Tái xuất",
  [POST_RECALL_ACTION.Destroy]: "Tiêu hủy",
};

export const POST_RECALL_ACTION_OPTIONS: ReadonlyArray<{
  value: PostRecallAction;
  label: string;
}> = (
  Object.keys(POST_RECALL_ACTION_LABELS).map(Number) as PostRecallAction[]
).map((value) => ({ value, label: POST_RECALL_ACTION_LABELS[value] }));

export interface ProductRecall {
  id: string;
  organizationId: string;
  businessId: string;
  businessName: string;
  productId?: string;
  productName: string;
  batchInfo?: string;
  recallType: RecallType;
  reason: string;
  decisionNumber?: string;
  decisionDate?: string;
  startDate: string;
  completedDate?: string;
  quantityRecalled?: number;
  quantityUnit?: string;
  postRecallAction?: PostRecallAction;
  actionDescription?: string;
  status: ProductRecallStatus;
  cancelReason?: string;
}

export interface ProductRecallInput {
  businessId: string;
  productId?: string;
  productName: string;
  batchInfo?: string;
  recallType: RecallType;
  reason: string;
  decisionNumber?: string;
  decisionDate?: string;
  startDate: string;
  quantityRecalled?: number;
  quantityUnit?: string;
}

export interface CompleteRecallInput {
  postRecallAction: PostRecallAction;
  completedDate: string;
  actionDescription?: string;
}

export interface ProductRecallFilter {
  filter?: string;
  businessId?: string;
  recallType?: RecallType;
  status?: ProductRecallStatus;
  sorting?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface BusinessOption {
  id: string;
  code?: string;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
