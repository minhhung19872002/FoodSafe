import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "./documentApi";
import { docKeys } from "./documentQueries";
import type {
  CreateUpdateDocumentInput,
  DocumentFilter,
} from "../types/document.types";

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: docKeys.all });
}

export function useCreateDocument() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateDocumentInput) =>
      documentApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateDocument() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateDocumentInput;
    }) => documentApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteDocument() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: refresh,
  });
}

export function useExportDocuments() {
  return useMutation({
    mutationFn: (filter: DocumentFilter) => documentApi.exportExcel(filter),
  });
}
