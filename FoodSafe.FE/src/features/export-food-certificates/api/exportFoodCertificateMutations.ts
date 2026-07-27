import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exportFoodCertificateApi } from "./exportFoodCertificateApi";
import { exportFoodCertificateKeys } from "./exportFoodCertificateQueries";
import type {
  ExportFoodCertificateFilter,
  ExportFoodCertificateInput,
} from "../types/exportFoodCertificate.types";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: exportFoodCertificateKeys.all,
    });
}

export function useCreateExportFoodCertificate() {
  return useMutation({
    mutationFn: exportFoodCertificateApi.create,
    onSuccess: useInvalidate(),
  });
}

export function useUpdateExportFoodCertificate() {
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ExportFoodCertificateInput;
    }) => exportFoodCertificateApi.update(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useDeleteExportFoodCertificate() {
  return useMutation({
    mutationFn: exportFoodCertificateApi.delete,
    onSuccess: useInvalidate(),
  });
}

export function useRevokeExportFoodCertificate() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      exportFoodCertificateApi.revoke(id, reason),
    onSuccess: useInvalidate(),
  });
}

export function useExportExportFoodCertificates() {
  return useMutation({
    mutationFn: (filter: ExportFoodCertificateFilter) =>
      exportFoodCertificateApi.exportExcel(filter),
  });
}

export function useUploadExportFoodCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      exportFoodCertificateApi.upload(id, file),
    onSuccess: useInvalidate(),
  });
}

export function useDownloadExportFoodCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      exportFoodCertificateApi.downloadAttachment(id, attachmentId),
  });
}

export function useDeleteExportFoodCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      exportFoodCertificateApi.deleteAttachment(id, attachmentId),
    onSuccess: useInvalidate(),
  });
}
