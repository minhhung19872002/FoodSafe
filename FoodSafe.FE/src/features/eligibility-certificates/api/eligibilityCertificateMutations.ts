import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eligibilityCertificateApi } from "./eligibilityCertificateApi";
import { eligibilityCertificateKeys } from "./eligibilityCertificateQueries";

function useRefreshMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: eligibilityCertificateKeys.all,
      }),
  });
}

export function useCreateEligibilityCertificate() {
  return useRefreshMutation(eligibilityCertificateApi.create);
}

export function useUpdateEligibilityCertificate() {
  return useRefreshMutation(
    ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof eligibilityCertificateApi.update>[1];
    }) => eligibilityCertificateApi.update(id, input),
  );
}

export function useDeleteEligibilityCertificate() {
  return useRefreshMutation(eligibilityCertificateApi.delete);
}

export function useRevokeEligibilityCertificate() {
  return useRefreshMutation(({ id, reason }: { id: string; reason: string }) =>
    eligibilityCertificateApi.revoke(id, reason),
  );
}

export function useExportEligibilityCertificates() {
  return useMutation({ mutationFn: eligibilityCertificateApi.exportExcel });
}

export function useDownloadEligibilityCertificatePdf() {
  return useMutation({ mutationFn: eligibilityCertificateApi.downloadPdf });
}

export function useUploadEligibilityAttachment() {
  return useRefreshMutation(({ id, file }: { id: string; file: File }) =>
    eligibilityCertificateApi.upload(id, file),
  );
}

export function useDownloadEligibilityAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      eligibilityCertificateApi.downloadAttachment(id, attachmentId),
  });
}

export function useDeleteEligibilityAttachment() {
  return useRefreshMutation(
    ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      eligibilityCertificateApi.deleteAttachment(id, attachmentId),
  );
}
