import { api } from "@/lib/axios";
import type {
  FileDownload,
  TestingResult,
  TestingResultFilter,
  CreateUpdateTestingResultInput,
  PagedResult,
} from "../types/testingResult.types";

const endpoint = "/v1/app/testing-result";
const excelEndpoint = `${endpoint}/excel`;
const masterCatalogEndpoint = "/v1/app/master-catalog";

export interface CatalogOption {
  id: string;
  name: string;
}

interface CatalogOptionPage {
  items: CatalogOption[];
}

async function fetchCatalogOptions(plural: string): Promise<CatalogOption[]> {
  const response = await api.get<CatalogOptionPage>(
    `${masterCatalogEndpoint}/${plural}`,
    { params: { maxResultCount: 200, sorting: "name" } },
  );
  return response.data.items;
}

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const testingResultApi = {
  async list(filter: TestingResultFilter): Promise<PagedResult<TestingResult>> {
    return (
      await api.get<PagedResult<TestingResult>>(endpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<TestingResult> {
    return (await api.get<TestingResult>(`${endpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateTestingResultInput): Promise<TestingResult> {
    return (await api.post<TestingResult>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateTestingResultInput,
  ): Promise<TestingResult> {
    return (await api.put<TestingResult>(`${endpoint}/${id}`, input)).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
  async testingCenterOptions(): Promise<CatalogOption[]> {
    return fetchCatalogOptions("testing-centers");
  },
  async testingServiceOptions(): Promise<CatalogOption[]> {
    return fetchCatalogOptions("testing-services");
  },
  async exportExcel(filter: TestingResultFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${excelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};
