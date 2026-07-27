import { useMutation, useQueryClient } from "@tanstack/react-query";
import { identityApi } from "./identityApi";
import { identityKeys } from "./identityQueries";
import type { SaveRoleInput, SaveUserInput } from "../types/identity.types";

function useIdentityMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: identityKeys.all }),
  });
}

export const useCreateAdminUser = () =>
  useIdentityMutation(identityApi.createUser);

export const useUpdateAdminUser = () =>
  useIdentityMutation(({ id, input }: { id: string; input: SaveUserInput }) =>
    identityApi.updateUser(id, input),
  );

export const useSetUserActivation = () =>
  useIdentityMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    identityApi.setUserActivation(id, isActive),
  );

export const useSetUserLock = () =>
  useIdentityMutation(({ id, isLocked }: { id: string; isLocked: boolean }) =>
    identityApi.setUserLock(id, isLocked),
  );

export const useSendPasswordReset = () =>
  useIdentityMutation(identityApi.sendPasswordReset);

export const useDeleteAdminUser = () =>
  useIdentityMutation(identityApi.deleteUser);

export const useGenerateRandomPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: identityApi.generateRandomPassword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: identityKeys.all }),
  });
};

export const useCreateAdminRole = () =>
  useIdentityMutation(identityApi.createRole);

export const useUpdateAdminRole = () =>
  useIdentityMutation(({ id, input }: { id: string; input: SaveRoleInput }) =>
    identityApi.updateRole(id, input),
  );

export const useDeleteAdminRole = () =>
  useIdentityMutation(identityApi.deleteRole);

export const useUpdateRolePermissions = () =>
  useIdentityMutation(
    ({
      id,
      permissions,
    }: {
      id: string;
      permissions: Array<{ name: string; isGranted: boolean }>;
    }) => identityApi.updateRolePermissions(id, permissions),
  );
