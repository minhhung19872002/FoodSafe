import { api } from "@/lib/axios";
import { toBusiness, toProduct } from "./businessAdapters";
import type {
  Business,
  BusinessFilter,
  BusinessHandler,
  BusinessHandlerInput,
  BusinessInput,
  ExcelDownload,
  ExcelImportPreview,
  ExcelImportResult,
  PagedResult,
  Product,
  ProductBusinessOption,
  ProductFilter,
  ProductInput,
  UpdateBusinessInput,
  UpdateProductInput,
} from "../types/business.types";

const businessEndpoint = "/v1/app/business";
const productEndpoint = "/v1/app/product";
const businessExcelEndpoint = `${businessEndpoint}/excel`;
const productExcelEndpoint = `${productEndpoint}/excel`;

function excelDownload(data: Blob, contentDisposition?: string): ExcelDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "export.xlsx"),
  };
}

export const businessApi = {
  async list(filter: BusinessFilter): Promise<PagedResult<Business>> {
    const response = await api.get<PagedResult<Business>>(businessEndpoint, {
      params: filter,
    });
    return {
      ...response.data,
      items: response.data.items.map(toBusiness),
    };
  },

  async get(id: string): Promise<Business> {
    const response = await api.get<Business>(`${businessEndpoint}/${id}`);
    return toBusiness(response.data);
  },

  async create(input: BusinessInput): Promise<Business> {
    const response = await api.post<Business>(businessEndpoint, input);
    return toBusiness(response.data);
  },

  async update(id: string, input: UpdateBusinessInput): Promise<Business> {
    const response = await api.put<Business>(
      `${businessEndpoint}/${id}`,
      input,
    );
    return toBusiness(response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${businessEndpoint}/${id}`);
  },

  async addHandler(
    businessId: string,
    input: BusinessHandlerInput,
  ): Promise<BusinessHandler> {
    const response = await api.post<BusinessHandler>(
      `${businessEndpoint}/${businessId}/handler`,
      input,
    );
    return response.data;
  },

  async updateHandler(
    businessId: string,
    handlerId: string,
    input: BusinessHandlerInput,
  ): Promise<BusinessHandler> {
    const response = await api.put<BusinessHandler>(
      `${businessEndpoint}/${businessId}/handler/${handlerId}`,
      input,
    );
    return response.data;
  },

  async deleteHandler(businessId: string, handlerId: string): Promise<void> {
    await api.delete(`${businessEndpoint}/${businessId}/handler/${handlerId}`);
  },

  async downloadTemplate(): Promise<ExcelDownload> {
    const response = await api.get<Blob>(`${businessExcelEndpoint}/template`, {
      responseType: "blob",
    });
    return excelDownload(
      response.data,
      response.headers["content-disposition"],
    );
  },

  async previewImport(file: File): Promise<ExcelImportPreview> {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post<ExcelImportPreview>(
      `${businessExcelEndpoint}/preview`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async confirmImport(confirmationToken: string): Promise<ExcelImportResult> {
    const response = await api.post<ExcelImportResult>(
      `${businessExcelEndpoint}/confirm`,
      { confirmationToken },
    );
    return response.data;
  },

  async exportExcel(filter: BusinessFilter): Promise<ExcelDownload> {
    const response = await api.get<Blob>(`${businessExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return excelDownload(
      response.data,
      response.headers["content-disposition"],
    );
  },
};

export const productApi = {
  async businessOptions(): Promise<ProductBusinessOption[]> {
    const response = await api.get<ProductBusinessOption[]>(
      `${productEndpoint}/business-options`,
    );
    return response.data;
  },

  async list(filter: ProductFilter): Promise<PagedResult<Product>> {
    const response = await api.get<PagedResult<Product>>(productEndpoint, {
      params: filter,
    });
    return {
      ...response.data,
      items: response.data.items.map(toProduct),
    };
  },

  async get(id: string): Promise<Product> {
    const response = await api.get<Product>(`${productEndpoint}/${id}`);
    return toProduct(response.data);
  },

  async create(input: ProductInput): Promise<Product> {
    const response = await api.post<Product>(productEndpoint, input);
    return toProduct(response.data);
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const response = await api.put<Product>(`${productEndpoint}/${id}`, input);
    return toProduct(response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${productEndpoint}/${id}`);
  },

  async downloadTemplate(): Promise<ExcelDownload> {
    const response = await api.get<Blob>(`${productExcelEndpoint}/template`, {
      responseType: "blob",
    });
    return excelDownload(
      response.data,
      response.headers["content-disposition"],
    );
  },

  async previewImport(file: File): Promise<ExcelImportPreview> {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post<ExcelImportPreview>(
      `${productExcelEndpoint}/preview`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async confirmImport(confirmationToken: string): Promise<ExcelImportResult> {
    const response = await api.post<ExcelImportResult>(
      `${productExcelEndpoint}/confirm`,
      { confirmationToken },
    );
    return response.data;
  },

  async exportExcel(filter: ProductFilter): Promise<ExcelDownload> {
    const response = await api.get<Blob>(`${productExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return excelDownload(
      response.data,
      response.headers["content-disposition"],
    );
  },
};
