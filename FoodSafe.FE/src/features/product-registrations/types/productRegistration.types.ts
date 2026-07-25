export const LICENSE_STATUS = {
  Active: 1,
  Expired: 2,
  Revoked: 3,
} as const;

export type LicenseStatus =
  (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

export interface ProductRegistration {
  id: string;
  businessId: string;
  businessName: string;
  productId?: string;
  linkedProductName?: string;
  organizationId: string;
  registrationNumber: string;
  receiptNumber?: string;
  registrationDate: string;
  receiptDate?: string;
  expiryDate?: string;
  productName: string;
  manufacturer?: string;
  certifyingAuthority?: string;
  status: LicenseStatus;
  daysUntilExpiry?: number;
  revokeReason?: string;
  revokedAt?: string;
  revokedById?: string;
  notes?: string;
}

export interface ProductRegistrationInput {
  businessId: string;
  productId?: string;
  registrationNumber: string;
  receiptNumber?: string;
  registrationDate: string;
  receiptDate?: string;
  expiryDate?: string;
  productName: string;
  manufacturer?: string;
  certifyingAuthority?: string;
  notes?: string;
}

export interface ProductRegistrationFilter {
  filter?: string;
  businessId?: string;
  productId?: string;
  status?: LicenseStatus;
  expiringWithinDays?: number;
  skipCount: number;
  maxResultCount: number;
}

export interface BusinessOption {
  id: string;
  code?: string;
  name: string;
}

export interface ProductOption {
  id: string;
  businessId: string;
  code?: string;
  name: string;
}

export interface FileAttachment {
  id: string;
  originalName: string;
  fileSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export type PublicProductRegistration = Pick<
  ProductRegistration,
  | "registrationNumber"
  | "receiptNumber"
  | "registrationDate"
  | "receiptDate"
  | "expiryDate"
  | "productName"
  | "manufacturer"
  | "certifyingAuthority"
  | "businessName"
  | "status"
>;
