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
export type ApiAuthType =
  (typeof API_AUTH_TYPE)[keyof typeof API_AUTH_TYPE];

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
  creationTime: string;
}

export interface CreateUpdateApiEndpoint {
  name: string;
  url: string;
  httpMethod: string;
  externalSystem: string;
  description?: string;
  authType: ApiAuthType;
}

export interface ApiEndpointFilter {
  filter?: string;
  externalSystem?: string;
  status?: ApiEndpointStatus;
  skipCount: number;
  maxResultCount: number;
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
  creationTime: string;
}

export interface ApiCallLogDetail extends ApiCallLog {
  requestHeaders?: string;
  requestBody?: string;
  responseBody?: string;
}

export interface ApiCallLogFilter {
  filter?: string;
  direction?: ApiCallDirection;
  externalSystem?: string;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
