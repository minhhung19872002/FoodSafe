import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCatalog } from "./catalogApi";
import type { CatalogKind, CatalogQuery } from "../types/catalog.types";

/**
 * Số bản ghi tải sẵn cho dropdown. Danh mục lớn hơn ngưỡng này vẫn truy cập được
 * bằng cách gõ để tìm kiếm — server lọc theo `filter` rồi trả về trang đầu tiên.
 */
const optionsPageSize = 100;

export const catalogQueryKeys = {
  all: ["master-catalog"] as const,
  list: (kind: CatalogKind, params: CatalogQuery) =>
    [...catalogQueryKeys.all, kind, params] as const,
  options: (kind: CatalogKind, filter: string) =>
    [...catalogQueryKeys.all, kind, "options", filter] as const,
};

export function useCatalog(kind: CatalogKind, params: CatalogQuery) {
  return useQuery({
    queryKey: catalogQueryKeys.list(kind, params),
    queryFn: () => fetchCatalog(kind, params),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogOptions(kind: CatalogKind, filter = "") {
  return useQuery({
    queryKey: catalogQueryKeys.options(kind, filter),
    queryFn: () =>
      fetchCatalog(kind, {
        isActive: true,
        filter: filter || undefined,
        maxResultCount: optionsPageSize,
      }),
    placeholderData: keepPreviousData,
  });
}
