import { api } from "@/lib/axios";
import type {
  AlertReportInput,
  AlertReportResult,
  PagedFilter,
  PagedResult,
  PublicAlert,
  PublicBusiness,
  PublicCertificate,
  PublicDocument,
  PublicNewsDetail,
  PublicNewsItem,
  PublicProduct,
  PublicRiskAnalysis,
  PublicWarnedBusiness,
} from "../types/publicPortal.types";

export const publicPortalApi = {
  searchBusinesses(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicBusiness>> {
    return api
      .get<PagedResult<PublicBusiness>>("/v1/public/businesses/search", {
        params: filter,
      })
      .then((r) => r.data);
  },

  searchProducts(filter: PagedFilter): Promise<PagedResult<PublicProduct>> {
    return api
      .get<PagedResult<PublicProduct>>("/v1/public/products/search", {
        params: filter,
      })
      .then((r) => r.data);
  },

  searchEligibilityCertificates(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/eligibility-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchSelfDeclarations(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/self-declarations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchProductRegistrations(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/product-registrations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchAdRegistrations(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/ad-registrations/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchCfsCertificates(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/cfs-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  searchExportFoodCertificates(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicCertificate>> {
    return api
      .get<PagedResult<PublicCertificate>>(
        "/v1/public/export-food-certificates/search",
        { params: filter },
      )
      .then((r) => r.data);
  },

  listNews(filter: PagedFilter): Promise<PagedResult<PublicNewsItem>> {
    return api
      .get<PagedResult<PublicNewsItem>>("/v1/public/news", { params: filter })
      .then((r) => r.data);
  },

  getNewsDetail(id: string): Promise<PublicNewsDetail> {
    return api
      .get<PublicNewsDetail>(`/v1/public/news/${id}`)
      .then((r) => r.data);
  },

  listAlerts(filter: PagedFilter): Promise<PagedResult<PublicAlert>> {
    return api
      .get<PagedResult<PublicAlert>>("/v1/public/alerts", { params: filter })
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

  listDocuments(filter: PagedFilter): Promise<PagedResult<PublicDocument>> {
    return api
      .get<PagedResult<PublicDocument>>("/v1/public/documents", {
        params: filter,
      })
      .then((r) => r.data);
  },

  listRiskAnalyses(
    filter: PagedFilter,
  ): Promise<PagedResult<PublicRiskAnalysis>> {
    return api
      .get<PagedResult<PublicRiskAnalysis>>("/v1/public/risk-analyses", {
        params: filter,
      })
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
};
