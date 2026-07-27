import { useQuery } from "@tanstack/react-query";
import { publicPortalApi } from "./publicPortalApi";
import type { PagedFilter } from "../types/publicPortal.types";

const QK = "public-portal" as const;

export function usePublicBusinessSearch(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "businesses", filter],
    queryFn: () => publicPortalApi.searchBusinesses(filter),
  });
}

export function usePublicProductSearch(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "products", filter],
    queryFn: () => publicPortalApi.searchProducts(filter),
  });
}

export function usePublicEligibilityCertificates(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "eligibility-certificates", filter],
    queryFn: () => publicPortalApi.searchEligibilityCertificates(filter),
  });
}

export function usePublicSelfDeclarations(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "self-declarations", filter],
    queryFn: () => publicPortalApi.searchSelfDeclarations(filter),
  });
}

export function usePublicProductRegistrations(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "product-registrations", filter],
    queryFn: () => publicPortalApi.searchProductRegistrations(filter),
  });
}

export function usePublicAdRegistrations(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "ad-registrations", filter],
    queryFn: () => publicPortalApi.searchAdRegistrations(filter),
  });
}

export function usePublicCfsCertificates(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "cfs-certificates", filter],
    queryFn: () => publicPortalApi.searchCfsCertificates(filter),
  });
}

export function usePublicExportFoodCertificates(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "export-food-certificates", filter],
    queryFn: () => publicPortalApi.searchExportFoodCertificates(filter),
  });
}

export function usePublicNews(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "news", filter],
    queryFn: () => publicPortalApi.listNews(filter),
  });
}

export function usePublicNewsDetail(id: string) {
  return useQuery({
    queryKey: [QK, "news-detail", id],
    queryFn: () => publicPortalApi.getNewsDetail(id),
    enabled: Boolean(id),
  });
}

export function usePublicAlerts(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "alerts", filter],
    queryFn: () => publicPortalApi.listAlerts(filter),
  });
}

export function usePublicWarnedBusinesses(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "warned-businesses", filter],
    queryFn: () => publicPortalApi.listWarnedBusinesses(filter),
  });
}

export function usePublicDocuments(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "documents", filter],
    queryFn: () => publicPortalApi.listDocuments(filter),
  });
}

export function usePublicRiskAnalyses(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "risk-analyses", filter],
    queryFn: () => publicPortalApi.listRiskAnalyses(filter),
  });
}
