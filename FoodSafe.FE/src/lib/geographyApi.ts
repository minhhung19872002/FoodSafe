import { api } from "./axios";

export interface GeographicItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface DistrictItem extends GeographicItem {
  provinceId: string;
  type: number;
}

export interface CommuneItem extends GeographicItem {
  districtId: string;
  type: number;
}

export interface GeographicUpsert {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  provinceId?: string;
  districtId?: string;
  type?: number;
}

export interface ListResult<T> {
  items: T[];
}

export interface ImportGeographyErrorDto {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportGeographyResultDto {
  importedDistricts: number;
  importedCommunes: number;
  skippedRows: number;
  errors: ImportGeographyErrorDto[];
}

const endpoint = "/v1/app/geographic-catalog";

export async function getGeographicItems<
  T extends GeographicItem = GeographicItem,
>(path: string, params?: Record<string, string | boolean>) {
  const response = await api.get<ListResult<T>>(`${endpoint}/${path}`, {
    params,
  });
  return response.data;
}

export async function createGeographicItem<T extends GeographicItem>(
  kind: "province" | "district" | "commune",
  input: GeographicUpsert,
) {
  const response = await api.post<T>(`${endpoint}/${kind}`, input);
  return response.data;
}

export async function updateGeographicItem<T extends GeographicItem>(
  kind: "province" | "district" | "commune",
  id: string,
  input: GeographicUpsert,
) {
  const response = await api.put<T>(`${endpoint}/${id}/${kind}`, input);
  return response.data;
}

export async function deleteGeographicItem(
  kind: "province" | "district" | "commune",
  id: string,
) {
  await api.delete(`${endpoint}/${id}/${kind}`);
}

export async function importGeographyFromExcel(
  provinceId: string,
  file: File,
): Promise<ImportGeographyResultDto> {
  const form = new FormData();
  form.append("provinceId", provinceId);
  form.append("file", file);
  const response = await api.post<ImportGeographyResultDto>(
    `${endpoint}/excel/import`,
    form,
  );
  return response.data;
}
