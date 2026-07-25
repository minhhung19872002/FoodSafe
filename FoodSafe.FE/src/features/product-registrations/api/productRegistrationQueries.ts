import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productRegistrationApi } from "./productRegistrationApi";
import type { ProductRegistrationFilter } from "../types/productRegistration.types";

export const productRegistrationKeys = {
  all: ["product-registrations"] as const,
  list: (filter: ProductRegistrationFilter) =>
    [...productRegistrationKeys.all, "list", filter] as const,
  businesses: () =>
    [...productRegistrationKeys.all, "business-options"] as const,
  products: (businessId?: string) =>
    [...productRegistrationKeys.all, "product-options", businessId] as const,
  attachments: (id?: string) =>
    [...productRegistrationKeys.all, "attachments", id] as const,
};

export function useProductRegistrations(filter: ProductRegistrationFilter) {
  return useQuery({
    queryKey: productRegistrationKeys.list(filter),
    queryFn: () => productRegistrationApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useProductRegistrationBusinesses() {
  return useQuery({
    queryKey: productRegistrationKeys.businesses(),
    queryFn: productRegistrationApi.businessOptions,
  });
}

export function useProductRegistrationProducts(businessId?: string) {
  return useQuery({
    queryKey: productRegistrationKeys.products(businessId),
    queryFn: () => productRegistrationApi.productOptions(businessId!),
    enabled: Boolean(businessId),
  });
}

export function useProductRegistrationAttachments(id?: string) {
  return useQuery({
    queryKey: productRegistrationKeys.attachments(id),
    queryFn: () => productRegistrationApi.attachments(id!),
    enabled: Boolean(id),
  });
}
