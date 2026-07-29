import type { Business, Product } from "../types/business.types";

const nullableKeys = [
  "code",
  "businessTypeId",
  "businessClassificationId",
  "taxCode",
  "representativeName",
  "representativeIdCard",
  "contactPhone",
  "contactEmail",
  "contactWebsite",
  "addressStreet",
  "addressProvinceId",
  "addressCommuneId",
  "addressLatitude",
  "addressLongitude",
  "suspensionReason",
  "suspendedAt",
  "establishedDate",
  "employeeCount",
  "notes",
] as const satisfies readonly (keyof Business)[];

const nullableProductKeys = [
  "code",
  "productGroupId",
  "brandName",
  "manufacturer",
  "manufacturingCountryId",
  "netWeight",
  "specifications",
  "ingredients",
  "expiryPeriodMonths",
  "storageConditions",
  "usageInstructions",
  "notes",
] as const satisfies readonly (keyof Product)[];

export function toBusiness(raw: Business): Business {
  const business = { ...raw };
  for (const key of nullableKeys) {
    if (business[key] === null) {
      delete business[key];
    }
  }
  business.productGroupIds ??= [];
  business.handlers ??= [];
  return business;
}

export function toProduct(raw: Product): Product {
  const product = { ...raw };
  for (const key of nullableProductKeys) {
    if (product[key] === null) {
      delete product[key];
    }
  }
  return product;
}
