import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
  CatalogPage,
} from "../types/catalog.types";

interface CountryDto extends Omit<CatalogItem, "code" | "name"> {
  code?: string;
  name?: string;
  codeAlpha2?: string;
  nameVi?: string;
}

function nullableToUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function toCatalogItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    description: nullableToUndefined(item.description),
    codeAlpha2: nullableToUndefined(item.codeAlpha2),
    codeAlpha3: nullableToUndefined(item.codeAlpha3),
    nameVi: nullableToUndefined(item.nameVi),
    nameEn: nullableToUndefined(item.nameEn),
    level: nullableToUndefined(item.level),
    parentId: nullableToUndefined(item.parentId),
    criteria: nullableToUndefined(item.criteria),
    riskLevel: nullableToUndefined(item.riskLevel),
    address: nullableToUndefined(item.address),
    provinceId: nullableToUndefined(item.provinceId),
    communeId: nullableToUndefined(item.communeId),
    contactPerson: nullableToUndefined(item.contactPerson),
    phone: nullableToUndefined(item.phone),
    email: nullableToUndefined(item.email),
    accreditationNumber: nullableToUndefined(item.accreditationNumber),
    accreditationScope: nullableToUndefined(item.accreditationScope),
    accreditationExpiresAt: nullableToUndefined(item.accreditationExpiresAt),
    testingCenterId: nullableToUndefined(item.testingCenterId),
    unit: nullableToUndefined(item.unit),
    method: nullableToUndefined(item.method),
    price: nullableToUndefined(item.price),
    turnaroundDays: nullableToUndefined(item.turnaroundDays),
    legalReference: nullableToUndefined(item.legalReference),
    minFine: nullableToUndefined(item.minFine),
    maxFine: nullableToUndefined(item.maxFine),
  };
}

export function toCatalogPage(
  kind: CatalogKind,
  page: CatalogPage,
): CatalogPage {
  return {
    ...page,
    items: page.items.map((rawItem) => {
      const item = toCatalogItem(rawItem);
      if (kind !== "country") return item;

      const country = item as CountryDto;
      return {
        ...item,
        code: country.codeAlpha2 ?? country.code ?? "",
        name: country.nameVi ?? country.name ?? "",
      };
    }),
  };
}

export function toCatalogRequest(
  kind: CatalogKind,
  input: CatalogInput,
): CatalogInput | Record<string, string | number | boolean | undefined> {
  if (kind !== "country") return input;

  return {
    codeAlpha2: input.code,
    codeAlpha3: input.codeAlpha3,
    nameVi: input.name,
    nameEn: input.nameEn,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
}
