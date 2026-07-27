import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./settingsApi";
import type {
  BrandingImageKind,
  UpdateSystemSettingsInput,
} from "../types/settings.types";

const settingsKeys = {
  all: ["system-settings"] as const,
};

export function useSystemSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsApi.get(),
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSystemSettingsInput) => settingsApi.update(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

export function useUploadBrandingImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, file }: { kind: BrandingImageKind; file: File }) =>
      settingsApi.uploadImage(kind, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

export function useDeleteBrandingImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kind: BrandingImageKind) => settingsApi.deleteImage(kind),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}
