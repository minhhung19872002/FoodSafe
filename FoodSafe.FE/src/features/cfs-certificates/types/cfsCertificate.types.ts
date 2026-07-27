export const LICENSE_STATUS = {
  Active: 1,
  Expired: 2,
  Revoked: 3,
} as const;

export type LicenseStatus =
  (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

export interface CfsCertificate {
  id: string;
  businessId: string;
  businessName: string;
  productId?: string;
  linkedProductName?: string;
  destinationCountryId: string;
  destinationCountryName: string;
  organizationId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  certifyingAuthority?: string;
  status: LicenseStatus;
  daysUntilExpiry?: number;
  revokeReason?: string;
  revokedAt?: string;
  revokedById?: string;
  notes?: string;
}

export interface CfsCertificateInput {
  businessId: string;
  productId?: string;
  destinationCountryId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  certifyingAuthority?: string;
  notes?: string;
}

export interface CfsCertificateFilter {
  filter?: string;
  businessId?: string;
  productId?: string;
  destinationCountryId?: string;
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

export interface CountryOption {
  id: string;
  code: string;
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

export interface PublicCfsCertificate {
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  productName?: string;
  destinationCountryName: string;
  certifyingAuthority?: string;
  businessName: string;
  status: LicenseStatus;
}
