import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productRegistrationApi } from "./productRegistrationApi";
import { productRegistrationKeys } from "./productRegistrationQueries";
import type {
  ProductRegistrationFilter,
  ProductRegistrationInput,
} from "../types/productRegistration.types";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: productRegistrationKeys.all });
}

export function useCreateProductRegistration() {
  return useMutation({
    mutationFn: productRegistrationApi.create,
    onSuccess: useInvalidate(),
  });
}

export function useUpdateProductRegistration() {
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ProductRegistrationInput;
    }) => productRegistrationApi.update(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useDeleteProductRegistration() {
  return useMutation({
    mutationFn: productRegistrationApi.delete,
    onSuccess: useInvalidate(),
  });
}

export function useRevokeProductRegistration() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      productRegistrationApi.revoke(id, reason),
    onSuccess: useInvalidate(),
  });
}

export function useExportProductRegistrations() {
  return useMutation({
    mutationFn: (filter: ProductRegistrationFilter) =>
      productRegistrationApi.exportExcel(filter),
  });
}

export function useUploadProductRegistrationAttachment() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      productRegistrationApi.upload(id, file),
    onSuccess: useInvalidate(),
  });
}

export function useDownloadProductRegistrationAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      productRegistrationApi.downloadAttachment(id, attachmentId),
  });
}

export function useDeleteProductRegistrationAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      productRegistrationApi.deleteAttachment(id, attachmentId),
    onSuccess: useInvalidate(),
  });
}
