import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cfsCertificateApi } from "./cfsCertificateApi";
import { cfsCertificateKeys } from "./cfsCertificateQueries";
import type {
  CfsCertificateFilter,
  CfsCertificateInput,
} from "../types/cfsCertificate.types";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: cfsCertificateKeys.all });
}

export function useCreateCfsCertificate() {
  return useMutation({
    mutationFn: cfsCertificateApi.create,
    onSuccess: useInvalidate(),
  });
}

export function useUpdateCfsCertificate() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CfsCertificateInput }) =>
      cfsCertificateApi.update(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useDeleteCfsCertificate() {
  return useMutation({
    mutationFn: cfsCertificateApi.delete,
    onSuccess: useInvalidate(),
  });
}

export function useRevokeCfsCertificate() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cfsCertificateApi.revoke(id, reason),
    onSuccess: useInvalidate(),
  });
}

export function useExportCfsCertificates() {
  return useMutation({
    mutationFn: (filter: CfsCertificateFilter) =>
      cfsCertificateApi.exportExcel(filter),
  });
}

export function useDownloadCfsCertificatePdf() {
  return useMutation({
    mutationFn: (id: string) => cfsCertificateApi.downloadPdf(id),
  });
}

export function useUploadCfsCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      cfsCertificateApi.upload(id, file),
    onSuccess: useInvalidate(),
  });
}

export function useDownloadCfsCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      cfsCertificateApi.downloadAttachment(id, attachmentId),
  });
}

export function useDeleteCfsCertificateAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      cfsCertificateApi.deleteAttachment(id, attachmentId),
    onSuccess: useInvalidate(),
  });
}
