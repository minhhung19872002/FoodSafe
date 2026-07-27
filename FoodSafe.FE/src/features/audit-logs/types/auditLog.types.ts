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

export interface AuditLogAction {
  serviceName: string;
  methodName: string;
  parameters?: string;
  executionDuration: number;
}

export interface EntityPropertyChange {
  propertyName: string;
  originalValue?: string;
  newValue?: string;
}

export interface EntityChange {
  entityTypeFullName: string;
  entityId?: string;
  changeType: string;
  propertyChanges: EntityPropertyChange[];
}

export interface AuditLogDetail extends AuditLog {
  userId?: string;
  exceptions?: string;
  actions: AuditLogAction[];
  entityChanges: EntityChange[];
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
