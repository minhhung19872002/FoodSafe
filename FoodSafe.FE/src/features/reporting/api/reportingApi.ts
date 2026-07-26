import { api } from "@/lib/axios";
import type {
  ActionMonthReport,
  ActionMonthReportFilter,
  AtpWorkReport,
  AtpWorkReportFilter,
  CreateActionMonthReportInput,
  CreateAtpWorkReportInput,
  CreateNdtpReportInput,
  NdtpReport,
  NdtpReportFilter,
  PagedResult,
  ReturnReportInput,
  UpdateActionMonthReportNarrativeInput,
  UpdateActionMonthReportStatsInput,
  UpdateAtpWorkReportNarrativeInput,
  UpdateAtpWorkReportStatsInput,
  UpdateNdtpReportNarrativeInput,
  UpdateNdtpReportStatsInput,
} from "../types/reporting.types";

const ndtpEndpoint = "/v1/app/ndtp-report";
const atpEndpoint = "/v1/app/atp-work-report";
const amrEndpoint = "/v1/app/action-month-report";

export const ndtpReportApi = {
  async list(filter: NdtpReportFilter): Promise<PagedResult<NdtpReport>> {
    return (
      await api.get<PagedResult<NdtpReport>>(ndtpEndpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<NdtpReport> {
    return (await api.get<NdtpReport>(`${ndtpEndpoint}/${id}`)).data;
  },
  async create(input: CreateNdtpReportInput): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(ndtpEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateNdtpReportStatsInput,
  ): Promise<NdtpReport> {
    return (
      await api.put<NdtpReport>(`${ndtpEndpoint}/${id}/stats`, input)
    ).data;
  },
  async updateNarrative(
    id: string,
    input: UpdateNdtpReportNarrativeInput,
  ): Promise<NdtpReport> {
    return (
      await api.put<NdtpReport>(`${ndtpEndpoint}/${id}/narrative`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${ndtpEndpoint}/${id}`);
  },
  async submit(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/submit`)).data;
  },
  async verify(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/verify`)).data;
  },
  async return(id: string, input: ReturnReportInput): Promise<NdtpReport> {
    return (
      await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/return`, input)
    ).data;
  },
  async complete(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/complete`)).data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${ndtpEndpoint}/${id}/return-to-draft`);
  },
};

export const atpWorkReportApi = {
  async list(
    filter: AtpWorkReportFilter,
  ): Promise<PagedResult<AtpWorkReport>> {
    return (
      await api.get<PagedResult<AtpWorkReport>>(atpEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<AtpWorkReport> {
    return (await api.get<AtpWorkReport>(`${atpEndpoint}/${id}`)).data;
  },
  async create(input: CreateAtpWorkReportInput): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(atpEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateAtpWorkReportStatsInput,
  ): Promise<AtpWorkReport> {
    return (
      await api.put<AtpWorkReport>(`${atpEndpoint}/${id}/stats`, input)
    ).data;
  },
  async updateNarrative(
    id: string,
    input: UpdateAtpWorkReportNarrativeInput,
  ): Promise<AtpWorkReport> {
    return (
      await api.put<AtpWorkReport>(`${atpEndpoint}/${id}/narrative`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${atpEndpoint}/${id}`);
  },
  async submit(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/submit`)).data;
  },
  async verify(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/verify`)).data;
  },
  async return(
    id: string,
    input: ReturnReportInput,
  ): Promise<AtpWorkReport> {
    return (
      await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/return`, input)
    ).data;
  },
  async complete(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/complete`))
      .data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${atpEndpoint}/${id}/return-to-draft`);
  },
};

export const actionMonthReportApi = {
  async list(
    filter: ActionMonthReportFilter,
  ): Promise<PagedResult<ActionMonthReport>> {
    return (
      await api.get<PagedResult<ActionMonthReport>>(amrEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<ActionMonthReport> {
    return (await api.get<ActionMonthReport>(`${amrEndpoint}/${id}`)).data;
  },
  async create(
    input: CreateActionMonthReportInput,
  ): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(amrEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateActionMonthReportStatsInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.put<ActionMonthReport>(`${amrEndpoint}/${id}/stats`, input)
    ).data;
  },
  async updateNarrative(
    id: string,
    input: UpdateActionMonthReportNarrativeInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.put<ActionMonthReport>(`${amrEndpoint}/${id}/narrative`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${amrEndpoint}/${id}`);
  },
  async submit(id: string): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/submit`))
      .data;
  },
  async verify(id: string): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/verify`))
      .data;
  },
  async return(
    id: string,
    input: ReturnReportInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/return`, input)
    ).data;
  },
  async complete(id: string): Promise<ActionMonthReport> {
    return (
      await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/complete`)
    ).data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${amrEndpoint}/${id}/return-to-draft`);
  },
};
