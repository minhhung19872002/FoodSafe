import { api } from "@/lib/axios";
import type {
  AdminRole,
  AdminUser,
  ListResult,
  PagedResult,
  RoleFilter,
  RolePermissionGroup,
  SaveRoleInput,
  SaveUserInput,
  UserActivity,
  UserFilter,
} from "../types/identity.types";

const endpoint = "/v1/administration";

export const identityApi = {
  getUsers: (filter: UserFilter): Promise<PagedResult<AdminUser>> =>
    api
      .get<PagedResult<AdminUser>>(`${endpoint}/users`, { params: filter })
      .then((response) => response.data),

  getUser: (id: string): Promise<AdminUser> =>
    api
      .get<AdminUser>(`${endpoint}/users/${id}`)
      .then((response) => response.data),

  createUser: (input: SaveUserInput): Promise<AdminUser> =>
    api
      .post<AdminUser>(`${endpoint}/users`, input)
      .then((response) => response.data),

  updateUser: (id: string, input: SaveUserInput): Promise<AdminUser> =>
    api
      .put<AdminUser>(`${endpoint}/users/${id}`, input)
      .then((response) => response.data),

  setUserActivation: (id: string, isActive: boolean): Promise<void> =>
    api
      .put(`${endpoint}/users/${id}/activation`, { isActive })
      .then(() => undefined),

  setUserLock: (id: string, isLocked: boolean): Promise<void> =>
    api.put(`${endpoint}/users/${id}/lock`, { isLocked }).then(() => undefined),

  sendPasswordReset: (id: string): Promise<void> =>
    api.post(`${endpoint}/users/${id}/password-reset`).then(() => undefined),

  deleteUser: (id: string): Promise<void> =>
    api.delete(`${endpoint}/users/${id}`).then(() => undefined),

  exportUsers: async (
    filter: UserFilter,
  ): Promise<{ blob: Blob; fileName: string }> => {
    const response = await api.get(`${endpoint}/users/excel`, {
      params: filter,
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as
      string | undefined;
    const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match
      ? match[1].replace(/['"]/g, "")
      : "danh-sach-tai-khoan.xlsx";
    return { blob: response.data as Blob, fileName };
  },

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
};
