export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

/**
 * Một dòng "Phạm vi ... bổ sung" của tài khoản. Dòng nhắm tới đúng một mục tiêu:
 * hoặc địa bàn (`provinceId`/`communeId`), hoặc đơn vị quản lý
 * (`organizationId`). Khi đã chọn đơn vị, tỉnh/phường-xã chỉ là bộ lọc trên giao
 * diện và không được gửi lên server.
 */
export interface GeographyScopeInput {
  provinceId?: string;
  communeId?: string;
  organizationId?: string;
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
  skipCount?: number;
  maxResultCount?: number;
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

export interface CreatedAdminUser {
  user: AdminUser;
  /** Shown once so the administrator can hand it over. Never returned again. */
  temporaryPassword: string;
  /** False when the notification email could not be delivered. */
  notificationEmailSent: boolean;
}

export interface SaveUserInput {
  /** Login name. Only sent on create — it is fixed once the account exists. */
  userName?: string;
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
  skipCount?: number;
  maxResultCount?: number;
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

export interface RolePermissionRow {
  id: string;
  name: string;
  grants: Record<string, boolean>;
}

export interface AllRolesPermissionMatrix {
  permissions: PermissionOption[];
  roles: RolePermissionRow[];
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
