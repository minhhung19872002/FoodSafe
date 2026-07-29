import { api } from "./axios";

export interface GeographicItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CommuneItem extends GeographicItem {
  provinceId: string;
  type: number;
}

export interface GeographicUpsert {
  code: string;
  name: string;
  sortOrder?: number;
  isActive: boolean;
  provinceId?: string;
  type?: number;
}

export type GeographicKind = "province" | "commune";

export interface ListResult<T> {
  items: T[];
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

export async function getCommunesByProvince(
  provinceId: string,
  activeOnly = true,
) {
  const response = await api.get<ListResult<CommuneItem>>(
    `${endpoint}/communes-by-province/${provinceId}`,
    { params: { activeOnly } },
  );
  return response.data;
}

export async function createGeographicItem<T extends GeographicItem>(
  kind: GeographicKind,
  input: GeographicUpsert,
) {
  const response = await api.post<T>(`${endpoint}/${kind}`, input);
  return response.data;
}

export async function updateGeographicItem<T extends GeographicItem>(
  kind: GeographicKind,
  id: string,
  input: GeographicUpsert,
) {
  const response = await api.put<T>(`${endpoint}/${id}/${kind}`, input);
  return response.data;
}

export async function deleteGeographicItem(kind: GeographicKind, id: string) {
  await api.delete(`${endpoint}/${id}/${kind}`);
}
