import { useMutation, useQueryClient } from "@tanstack/react-query";
import { persistCatalog, removeCatalog } from "./catalogApi";
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
