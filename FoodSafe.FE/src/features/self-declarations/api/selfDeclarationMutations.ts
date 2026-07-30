import { useMutation, useQueryClient } from "@tanstack/react-query";
import { selfDeclarationApi } from "./selfDeclarationApi";
import { selfDeclarationKeys } from "./selfDeclarationQueries";
import type {
  SelfDeclarationFilter,
  SelfDeclarationInput,
} from "../types/selfDeclaration.types";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: selfDeclarationKeys.all });
    void queryClient.invalidateQueries({
      queryKey: ["business-related", "selfDeclarations"],
      refetchType: "all",
    });
  };
}

export function useCreateSelfDeclaration() {
  return useMutation({
    mutationFn: selfDeclarationApi.create,
    onSuccess: useInvalidate(),
  });
}

export function useUpdateSelfDeclaration() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SelfDeclarationInput }) =>
      selfDeclarationApi.update(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useDeleteSelfDeclaration() {
  return useMutation({
    mutationFn: selfDeclarationApi.delete,
    onSuccess: useInvalidate(),
  });
}

export function useRevokeSelfDeclaration() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      selfDeclarationApi.revoke(id, reason),
    onSuccess: useInvalidate(),
  });
}

export function useExportSelfDeclarations() {
  return useMutation({
    mutationFn: (filter: SelfDeclarationFilter) =>
      selfDeclarationApi.exportExcel(filter),
  });
}

export function useDownloadSelfDeclarationPdf() {
  return useMutation({ mutationFn: selfDeclarationApi.downloadPdf });
}

export function useUploadSelfDeclarationAttachment() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      selfDeclarationApi.upload(id, file),
    onSuccess: useInvalidate(),
  });
}

export function useDownloadSelfDeclarationAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      selfDeclarationApi.downloadAttachment(id, attachmentId),
  });
}

export function useDeleteSelfDeclarationAttachment() {
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      selfDeclarationApi.deleteAttachment(id, attachmentId),
    onSuccess: useInvalidate(),
  });
}
