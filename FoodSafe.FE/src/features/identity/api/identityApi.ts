import { api } from "@/lib/axios";
import type {
  AdminRole,
  AdminUser,
  AllRolesPermissionMatrix,
  CreatedAdminUser,
  GeneratedPassword,
  ListResult,
  PagedResult,
  PermissionOption,
  RoleFilter,
  RolePermissionGroup,
  SaveRoleInput,
  SaveUserInput,
  UserActivity,
  UserFilter,
} from "../types/identity.types";

const endpoint = "/v1/administration";

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

function toDownload(data: Blob, disposition?: string): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const identityApi = {
  getUsers: (filter: UserFilter): Promise<PagedResult<AdminUser>> =>
    api
      .get<PagedResult<AdminUser>>(`${endpoint}/users`, { params: filter })
      .then((response) => response.data),

  getUser: (id: string): Promise<AdminUser> =>
    api
      .get<AdminUser>(`${endpoint}/users/${id}`)
      .then((response) => response.data),

  createUser: (input: SaveUserInput): Promise<CreatedAdminUser> =>
    api
      .post<CreatedAdminUser>(`${endpoint}/users`, input)
      .then((response) => response.data),

  updateUser: (id: string, input: SaveUserInput): Promise<AdminUser> =>
    api
      .put<AdminUser>(`${endpoint}/users/${id}`, input)
      .then((response) => response.data),

  deleteUser: (id: string): Promise<void> =>
    api.delete(`${endpoint}/users/${id}`).then(() => undefined),

  generateRandomPassword: (id: string): Promise<GeneratedPassword> =>
    api
      .post<GeneratedPassword>(`${endpoint}/users/${id}/random-password`)
      .then((response) => response.data),

  getPermissionOptions: (): Promise<ListResult<PermissionOption>> =>
    api
      .get<ListResult<PermissionOption>>(`${endpoint}/permission-options`)
      .then((response) => response.data),

  setUserActivation: (id: string, isActive: boolean): Promise<void> =>
    api
      .put(`${endpoint}/users/${id}/activation`, { isActive })
      .then(() => undefined),

  setUserLock: (id: string, isLocked: boolean): Promise<void> =>
    api.put(`${endpoint}/users/${id}/lock`, { isLocked }).then(() => undefined),

  sendPasswordReset: (id: string): Promise<void> =>
    api.post(`${endpoint}/users/${id}/password-reset`).then(() => undefined),

  getUserActivity: (
    id: string,
    skipCount = 0,
    maxResultCount = 50,
  ): Promise<PagedResult<UserActivity>> =>
    api
      .get<PagedResult<UserActivity>>(`${endpoint}/users/${id}/activity`, {
        params: { skipCount, maxResultCount, sorting: "ExecutionTime DESC" },
      })
      .then((response) => response.data),

  exportUsers: (
    filter: Omit<UserFilter, "skipCount" | "maxResultCount">,
  ): Promise<FileDownload> =>
    api
      .get<Blob>(`${endpoint}/excel/users`, {
        params: filter,
        responseType: "blob",
      })
      .then((response) =>
        toDownload(response.data, response.headers["content-disposition"]),
      ),

  getRoles: (filter: RoleFilter): Promise<PagedResult<AdminRole>> =>
    api
      .get<PagedResult<AdminRole>>(`${endpoint}/roles`, { params: filter })
      .then((response) => response.data),

  createRole: (input: SaveRoleInput): Promise<AdminRole> =>
    api
      .post<AdminRole>(`${endpoint}/roles`, input)
      .then((response) => response.data),

  updateRole: (id: string, input: SaveRoleInput): Promise<AdminRole> =>
    api
      .put<AdminRole>(`${endpoint}/roles/${id}`, input)
      .then((response) => response.data),

  deleteRole: (id: string): Promise<void> =>
    api.delete(`${endpoint}/roles/${id}`).then(() => undefined),

  getRolePermissions: (id: string): Promise<ListResult<RolePermissionGroup>> =>
    api
      .get<ListResult<RolePermissionGroup>>(
        `${endpoint}/roles/${id}/permissions`,
      )
      .then((response) => response.data),

  updateRolePermissions: (
    id: string,
    permissions: Array<{ name: string; isGranted: boolean }>,
  ): Promise<void> =>
    api
      .put(`${endpoint}/roles/${id}/permissions`, { permissions })
      .then(() => undefined),

  getPermissionMatrix: (): Promise<AllRolesPermissionMatrix> =>
    api
      .get<AllRolesPermissionMatrix>(`${endpoint}/all-roles-permissions`)
      .then((response) => response.data),
};
