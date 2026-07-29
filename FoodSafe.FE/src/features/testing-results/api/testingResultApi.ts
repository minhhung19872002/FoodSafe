import dayjs from "dayjs";
import { api } from "@/lib/axios";
import type {
  FileDownload,
  LookupOption,
  TestingResult,
  TestingResultFilter,
  CreateUpdateTestingResultInput,
  PagedResult,
} from "../types/testingResult.types";

const endpoint = "/v1/app/testing-result";
const excelEndpoint = `${endpoint}/excel`;
const masterCatalogEndpoint = "/v1/app/master-catalog";
// Sampled-facility / sampled-product / related-inspection lookups are served by
// the BusinessManagement + Inspection modules. They are reached here as plain
// HTTP contracts from this feature's own api/ folder — no cross-feature import.
const productEndpoint = "/v1/app/product";
const inspectionResultEndpoint = "/v1/app/inspection-result";

const OPTION_PAGE_SIZE = 200;
const INSPECTION_OPTION_PAGE_SIZE = 50;
/** `ProductStatus.Active` — only sellable products may be sampled. */
const PRODUCT_STATUS_ACTIVE = 1;

interface NamedOptionDto {
  id: string;
  name: string;
}

interface CodedOptionDto extends NamedOptionDto {
  code: string | null;
}

interface InspectionResultOptionDto {
  id: string;
  inspectionDate: string;
  adminDecisionNumber: string | null;
}

function toNamedOption(dto: NamedOptionDto): LookupOption {
  return { value: dto.id, label: dto.name };
}

function toCodedOption(dto: CodedOptionDto): LookupOption {
  return {
    value: dto.id,
    label: dto.code?.trim() ? `${dto.name} (${dto.code.trim()})` : dto.name,
  };
}

function toInspectionResultOption(
  dto: InspectionResultOptionDto,
): LookupOption {
  const date = dayjs(dto.inspectionDate).format("DD/MM/YYYY");
  return {
    value: dto.id,
    label: dto.adminDecisionNumber?.trim()
      ? `${date} — QĐ ${dto.adminDecisionNumber.trim()}`
      : date,
  };
}

async function fetchCatalogOptions(plural: string): Promise<LookupOption[]> {
  const response = await api.get<PagedResult<NamedOptionDto>>(
    `${masterCatalogEndpoint}/${plural}`,
    { params: { maxResultCount: OPTION_PAGE_SIZE, sorting: "name" } },
  );
  return response.data.items.map(toNamedOption);
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
  async testingCenterOptions(): Promise<LookupOption[]> {
    return fetchCatalogOptions("testing-centers");
  },
  async testingServiceOptions(): Promise<LookupOption[]> {
    return fetchCatalogOptions("testing-services");
  },
  /** Facilities the current user may sample from (`Products.View` scoped). */
  async businessOptions(): Promise<LookupOption[]> {
    const response = await api.get<CodedOptionDto[]>(
      `${productEndpoint}/business-options`,
    );
    return response.data.map(toCodedOption);
  },
  /** Products of one facility — cascades from the selected facility. */
  async productOptions(businessId: string): Promise<LookupOption[]> {
    const response = await api.get<PagedResult<CodedOptionDto>>(
      productEndpoint,
      {
        params: {
          businessId,
          status: PRODUCT_STATUS_ACTIVE,
          maxResultCount: OPTION_PAGE_SIZE,
        },
      },
    );
    return response.data.items.map(toCodedOption);
  },
  /** Inspection results recorded for one facility, newest first. */
  async inspectionResultOptions(businessId: string): Promise<LookupOption[]> {
    const response = await api.get<PagedResult<InspectionResultOptionDto>>(
      inspectionResultEndpoint,
      {
        params: { businessId, maxResultCount: INSPECTION_OPTION_PAGE_SIZE },
      },
    );
    return response.data.items.map(toInspectionResultOption);
  },
  async exportExcel(filter: TestingResultFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${excelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },

  /**
   * Upload a phiếu kiểm nghiệm PDF.
   * Returns the storagePath to be submitted with the testing result form.
   */
  async uploadPdf(file: File): Promise<{ storagePath: string }> {
    const form = new FormData();
    form.append("file", file);
    return (
      await api.post<{ storagePath: string }>(
        `${endpoint}/pdf`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
    ).data;
  },

  /** URL to serve a previously uploaded phiếu kiểm nghiệm PDF (authenticated endpoint). */
  pdfUrl(storagePath: string): string {
    return `/api/v1/app/testing-result/pdf?path=${encodeURIComponent(storagePath)}`;
  },
};
