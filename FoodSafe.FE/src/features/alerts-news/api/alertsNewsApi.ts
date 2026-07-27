import { api } from "@/lib/axios";
import type {
  AlertFilter,
  AlertOption,
  AtpAlert,
  AtpNews,
  CreateUpdateAlertInput,
  CreateUpdateNewsInput,
  FileDownload,
  NewsFilter,
  PagedResult,
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
  async exportExcel(filter: AlertFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${alertEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
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
};
