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
  serviceName?: string;
  methodName?: string;
  parameters?: string;
  executionTime: string;
  executionDuration: number;
}

export interface AuditLogPropertyChange {
  propertyName: string;
  propertyTypeFullName?: string;
  originalValue?: string;
  newValue?: string;
}

export interface AuditLogEntityChange {
  entityTypeFullName?: string;
  entityId?: string;
  changeType: string;
  changeTime: string;
  propertyChanges: AuditLogPropertyChange[];
}

export interface AuditLogDetail extends AuditLog {
  applicationName?: string;
  exceptions?: string;
  comments?: string;
  actions: AuditLogAction[];
  entityChanges: AuditLogEntityChange[];
}

export interface AuditLogFilter {
  filter?: string;
  userName?: string;
  httpMethod?: string;
  httpStatusCode?: number;
  startTime?: string;
  endTime?: string;
  hasException?: boolean;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
