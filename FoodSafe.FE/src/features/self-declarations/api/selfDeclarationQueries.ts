import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { selfDeclarationApi } from "./selfDeclarationApi";
import type { SelfDeclarationFilter } from "../types/selfDeclaration.types";

export const selfDeclarationKeys = {
  all: ["self-declarations"] as const,
  list: (filter: SelfDeclarationFilter) =>
    [...selfDeclarationKeys.all, "list", filter] as const,
  businesses: () => [...selfDeclarationKeys.all, "business-options"] as const,
  products: (businessId?: string) =>
    [...selfDeclarationKeys.all, "product-options", businessId] as const,
  attachments: (id?: string) =>
    [...selfDeclarationKeys.all, "attachments", id] as const,
};

export function useSelfDeclarations(filter: SelfDeclarationFilter) {
  return useQuery({
    queryKey: selfDeclarationKeys.list(filter),
    queryFn: () => selfDeclarationApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useSelfDeclarationBusinesses() {
  return useQuery({
    queryKey: selfDeclarationKeys.businesses(),
    queryFn: selfDeclarationApi.businessOptions,
  });
}

export function useSelfDeclarationProducts(businessId?: string) {
  return useQuery({
    queryKey: selfDeclarationKeys.products(businessId),
    queryFn: () => selfDeclarationApi.productOptions(businessId!),
    enabled: Boolean(businessId),
  });
}

export function useSelfDeclarationAttachments(id?: string) {
  return useQuery({
    queryKey: selfDeclarationKeys.attachments(id),
    queryFn: () => selfDeclarationApi.attachments(id!),
    enabled: Boolean(id),
  });
}
