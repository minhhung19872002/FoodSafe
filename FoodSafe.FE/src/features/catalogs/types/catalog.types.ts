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

export interface CatalogPage {
  items: CatalogItem[];
  totalCount: number;
}

export interface CatalogQuery {
  filter?: string;
  isActive?: boolean;
  skipCount?: number;
  maxResultCount?: number;
}

export interface CatalogDefinition {
  kind: CatalogKind;
  label: string;
}

export const catalogDefinitions: readonly CatalogDefinition[] = [
  { kind: "country", label: "Quốc gia" },
  { kind: "region", label: "Vùng" },
  { kind: "business-classification", label: "Phân loại cơ sở" },
  { kind: "product-group", label: "Nhóm sản phẩm" },
  { kind: "business-type", label: "Loại hình cơ sở" },
  { kind: "advertisement-type", label: "Loại quảng cáo" },
  { kind: "testing-center", label: "Trung tâm kiểm nghiệm" },
  { kind: "testing-service", label: "Dịch vụ kiểm nghiệm" },
  { kind: "document-type", label: "Loại văn bản" },
] as const;
