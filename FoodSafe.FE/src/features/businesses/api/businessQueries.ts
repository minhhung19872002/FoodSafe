import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { businessApi, productApi, productAttachmentApi } from "./businessApi";
import type { BusinessFilter, ProductFilter } from "../types/business.types";

export const businessKeys = {
  all: ["business-management"] as const,
  businesses: () => [...businessKeys.all, "businesses"] as const,
  businessList: (filter: BusinessFilter) =>
    [...businessKeys.businesses(), "list", filter] as const,
  business: (id: string) =>
    [...businessKeys.businesses(), "detail", id] as const,
  products: () => [...businessKeys.all, "products"] as const,
  productList: (filter: ProductFilter) =>
    [...businessKeys.products(), "list", filter] as const,
  productBusinessOptions: () =>
    [...businessKeys.products(), "business-options"] as const,
};

export function useBusinessList(filter: BusinessFilter, enabled = true) {
  return useQuery({
    queryKey: businessKeys.businessList(filter),
    queryFn: () => businessApi.list(filter),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useBusiness(id?: string) {
  return useQuery({
    queryKey: businessKeys.business(id ?? ""),
    queryFn: () => businessApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useProductList(filter: ProductFilter, enabled = true) {
  return useQuery({
    queryKey: businessKeys.productList(filter),
    queryFn: () => productApi.list(filter),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProductBusinessOptions(enabled = true) {
  return useQuery({
    queryKey: businessKeys.productBusinessOptions(),
    queryFn: productApi.businessOptions,
    enabled,
  });
}

export function useProductAttachments(productId?: string) {
  return useQuery({
    queryKey: [...businessKeys.all, "product-attachments", productId],
    queryFn: () => productAttachmentApi.list(productId!),
    enabled: Boolean(productId),
  });
}
