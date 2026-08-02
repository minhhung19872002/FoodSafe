import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productRecallApi } from "./productRecallApi";
import type { ProductRecallFilter } from "../types/productRecall.types";

export const productRecallKeys = {
  all: ["product-recalls"] as const,
  list: (filter: ProductRecallFilter) =>
    [...productRecallKeys.all, "list", filter] as const,
  businesses: () => [...productRecallKeys.all, "business-options"] as const,
};

export function useProductRecalls(filter: ProductRecallFilter) {
  return useQuery({
    queryKey: productRecallKeys.list(filter),
    queryFn: () => productRecallApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useProductRecallBusinesses() {
  return useQuery({
    queryKey: productRecallKeys.businesses(),
    queryFn: productRecallApi.businessOptions,
  });
}
