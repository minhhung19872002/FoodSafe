import { api } from "@/lib/axios";
import { toCatalogPage, toCatalogRequest } from "./catalogAdapters";
import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
  CatalogPage,
  CatalogQuery,
} from "../types/catalog.types";

const basePath = "/v1/app/master-catalog";

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
