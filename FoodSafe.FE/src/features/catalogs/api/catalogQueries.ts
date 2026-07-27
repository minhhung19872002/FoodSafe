import { useQuery } from "@tanstack/react-query";
import { fetchCatalog } from "./catalogApi";
import type { CatalogKind, CatalogQuery } from "../types/catalog.types";

export const catalogQueryKeys = {
  all: ["master-catalog"] as const,
  list: (kind: CatalogKind, params: CatalogQuery) =>
    [...catalogQueryKeys.all, kind, params] as const,
  options: (kind: CatalogKind) =>
    [...catalogQueryKeys.all, kind, "options"] as const,
};

export function useCatalog(kind: CatalogKind, params: CatalogQuery) {
  return useQuery({
    queryKey: catalogQueryKeys.list(kind, params),
    queryFn: () => fetchCatalog(kind, params),
  });
}

export function useCatalogOptions(kind: CatalogKind) {
  return useQuery({
    queryKey: catalogQueryKeys.options(kind),
    queryFn: () => fetchCatalog(kind, { isActive: true, maxResultCount: 100 }),
  });
}
