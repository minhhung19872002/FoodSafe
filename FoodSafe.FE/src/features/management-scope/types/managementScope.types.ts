/** Mirrors ManagementScopeType enum from BE (DataScopeTypes.cs) */
export const MANAGEMENT_SCOPE_TYPE = {
  Geography: 1,
  Business: 2,
  BusinessType: 3,
  ProductGroup: 4,
} as const;

export type ManagementScopeType =
  (typeof MANAGEMENT_SCOPE_TYPE)[keyof typeof MANAGEMENT_SCOPE_TYPE];

export interface DataScopeAssignment {
  id: string;
  scopeType: ManagementScopeType;
  granteeUserId?: string;
  granteeUserName?: string;
  businessId?: string;
  businessTypeId?: string;
  productGroupId?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  validFrom: string;
  validTo?: string;
}

export interface DataScopeAssignmentListInput {
  scopeType: ManagementScopeType;
  businessId?: string;
  businessTypeId?: string;
  productGroupId?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface CreateDataScopeAssignmentInput {
  scopeType: ManagementScopeType;
  granteeUserId?: string;
  businessId?: string;
  businessTypeId?: string;
  productGroupId?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
