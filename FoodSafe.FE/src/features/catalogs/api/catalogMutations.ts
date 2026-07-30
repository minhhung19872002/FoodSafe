import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmCatalogImport,
  downloadCatalogTemplate,
  persistCatalog,
  previewCatalogImport,
  removeCatalog,
} from "./catalogApi";
import { catalogQueryKeys } from "./catalogQueries";
import type { CatalogInput, CatalogKind } from "../types/catalog.types";

interface SaveCatalogVariables {
  input: CatalogInput;
  id?: string;
}

export function useSaveCatalog(kind: CatalogKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, id }: SaveCatalogVariables) =>
      persistCatalog(kind, input, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all }),
  });
}

export function useDeleteCatalog(kind: CatalogKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeCatalog(kind, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all }),
  });
}

export function useDownloadCatalogTemplate(kind: CatalogKind) {
  return useMutation({ mutationFn: () => downloadCatalogTemplate(kind) });
}

export function usePreviewCatalogImport(kind: CatalogKind) {
  return useMutation({
    mutationFn: (file: File) => previewCatalogImport(kind, file),
  });
}

export function useConfirmCatalogImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => confirmCatalogImport(token),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all }),
  });
}
