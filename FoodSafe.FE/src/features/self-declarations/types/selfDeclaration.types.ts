export const LICENSE_STATUS = {
  Active: 1,
  Expired: 2,
  Revoked: 3,
} as const;

export type LicenseStatus =
  (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

export interface SelfDeclaration {
  id: string;
  businessId: string;
  businessName: string;
  productId?: string;
  linkedProductName?: string;
  organizationId: string;
  declarationNumber: string;
  declarationDate: string;
  productName: string;
  manufacturer?: string;
  purpose?: string;
  expiryDate?: string;
  status: LicenseStatus;
  daysUntilExpiry?: number;
  revokeReason?: string;
  revokedAt?: string;
  revokedById?: string;
  notes?: string;
}

export interface SelfDeclarationInput {
  businessId: string;
  productId?: string;
  declarationNumber: string;
  declarationDate: string;
  productName: string;
  manufacturer?: string;
  purpose?: string;
  expiryDate?: string;
  notes?: string;
}

export interface SelfDeclarationFilter {
  filter?: string;
  businessId?: string;
  productId?: string;
  status?: LicenseStatus;
  expiringWithinDays?: number;
  sorting?: string;
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
  documentOwnerId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  virusScanStatus: number;
  uploadTime: string;
  description?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}
