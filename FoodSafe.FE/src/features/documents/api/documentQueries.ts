import { useQuery } from "@tanstack/react-query";
import { documentApi } from "./documentApi";
import type { DocumentFilter } from "../types/document.types";

export const docKeys = {
  all: ["documents"] as const,
  lists: () => [...docKeys.all, "list"] as const,
  list: (filter: DocumentFilter) => [...docKeys.lists(), filter] as const,
  detail: (id: string) => [...docKeys.all, "detail", id] as const,
};

export function useDocuments(filter: DocumentFilter) {
  return useQuery({
    queryKey: docKeys.list(filter),
    queryFn: () => documentApi.list(filter),
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ["document-type-options"],
    queryFn: () => documentApi.documentTypeOptions(),
    staleTime: 300_000,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: docKeys.detail(id),
    queryFn: () => documentApi.get(id),
    enabled: !!id,
  });
}
