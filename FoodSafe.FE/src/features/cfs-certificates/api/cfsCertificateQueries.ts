import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cfsCertificateApi } from "./cfsCertificateApi";
import type { CfsCertificateFilter } from "../types/cfsCertificate.types";

export const cfsCertificateKeys = {
  all: ["cfs-certificates"] as const,
  list: (filter: CfsCertificateFilter) =>
    [...cfsCertificateKeys.all, "list", filter] as const,
  businesses: () => [...cfsCertificateKeys.all, "business-options"] as const,
  products: (businessId?: string) =>
    [...cfsCertificateKeys.all, "product-options", businessId] as const,
  countries: () => [...cfsCertificateKeys.all, "country-options"] as const,
  attachments: (id?: string) =>
    [...cfsCertificateKeys.all, "attachments", id] as const,
};

export function useCfsCertificates(filter: CfsCertificateFilter) {
  return useQuery({
    queryKey: cfsCertificateKeys.list(filter),
    queryFn: () => cfsCertificateApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useCfsCertificateBusinesses() {
  return useQuery({
    queryKey: cfsCertificateKeys.businesses(),
    queryFn: cfsCertificateApi.businessOptions,
  });
}

export function useCfsCertificateProducts(businessId?: string) {
  return useQuery({
    queryKey: cfsCertificateKeys.products(businessId),
    queryFn: () => cfsCertificateApi.productOptions(businessId!),
    enabled: Boolean(businessId),
    staleTime: 0,
  });
}

export function useCfsCertificateCountries() {
  return useQuery({
    queryKey: cfsCertificateKeys.countries(),
    queryFn: cfsCertificateApi.countryOptions,
  });
}

export function useCfsCertificateAttachments(id?: string) {
  return useQuery({
    queryKey: cfsCertificateKeys.attachments(id),
    queryFn: () => cfsCertificateApi.attachments(id!),
    enabled: Boolean(id),
  });
}
