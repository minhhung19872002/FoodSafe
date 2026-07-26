export interface AuditLog {
  id: string;
  executionTime: string;
  userName?: string;
  httpMethod?: string;
  url?: string;
  httpStatusCode?: number;
  executionDuration: number;
  clientIpAddress?: string;
  browserInfo?: string;
  correlationId?: string;
  hasException: boolean;
}

export interface AuditLogFilter {
  filter?: string;
  httpMethod?: string;
  httpStatusCode?: number;
  startTime?: string;
  endTime?: string;
  hasException?: boolean;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
