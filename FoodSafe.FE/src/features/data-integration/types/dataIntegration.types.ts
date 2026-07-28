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
