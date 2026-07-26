import type {
  BusinessOption,
  FileAttachment,
  FileDownload,
  LicenseStatus,
  PagedResult,
  ProductOption,
} from "@/features/product-registrations/types/productRegistration.types";

export {
  LICENSE_STATUS,
  type BusinessOption,
  type FileAttachment,
  type FileDownload,
  type LicenseStatus,
  type PagedResult,
  type ProductOption,
} from "@/features/product-registrations/types/productRegistration.types";

export interface AdvertisementTypeOption {
  id: string;
  code: string;
  name: string;
}

export interface AdvertisementRegistration {
  id: string;
  businessId: string;
  businessName: string;
  organizationId: string;
  advertisementTypeId?: string;
  advertisementTypeName?: string;
  registrationNumber: string;
  registrationDate: string;
  expiryDate?: string;
  contentDescription?: string;
  medium?: string;
  status: LicenseStatus;
  daysUntilExpiry?: number;
  revokeReason?: string;
  notes?: string;
  products: ProductOption[];
}

export interface AdvertisementRegistrationInput {
  businessId: string;
  advertisementTypeId?: string;
  registrationNumber: string;
  registrationDate: string;
  expiryDate?: string;
  contentDescription?: string;
  medium?: string;
  notes?: string;
  productIds: string[];
}

export interface AdvertisementRegistrationFilter {
  filter?: string;
  businessId?: string;
  advertisementTypeId?: string;
  productId?: string;
  status?: LicenseStatus;
  expiringWithinDays?: number;
  skipCount: number;
  maxResultCount: number;
}

export type AdvertisementPagedResult = PagedResult<AdvertisementRegistration>;
export type AdvertisementAttachment = FileAttachment;
export type AdvertisementDownload = FileDownload;
export type AdvertisementBusinessOption = BusinessOption;

export interface PublicAdRegistration {
  registrationNumber: string;
  registrationDate: string;
  expiryDate?: string;
  contentDescription?: string;
  medium?: string;
  businessName: string;
  status: LicenseStatus;
}
