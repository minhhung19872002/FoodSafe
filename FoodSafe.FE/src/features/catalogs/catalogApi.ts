import { api } from "@/lib/axios";

export type CatalogKind =
  | "country"
  | "region"
  | "product-group"
  | "business-type"
  | "business-classification"
  | "advertisement-type"
  | "document-type"
  | "testing-center"
  | "testing-service";

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  codeAlpha2?: string;
  codeAlpha3?: string;
  nameVi?: string;
  nameEn?: string;
  level?: number;
  parentId?: string;
  criteria?: string;
  riskLevel?: number;
  address?: string;
  provinceId?: string;
  districtId?: string;
  communeId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  accreditationNumber?: string;
  accreditationScope?: string;
  accreditationExpiresAt?: string;
  testingCenterId?: string;
  unit?: string;
  method?: string;
  price?: number;
  turnaroundDays?: number;
}

export type CatalogInput = Omit<CatalogItem, "id">;

interface PagedResult {
  items: CatalogItem[];
  totalCount: number;
}

const base = "/v1/app/master-catalog";
const plurals: Record<CatalogKind, string> = {
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

export async function getCatalog(
  kind: CatalogKind,
  params: Record<string, string | number | boolean | undefined>,
) {
  const response = await api.get<PagedResult>(`${base}/${plurals[kind]}`, {
    params,
  });
  const items =
    kind === "country"
      ? response.data.items.map((item) => ({
          ...item,
          code: item.codeAlpha2 ?? "",
          name: item.nameVi ?? "",
        }))
      : response.data.items;
  return { ...response.data, items };
}

export async function saveCatalog(
  kind: CatalogKind,
  input: CatalogInput,
  id?: string,
) {
  const body =
    kind === "country"
      ? {
          codeAlpha2: input.code,
          codeAlpha3: input.codeAlpha3,
          nameVi: input.name,
          nameEn: input.nameEn,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
        }
      : input;
  const url = id ? `${base}/${id}/${kind}` : `${base}/${kind}`;
  const response = id
    ? await api.put<CatalogItem>(url, body)
    : await api.post<CatalogItem>(url, body);
  return response.data;
}

export async function deleteCatalog(kind: CatalogKind, id: string) {
  await api.delete(`${base}/${id}/${kind}`);
}
