import { useMutation, useQueryClient } from "@tanstack/react-query";
import { advertisementRegistrationApi as service } from "./advertisementRegistrationApi";
import { advertisementRegistrationKeys } from "./advertisementRegistrationQueries";
import type {
  AdvertisementRegistrationFilter,
  AdvertisementRegistrationInput,
} from "../types/advertisementRegistration.types";

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({
      queryKey: advertisementRegistrationKeys.all,
    });
    void client.invalidateQueries({
      queryKey: ["business-related", "adRegistrations"],
      refetchType: "all",
    });
  };
}

export const useCreateAdvertisementRegistration = () =>
  useMutation({ mutationFn: service.create, onSuccess: useInvalidate() });
export const useUpdateAdvertisementRegistration = () =>
  useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: AdvertisementRegistrationInput;
    }) => service.update(id, input),
    onSuccess: useInvalidate(),
  });
export const useDeleteAdvertisementRegistration = () =>
  useMutation({ mutationFn: service.delete, onSuccess: useInvalidate() });
export const useRevokeAdvertisementRegistration = () =>
  useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      service.revoke(id, reason),
    onSuccess: useInvalidate(),
  });
export const useExportAdvertisementRegistrations = () =>
  useMutation({
    mutationFn: (filter: AdvertisementRegistrationFilter) =>
      service.exportExcel(filter),
  });
export const useUploadAdvertisementAttachment = () =>
  useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      service.upload(id, file),
    onSuccess: useInvalidate(),
  });
export const useDownloadAdvertisementAttachment = () =>
  useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      service.downloadAttachment(id, attachmentId),
  });
export const useDeleteAdvertisementAttachment = () =>
  useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      service.deleteAttachment(id, attachmentId),
    onSuccess: useInvalidate(),
  });
