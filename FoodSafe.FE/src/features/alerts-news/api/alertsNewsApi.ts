import { api } from "@/lib/axios";
import type {
  AlertFilter,
  AlertOption,
  AssignAlertInput,
  AtpAlert,
  AtpNews,
  CreateUpdateAlertInput,
  CreateUpdateNewsInput,
  FileDownload,
  NewsFilter,
  PagedResult,
  StaffUserOption,
} from "../types/alertsNews.types";

const alertEndpoint = "/v1/app/atp-alert";
const newsEndpoint = "/v1/app/atp-news";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const alertApi = {
  async list(filter: AlertFilter): Promise<PagedResult<AtpAlert>> {
    return (
      await api.get<PagedResult<AtpAlert>>(alertEndpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<AtpAlert> {
    return (await api.get<AtpAlert>(`${alertEndpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateAlertInput): Promise<AtpAlert> {
    return (await api.post<AtpAlert>(alertEndpoint, input)).data;
  },
  async update(id: string, input: CreateUpdateAlertInput): Promise<AtpAlert> {
    return (await api.put<AtpAlert>(`${alertEndpoint}/${id}`, input)).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${alertEndpoint}/${id}`);
  },
  async publish(id: string, isPublic = true): Promise<AtpAlert> {
    return (
      await api.post<AtpAlert>(`${alertEndpoint}/${id}/publish`, { isPublic })
    ).data;
  },
  async recall(id: string, reason: string): Promise<AtpAlert> {
    return (
      await api.post<AtpAlert>(`${alertEndpoint}/${id}/recall`, { reason })
    ).data;
  },
  /** Moderation refusal of a draft (STT 29) — keeps the record with its reason. */
  async reject(id: string, reason: string): Promise<AtpAlert> {
    return (
      await api.post<AtpAlert>(`${alertEndpoint}/${id}/reject`, { reason })
    ).data;
  },
  /** Assign a citizen-submitted draft alert to a staff member (FR-29-06 assign step). */
  async assign(id: string, input: AssignAlertInput): Promise<AtpAlert> {
    return (await api.post<AtpAlert>(`${alertEndpoint}/${id}/assign`, input))
      .data;
  },
  async exportExcel(filter: AlertFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${alertEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};

/**
 * Lightweight user list for the moderation-queue assignee Select.
 * Calls the same administration endpoint used by the identity feature — no
 * cross-feature import required because this is a plain API call.
 */
export const staffApi = {
  async listUsers(
    filter?: string,
  ): Promise<{ totalCount: number; items: StaffUserOption[] }> {
    return (
      await api.get<{ totalCount: number; items: StaffUserOption[] }>(
        "/v1/administration/users",
        { params: { filter, maxResultCount: 200, isActive: true } },
      )
    ).data;
  },
};

export const newsApi = {
  async list(filter: NewsFilter): Promise<PagedResult<AtpNews>> {
    return (
      await api.get<PagedResult<AtpNews>>(newsEndpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<AtpNews> {
    return (await api.get<AtpNews>(`${newsEndpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateNewsInput): Promise<AtpNews> {
    return (await api.post<AtpNews>(newsEndpoint, input)).data;
  },
  async update(id: string, input: CreateUpdateNewsInput): Promise<AtpNews> {
    return (await api.put<AtpNews>(`${newsEndpoint}/${id}`, input)).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${newsEndpoint}/${id}`);
  },
  async publish(id: string, isPublic = true): Promise<AtpNews> {
    return (
      await api.post<AtpNews>(`${newsEndpoint}/${id}/publish`, { isPublic })
    ).data;
  },
  async recall(id: string): Promise<AtpNews> {
    return (await api.post<AtpNews>(`${newsEndpoint}/${id}/recall`)).data;
  },
  /** Moderation refusal of a draft (STT 30) — keeps the record with its reason. */
  async reject(id: string, reason: string): Promise<AtpNews> {
    return (await api.post<AtpNews>(`${newsEndpoint}/${id}/reject`, { reason }))
      .data;
  },
  async alertOptions(filter?: string): Promise<AlertOption[]> {
    return (
      await api.get<AlertOption[]>(`${newsEndpoint}/alert-options`, {
        params: { filter },
      })
    ).data;
  },
  async exportExcel(filter: NewsFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${newsEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },

  /**
   * Upload a thumbnail image for a news article.
   * Returns the storagePath to be submitted with the news form.
   */
  async uploadThumbnail(file: File): Promise<{ storagePath: string }> {
    const form = new FormData();
    form.append("file", file);
    return (
      await api.post<{ storagePath: string }>(
        `${newsEndpoint}/thumbnail`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
    ).data;
  },

  /** URL to serve a previously uploaded thumbnail (authenticated endpoint). */
  thumbnailUrl(storagePath: string): string {
    return `/api/v1/app/atp-news/thumbnail?path=${encodeURIComponent(storagePath)}`;
  },
};
