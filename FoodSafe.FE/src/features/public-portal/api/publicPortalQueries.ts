import { useQuery } from "@tanstack/react-query";
import { publicPortalApi } from "./publicPortalApi";
import type {
  PagedFilter,
  PublicAlertFilter,
  PublicBusinessFilter,
  PublicCertificateFilter,
  PublicDocumentFilter,
  PublicNewsFilter,
  PublicProductFilter,
  PublicRiskAnalysisFilter,
  PublicTestingResultFilter,
} from "../types/publicPortal.types";

const QK = "public-portal" as const;

export function usePublicBusinessSearch(filter: PublicBusinessFilter) {
  return useQuery({
    queryKey: [QK, "businesses", filter],
    queryFn: () => publicPortalApi.searchBusinesses(filter),
  });
}

export function usePublicProductSearch(filter: PublicProductFilter) {
  return useQuery({
    queryKey: [QK, "products", filter],
    queryFn: () => publicPortalApi.searchProducts(filter),
  });
}

export function usePublicEligibilityCertificates(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "eligibility-certificates", filter],
    queryFn: () => publicPortalApi.searchEligibilityCertificates(filter),
  });
}

export function usePublicSelfDeclarations(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "self-declarations", filter],
    queryFn: () => publicPortalApi.searchSelfDeclarations(filter),
  });
}

export function usePublicProductRegistrations(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "product-registrations", filter],
    queryFn: () => publicPortalApi.searchProductRegistrations(filter),
  });
}

export function usePublicAdRegistrations(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "ad-registrations", filter],
    queryFn: () => publicPortalApi.searchAdRegistrations(filter),
  });
}

export function usePublicCfsCertificates(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "cfs-certificates", filter],
    queryFn: () => publicPortalApi.searchCfsCertificates(filter),
  });
}

export function usePublicExportFoodCertificates(filter: PublicCertificateFilter) {
  return useQuery({
    queryKey: [QK, "export-food-certificates", filter],
    queryFn: () => publicPortalApi.searchExportFoodCertificates(filter),
  });
}

export function usePublicNews(filter: PublicNewsFilter) {
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

export function usePublicAlerts(filter: PublicAlertFilter) {
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

export function usePublicDocuments(filter: PublicDocumentFilter) {
  return useQuery({
    queryKey: [QK, "documents", filter],
    queryFn: () => publicPortalApi.listDocuments(filter),
  });
}

export function usePublicDocumentDetail(id: string | undefined) {
  return useQuery({
    queryKey: [QK, "document-detail", id],
    queryFn: () => publicPortalApi.getDocumentDetail(id!),
    enabled: Boolean(id),
  });
}

export function usePublicDocumentTypeOptions() {
  return useQuery({
    queryKey: [QK, "catalog", "document-types"],
    queryFn: () => publicPortalApi.fetchDocumentTypeOptions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePublicRiskAnalyses(filter: PublicRiskAnalysisFilter) {
  return useQuery({
    queryKey: [QK, "risk-analyses", filter],
    queryFn: () => publicPortalApi.listRiskAnalyses(filter),
  });
}

export function usePublicTestingResults(filter: PublicTestingResultFilter) {
  return useQuery({
    queryKey: [QK, "testing-results", filter],
    queryFn: () => publicPortalApi.listTestingResults(filter),
  });
}

export function usePublicBusinessTypeOptions() {
  return useQuery({
    queryKey: [QK, "catalog", "business-types"],
    queryFn: () => publicPortalApi.fetchBusinessTypeOptions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePublicProductGroupOptions() {
  return useQuery({
    queryKey: [QK, "catalog", "product-groups"],
    queryFn: () => publicPortalApi.fetchProductGroupOptions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePublicCertificateDetail(
  certPath: string | undefined,
  id: string | undefined,
) {
  return useQuery({
    queryKey: [QK, "certificate-detail", certPath, id],
    queryFn: () => publicPortalApi.getCertificateDetail(certPath!, id!),
    enabled: Boolean(certPath && id),
  });
}

export function usePublicInspectionResults(filter: PagedFilter) {
  return useQuery({
    queryKey: [QK, "inspection-results", filter],
    queryFn: () => publicPortalApi.listInspectionResults(filter),
  });
}

/**
 * Looks up a citizen report by tracking code.
 * Only fires when `trackingCode` is non-empty.
 * Returns null from queryFn when the code is not found (404).
 */
export function useCitizenReportStatus(trackingCode: string) {
  return useQuery({
    queryKey: [QK, "citizen-report-status", trackingCode],
    queryFn: () => publicPortalApi.getCitizenReportStatus(trackingCode),
    enabled: trackingCode.trim().length > 0,
    retry: false,
  });
}

/**
 * Fetches a large page of public businesses for map display.
 * Results are cached for 5 minutes to avoid hammering the endpoint when the
 * user switches between the list and map tabs.
 */
export function usePublicBusinessMapData(keyword?: string) {
  return useQuery({
    queryKey: [QK, "businesses-map", keyword ?? ""],
    queryFn: () =>
      publicPortalApi.searchBusinesses({
        Keyword: keyword || undefined,
        SkipCount: 0,
        MaxResultCount: 500,
      }),
    staleTime: 5 * 60 * 1000,
  });
}
