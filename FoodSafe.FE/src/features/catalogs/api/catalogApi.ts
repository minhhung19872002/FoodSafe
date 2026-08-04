import { api } from "@/lib/axios";
import type {
  ExcelImportPreview,
  ExcelImportResult,
  FileDownload,
} from "@/types/excelImport";
import { toCatalogPage, toCatalogRequest } from "./catalogAdapters";
import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
  CatalogPage,
  CatalogQuery,
} from "../types/catalog.types";

const basePath = "/v1/app/master-catalog";
const excelPath = `${basePath}/excel`;

const pluralPaths: Record<CatalogKind, string> = {
  country: "countries",
  region: "regions",
  "product-group": "product-groups",
  "business-type": "business-types",
  "business-classification": "business-classifications",
  "advertisement-type": "advertisement-types",
  "document-type": "document-types",
  "testing-center": "testing-centers",
  "testing-service": "testing-services",
  "violation-type": "violation-types",
};

/** Tên enum MasterCatalogKind phía backend, dùng làm query param. */
const importKinds: Record<CatalogKind, string> = {
  country: "Country",
  region: "Region",
  "product-group": "ProductGroup",
  "business-type": "BusinessType",
  "business-classification": "BusinessClassification",
  "advertisement-type": "AdvertisementType",
  "document-type": "DocumentType",
  "testing-center": "TestingCenter",
  "testing-service": "TestingService",
  "violation-type": "ViolationType",
};

export async function fetchCatalog(
  kind: CatalogKind,
  params: CatalogQuery,
): Promise<CatalogPage> {
  const response = await api.get<CatalogPage>(
    `${basePath}/${pluralPaths[kind]}`,
    { params },
  );
  return toCatalogPage(kind, response.data);
}

export async function persistCatalog(
  kind: CatalogKind,
  input: CatalogInput,
  id?: string,
): Promise<CatalogItem> {
  const url = id ? `${basePath}/${id}/${kind}` : `${basePath}/${kind}`;
  const body = toCatalogRequest(kind, input);
  const response = id
    ? await api.put<CatalogItem>(url, body)
    : await api.post<CatalogItem>(url, body);
  return response.data;
}

export async function removeCatalog(
  kind: CatalogKind,
  id: string,
): Promise<void> {
  await api.delete(`${basePath}/${id}/${kind}`);
}

export type { FileDownload } from "@/types/excelImport";

function toFileDownload(
  blob: Blob,
  disposition: string | undefined,
): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/)?.[1];
  return { blob, fileName: decodeURIComponent(encoded ?? plain ?? "download") };
}

export async function exportTestingServices(
  filter?: string,
): Promise<FileDownload> {
  const response = await api.get<Blob>(
    `${basePath}/testing-services/excel/export`,
    { params: { filter: filter || undefined }, responseType: "blob" },
  );
  return toFileDownload(
    response.data,
    response.headers["content-disposition"] as string | undefined,
  );
}

export async function exportViolationTypes(
  filter?: string,
): Promise<FileDownload> {
  const response = await api.get<Blob>(
    `${basePath}/violation-types/excel/export`,
    { params: { filter: filter || undefined }, responseType: "blob" },
  );
  return toFileDownload(
    response.data,
    response.headers["content-disposition"] as string | undefined,
  );
}

export async function downloadCatalogTemplate(
  kind: CatalogKind,
): Promise<FileDownload> {
  const response = await api.get<Blob>(`${excelPath}/template`, {
    params: { kind: importKinds[kind] },
    responseType: "blob",
  });
  return toFileDownload(
    response.data,
    response.headers["content-disposition"] as string | undefined,
  );
}

export async function previewCatalogImport(
  kind: CatalogKind,
  file: File,
): Promise<ExcelImportPreview> {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post<ExcelImportPreview>(
    `${excelPath}/preview`,
    form,
    { params: { kind: importKinds[kind] } },
  );
  return response.data;
}

export async function confirmCatalogImport(
  confirmationToken: string,
): Promise<ExcelImportResult> {
  const response = await api.post<ExcelImportResult>(`${excelPath}/confirm`, {
    confirmationToken,
  });
  return response.data;
}
