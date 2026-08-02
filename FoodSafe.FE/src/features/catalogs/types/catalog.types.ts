export type CatalogKind =
  | "country"
  | "region"
  | "product-group"
  | "business-type"
  | "business-classification"
  | "advertisement-type"
  | "document-type"
  | "testing-center"
  | "testing-service"
  | "violation-type";

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
  legalReference?: string;
  minFine?: number;
  maxFine?: number;
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
  { kind: "violation-type", label: "Hành vi vi phạm (NĐ 115/2018)" },
] as const;

/** Khung phạt cá nhân, ví dụ "1.000.000 – 3.000.000 đ"; tổ chức gấp 2 lần. */
export function formatFineRange(minFine?: number, maxFine?: number): string {
  if (minFine === undefined || maxFine === undefined) return "—";
  return `${minFine.toLocaleString("vi-VN")} – ${maxFine.toLocaleString("vi-VN")} đ`;
}
