export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface GeographyScopeInput {
  provinceId?: string;
  districtId?: string;
  communeId?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface GeographyScope extends GeographyScopeInput {
  id: string;
  validFrom: string;
}

export interface AdminUser {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  organizationId?: string;
  organizationName?: string;
  organizationLevel?: number;
  position?: string;
  department?: string;
  roleNames: string[];
  isActive: boolean;
  isLocked: boolean;
  lockoutEnd?: string;
  mustChangePassword: boolean;
  passwordExpiresAt?: string;
  creationTime: string;
  concurrencyStamp: string;
  geographyScopes: GeographyScope[];
}

export interface UserFilter {
  filter?: string;
  roleId?: string;
  organizationId?: string;
  isActive?: boolean;
  isLocked?: boolean;
  permissionName?: string;
  skipCount: number;
  maxResultCount: number;
  sorting?: string;
}

export interface PermissionOption {
  name: string;
  displayName: string;
  parentName?: string;
}

export interface GeneratedPassword {
  password: string;
}

export interface SaveUserInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  organizationId: string;
  position?: string;
  department?: string;
  roleNames: string[];
  geographyScopes: GeographyScopeInput[];
  concurrencyStamp?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isStatic: boolean;
  userCount: number;
  creationTime: string;
  concurrencyStamp: string;
}

export interface RoleFilter {
  filter?: string;
  isActive?: boolean;
  skipCount: number;
  maxResultCount: number;
  sorting?: string;
}

export interface SaveRoleInput {
  name: string;
  description?: string;
  isActive?: boolean;
  concurrencyStamp?: string;
}

export interface RolePermission {
  name: string;
  displayName: string;
  parentName?: string;
  isGranted: boolean;
}

export interface RolePermissionGroup {
  name: string;
  displayName: string;
  permissions: RolePermission[];
}

export interface ListResult<T> {
  items: T[];
}

export interface UserActivity {
  id: string;
  executionTime: string;
  httpMethod?: string;
  url?: string;
  httpStatusCode?: number;
  executionDuration: number;
  clientIpAddress?: string;
  correlationId?: string;
  hasException: boolean;
}
