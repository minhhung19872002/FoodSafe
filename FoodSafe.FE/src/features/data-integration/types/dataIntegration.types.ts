export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export const API_CALL_DIRECTION = {
  Inbound: 1,
  Outbound: 2,
} as const;
export type ApiCallDirection =
  (typeof API_CALL_DIRECTION)[keyof typeof API_CALL_DIRECTION];

export const API_CALL_DIRECTION_CONFIG: Record<
  ApiCallDirection,
  { color: string; label: string }
> = {
  [API_CALL_DIRECTION.Inbound]: { color: "blue", label: "Nhận" },
  [API_CALL_DIRECTION.Outbound]: { color: "green", label: "Gửi" },
};

export const API_ENDPOINT_STATUS = {
  Active: 1,
  Inactive: 2,
} as const;
export type ApiEndpointStatus =
  (typeof API_ENDPOINT_STATUS)[keyof typeof API_ENDPOINT_STATUS];

export const API_ENDPOINT_STATUS_CONFIG: Record<
  ApiEndpointStatus,
  { color: string; label: string }
> = {
  [API_ENDPOINT_STATUS.Active]: { color: "green", label: "Hoạt động" },
  [API_ENDPOINT_STATUS.Inactive]: { color: "default", label: "Ngừng" },
};

export const API_AUTH_TYPE = {
  None: 1,
  ApiKey: 2,
  BearerToken: 3,
  BasicAuth: 4,
} as const;
export type ApiAuthType = (typeof API_AUTH_TYPE)[keyof typeof API_AUTH_TYPE];

export const API_AUTH_TYPE_LABELS: Record<ApiAuthType, string> = {
  [API_AUTH_TYPE.None]: "Không xác thực",
  [API_AUTH_TYPE.ApiKey]: "API Key",
  [API_AUTH_TYPE.BearerToken]: "Bearer Token",
  [API_AUTH_TYPE.BasicAuth]: "Basic Auth",
};

export interface ApiEndpoint {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  httpMethod: string;
  externalSystem: string;
  description?: string;
  authType: ApiAuthType;
  status: ApiEndpointStatus;
  hasCredential: boolean;
  creationTime: string;
}

export interface CreateUpdateApiEndpoint {
  name: string;
  url: string;
  httpMethod: string;
  externalSystem: string;
  description?: string;
  authType: ApiAuthType;
  /** Write-only outbound-auth secret; leave undefined to keep the stored value. */
  credential?: string;
  /** Set true on update to remove the stored credential. */
  clearCredential?: boolean;
}

export interface ApiEndpointFilter {
  filter?: string;
  externalSystem?: string;
  status?: ApiEndpointStatus;
  skipCount: number;
  maxResultCount: number;
}

export const SHARED_DATA_TYPE = {
  Other: 0,
  Alert: 1,
  InspectionResult: 2,
  FoodPoisoning: 3,
  License: 4,
  Product: 5,
  News: 6,
  Business: 7,
} as const;
export type SharedDataType =
  (typeof SHARED_DATA_TYPE)[keyof typeof SHARED_DATA_TYPE];

export const SHARED_DATA_TYPE_LABELS: Record<SharedDataType, string> = {
  [SHARED_DATA_TYPE.Other]: "Khác",
  [SHARED_DATA_TYPE.Alert]: "Cảnh báo ATTP",
  [SHARED_DATA_TYPE.InspectionResult]: "Kết quả thanh kiểm tra",
  [SHARED_DATA_TYPE.FoodPoisoning]: "Ngộ độc thực phẩm",
  [SHARED_DATA_TYPE.License]: "Giấy phép",
  [SHARED_DATA_TYPE.Product]: "Sản phẩm, thực phẩm",
  [SHARED_DATA_TYPE.News]: "Tin tức, hoạt động",
  [SHARED_DATA_TYPE.Business]: "Cơ sở SXKD",
};

export interface ShareDataInput {
  endpointId: string;
  dataType: SharedDataType;
  entityId?: string;
  note?: string;
}

export interface TestConnectionResult {
  isSuccess: boolean;
  statusCode?: number;
  durationMs: number;
  errorMessage?: string;
}

export interface ShareDataResult {
  logId: string;
  isSuccess: boolean;
  statusCode?: number;
  errorMessage?: string;
}

export interface ApiCallLog {
  id: string;
  organizationId: string;
  direction: ApiCallDirection;
  externalSystemName: string;
  endpointUrl: string;
  httpMethod: string;
  responseStatusCode?: number;
  calledAt: string;
  durationMs: number;
  isSuccess: boolean;
  errorMessage?: string;
  dataType: SharedDataType;
  creationTime: string;
  endpointId?: string;
  /** Id of the envelope's original attempt; absent on the original itself. */
  correlationId?: string;
  attemptNumber: number;
}

export interface ApiCallLogDetail extends ApiCallLog {
  requestHeaders?: string;
  requestBody?: string;
  responseBody?: string;
  payloadChecksum?: string;
}

export interface ApiCallLogFilter {
  filter?: string;
  direction?: ApiCallDirection;
  externalSystem?: string;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
  dataType?: SharedDataType;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export const PARTNER_ACCOUNT_STATUS = {
  Active: 1,
  Suspended: 2,
} as const;
export type PartnerAccountStatus =
  (typeof PARTNER_ACCOUNT_STATUS)[keyof typeof PARTNER_ACCOUNT_STATUS];

export const PARTNER_ACCOUNT_STATUS_CONFIG: Record<
  PartnerAccountStatus,
  { color: string; label: string }
> = {
  [PARTNER_ACCOUNT_STATUS.Active]: { color: "green", label: "Hoạt động" },
  [PARTNER_ACCOUNT_STATUS.Suspended]: { color: "default", label: "Tạm ngưng" },
};

export const INBOUND_SUBMISSION_STATUS = {
  Received: 1,
  Processed: 2,
  Rejected: 3,
} as const;
export type InboundSubmissionStatus =
  (typeof INBOUND_SUBMISSION_STATUS)[keyof typeof INBOUND_SUBMISSION_STATUS];

export const INBOUND_SUBMISSION_STATUS_CONFIG: Record<
  InboundSubmissionStatus,
  { color: string; label: string }
> = {
  [INBOUND_SUBMISSION_STATUS.Received]: { color: "blue", label: "Đã nhận" },
  [INBOUND_SUBMISSION_STATUS.Processed]: { color: "green", label: "Đã xử lý" },
  [INBOUND_SUBMISSION_STATUS.Rejected]: { color: "red", label: "Từ chối" },
};

export interface PartnerAccount {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  externalSystem: string;
  description?: string;
  status: PartnerAccountStatus;
  allowedDataTypes: SharedDataType[];
  activeKeyCount: number;
  creationTime: string;
}

export interface CreatePartnerAccount {
  code: string;
  name: string;
  externalSystem: string;
  allowedDataTypes: SharedDataType[];
  description?: string;
}

export type UpdatePartnerAccount = Omit<CreatePartnerAccount, "code">;

export interface PartnerAccountFilter {
  filter?: string;
  status?: PartnerAccountStatus;
  skipCount: number;
  maxResultCount: number;
}

export interface PartnerApiKey {
  id: string;
  partnerAccountId: string;
  keyPrefix: string;
  description?: string;
  expiresAt?: string;
  revokedAt?: string;
  lastUsedAt?: string;
  creationTime: string;
}

/** The raw key appears exactly once, in the issuance response. */
export interface IssuedPartnerApiKey extends PartnerApiKey {
  rawKey: string;
}

export interface IssuePartnerApiKeyInput {
  expiresAt?: string;
  description?: string;
}

export interface InboundSubmission {
  id: string;
  partnerAccountId: string;
  partnerName: string;
  organizationId: string;
  dataType: SharedDataType;
  schemaVersion: string;
  requestId: string;
  correlationId?: string;
  recordCount: number;
  receivedAt: string;
  status: InboundSubmissionStatus;
  rejectReason?: string;
}

export interface InboundSubmissionDetail extends InboundSubmission {
  payload: string;
}

export interface InboundSubmissionFilter {
  partnerAccountId?: string;
  dataType?: SharedDataType;
  status?: InboundSubmissionStatus;
  fromDate?: string;
  toDate?: string;
  skipCount: number;
  maxResultCount: number;
}

export const API_SPEC_FORMAT = {
  Json: 1,
  Yaml: 2,
} as const;
export type ApiSpecFormat =
  (typeof API_SPEC_FORMAT)[keyof typeof API_SPEC_FORMAT];

export const API_SPEC_FORMAT_CONFIG: Record<
  ApiSpecFormat,
  { color: string; label: string }
> = {
  [API_SPEC_FORMAT.Json]: { color: "geekblue", label: "JSON" },
  [API_SPEC_FORMAT.Yaml]: { color: "purple", label: "YAML" },
};

/** One stored, immutable version of a named partner API specification (FR-50-05). */
export interface ApiSpecification {
  id: string;
  organizationId: string;
  name: string;
  versionNumber: number;
  title: string;
  /** The API's own version, e.g. "1.2.0" (parsed info.version). */
  specVersion: string;
  /** Declared OpenAPI/Swagger version, e.g. "3.0.3". */
  openApiVersion: string;
  format: ApiSpecFormat;
  sizeBytes: number;
  checksum: string;
  description?: string;
  isPublished: boolean;
  publishedAt?: string;
  creationTime: string;
}

export interface UploadApiSpecificationInput {
  name: string;
  /** Raw OpenAPI 2.0/3.0 document (JSON or YAML); validated server-side. */
  content: string;
  description?: string;
}

export interface UpdateApiSpecMetadataInput {
  description?: string;
}

export interface ApiSpecificationFilter {
  filter?: string;
  name?: string;
  isPublished?: boolean;
  skipCount: number;
  maxResultCount: number;
}

/** The raw document body plus the headers needed to save it as a file. */
export interface ApiSpecificationDownload {
  content: string;
  format: ApiSpecFormat;
  fileName: string;
  contentType: string;
}
