import { useQuery } from "@tanstack/react-query";
import { identityApi } from "./identityApi";
import type { RoleFilter, UserFilter } from "../types/identity.types";

export const identityKeys = {
  all: ["identity-administration"] as const,
  users: (filter: UserFilter) =>
    [...identityKeys.all, "users", filter] as const,
  user: (id: string) => [...identityKeys.all, "user", id] as const,
  activity: (id: string) => [...identityKeys.all, "activity", id] as const,
  rolesRoot: () => [...identityKeys.all, "roles"] as const,
  roles: (filter: RoleFilter) => [...identityKeys.rolesRoot(), filter] as const,
  permissions: (id: string) =>
    [...identityKeys.rolesRoot(), "permissions", id] as const,
};

export function useAdminUsers(filter: UserFilter) {
  return useQuery({
    queryKey: identityKeys.users(filter),
    queryFn: () => identityApi.getUsers(filter),
  });
}

export function useAdminUser(id?: string) {
  return useQuery({
    queryKey: identityKeys.user(id ?? ""),
    queryFn: () => identityApi.getUser(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useUserActivity(id?: string) {
  return useQuery({
    queryKey: identityKeys.activity(id ?? ""),
    queryFn: () => identityApi.getUserActivity(id ?? ""),
    enabled: Boolean(id),
  });
}

export function usePermissionOptions() {
  return useQuery({
    queryKey: [...identityKeys.all, "permission-options"] as const,
    queryFn: () => identityApi.getPermissionOptions(),
    staleTime: 300_000,
  });
}

export function useAdminRoles(filter: RoleFilter) {
  return useQuery({
    queryKey: identityKeys.roles(filter),
    queryFn: () => identityApi.getRoles(filter),
  });
}

export function useRolePermissions(id?: string) {
  return useQuery({
    queryKey: identityKeys.permissions(id ?? ""),
    queryFn: () => identityApi.getRolePermissions(id ?? ""),
    enabled: Boolean(id),
  });
}
