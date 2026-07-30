import { api } from "@/lib/axios";
import type {
  AlertReportInput,
  AlertReportResult,
  CatalogOption,
  CitizenReportStatus,
  PagedFilter,
  PagedResult,
  PublicAlert,
  PublicAlertFilter,
  PublicBusiness,
  PublicBusinessFilter,
  PublicCertificate,
  PublicCertificateDetail,
  PublicCertificateFilter,
  PublicDocument,
  PublicDocumentDetail,
  PublicInspectionResult,
  PublicNewsDetail,
  PublicNewsFilter,
  PublicNewsItem,
  PublicProduct,
  PublicDocumentFilter,
  PublicProductFilter,
  PublicRiskAnalysis,
  PublicRiskAnalysisFilter,
  PublicTestingResult,
  PublicTestingResultFilter,
  PublicWarnedBusiness,
} from "../types/publicPortal.types";

export const publicPortalApi = {
  searchBusinesses(
    filter: PublicBusinessFilter,
  ): Promise<PagedResult<PublicBusiness>> {
    return api
      .get<PagedResult<PublicBusiness>>("/v1/public/businesses/search", {
        params: filter,
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data);
  },

  searchProducts(
    filter: PublicProductFilter,
  ): Promise<PagedResult<PublicProduct>> {
    return api
      .get<PagedResult<PublicProduct>>("/v1/public/products/search", {
        params: filter,
      })
      .then((r) => r.data);
  },

  searchEligibilityCertificates(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/eligibility-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchSelfDeclarations(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/self-declarations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchProductRegistrations(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/product-registrations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchAdRegistrations(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/ad-registrations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchCfsCertificates(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/cfs-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchExportFoodCertificates(
    filter: PublicCertificateFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/export-food-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  listNews(filter: PublicNewsFilter): Promise<PagedResult<PublicNewsItem>> {
    return api
      .get<PagedResult<PublicNewsItem>>("/v1/public/news", {
        params: filter,
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data);
  },

  fetchNewsCategoryOptions(): Promise<string[]> {
    return api
      .get<string[]>("/v1/public/catalog/news-categories")
      .then((r) => r.data);
  },

  getNewsDetail(id: string): Promise<PublicNewsDetail> {
    return api
      .get<PublicNewsDetail>(`/v1/public/news/${id}`)
      .then((r) => r.data);
  },

  listAlerts(filter: PublicAlertFilter): Promise<PagedResult<PublicAlert>> {
    return api
      .get<PagedResult<PublicAlert>>("/v1/public/alerts", {
        params: filter,
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data);
  },

  listWarnedBusinesses(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicWarnedBusiness>> {
    return api
      .get<PagedResult<PublicWarnedBusiness>>("/v1/public/warned-businesses", {
        params: filter,
      })
      .then((r) => r.data);
  },

  listDocuments(
    filter: PublicDocumentFilter,
  ): Promise<PagedResult<PublicDocument>> {
    return api
      .get<PagedResult<PublicDocument>>("/v1/public/documents", {
        params: filter,
      })
      .then((r) => r.data);
  },

  getDocumentDetail(id: string): Promise<PublicDocumentDetail> {
    return api
      .get<PublicDocumentDetail>(`/v1/public/documents/${id}`)
      .then((r) => r.data);
  },

  fetchDocumentTypeOptions(): Promise<CatalogOption[]> {
    return api
      .get<CatalogOption[]>("/v1/public/catalog/document-types")
      .then((r) => r.data);
  },

  listRiskAnalyses(
    filter: PublicRiskAnalysisFilter,
  ): Promise<PagedResult<PublicRiskAnalysis>> {
    return api
      .get<PagedResult<PublicRiskAnalysis>>("/v1/public/risk-analyses", {
        params: filter,
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data);
  },

  listTestingResults(
    filter: PublicTestingResultFilter,
  ): Promise<PagedResult<PublicTestingResult>> {
    return api
      .get<PagedResult<PublicTestingResult>>("/v1/public/testing-results", {
        params: filter,
      })
      .then((r) => r.data);
  },

  fetchBusinessTypeOptions(): Promise<CatalogOption[]> {
    return api
      .get<CatalogOption[]>("/v1/public/catalog/business-types")
      .then((r) => r.data);
  },

  fetchProductGroupOptions(): Promise<CatalogOption[]> {
    return api
      .get<CatalogOption[]>("/v1/public/catalog/product-groups")
      .then((r) => r.data);
  },

  getCertificateDetail(
    certPath: string,
    id: string,
  ): Promise<PublicCertificateDetail> {
    return api
      .get<PublicCertificateDetail>(`/v1/public/${certPath}/${id}`)
      .then((r) => r.data);
  },

  listInspectionResults(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicInspectionResult>> {
    return api
      .get<PagedResult<PublicInspectionResult>>(
        "/v1/public/inspection-results",
        {
          params: filter,
        },
      )
      .then((r) => r.data);
  },

  async submitNewsReport(input: {
    title: string;
    content: string;
    reporterName?: string;
    reporterContact?: string;
    captchaToken: string;
  }): Promise<AlertReportResult> {
    await api.get("/abp/application-configuration");
    const response = await api.post<AlertReportResult>(
      "/v1/public/news-reports",
      input,
    );
    return response.data;
  },

  async submitAlertReport(input: AlertReportInput): Promise<AlertReportResult> {
    // Prime XSRF cookie before the POST
    await api.get("/abp/application-configuration");
    const response = await api.post<AlertReportResult>(
      "/v1/public/alert-reports",
      input,
    );
    return response.data;
  },

  /**
   * Looks up a citizen report by its tracking code.
   * Returns null when the API responds with 404 (code not found).
   * No PII is included in the response.
   */
  async getCitizenReportStatus(
    trackingCode: string,
  ): Promise<CitizenReportStatus | null> {
    try {
      const response = await api.get<CitizenReportStatus>(
        "/v1/public/citizen-reports/status",
        { params: { trackingCode } },
      );
      return response.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return null;
      throw err;
    }
  },
};
