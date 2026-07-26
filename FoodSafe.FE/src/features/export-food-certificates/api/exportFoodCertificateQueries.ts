import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { exportFoodCertificateApi } from "./exportFoodCertificateApi";
import type { ExportFoodCertificateFilter } from "../types/exportFoodCertificate.types";

export const exportFoodCertificateKeys = {
  all: ["export-food-certificates"] as const,
  list: (filter: ExportFoodCertificateFilter) =>
    [...exportFoodCertificateKeys.all, "list", filter] as const,
  businesses: () =>
    [...exportFoodCertificateKeys.all, "business-options"] as const,
  products: (businessId?: string) =>
    [...exportFoodCertificateKeys.all, "product-options", businessId] as const,
  countries: () =>
    [...exportFoodCertificateKeys.all, "country-options"] as const,
  attachments: (id?: string) =>
    [...exportFoodCertificateKeys.all, "attachments", id] as const,
};

export function useExportFoodCertificates(filter: ExportFoodCertificateFilter) {
  return useQuery({
    queryKey: exportFoodCertificateKeys.list(filter),
    queryFn: () => exportFoodCertificateApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useExportFoodCertificateBusinesses() {
  return useQuery({
    queryKey: exportFoodCertificateKeys.businesses(),
    queryFn: exportFoodCertificateApi.businessOptions,
  });
}

export function useExportFoodCertificateProducts(businessId?: string) {
  return useQuery({
    queryKey: exportFoodCertificateKeys.products(businessId),
    queryFn: () => exportFoodCertificateApi.productOptions(businessId!),
    enabled: Boolean(businessId),
  });
}

export function useExportFoodCertificateCountries() {
  return useQuery({
    queryKey: exportFoodCertificateKeys.countries(),
    queryFn: exportFoodCertificateApi.countryOptions,
  });
}

export function useExportFoodCertificateAttachments(id?: string) {
  return useQuery({
    queryKey: exportFoodCertificateKeys.attachments(id),
    queryFn: () => exportFoodCertificateApi.attachments(id!),
    enabled: Boolean(id),
  });
}
