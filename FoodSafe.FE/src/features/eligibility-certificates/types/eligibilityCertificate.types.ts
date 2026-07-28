export const LICENSE_STATUS = {
  Active: 1,
  Expired: 2,
  Revoked: 3,
} as const;

export type LicenseStatus =
  (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

export interface EligibilityCertificate {
  id: string;
  businessId: string;
  businessName: string;
  organizationId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  certifyingAuthority?: string;
  certificationScope?: string;
  status: LicenseStatus;
  daysUntilExpiry?: number;
  revokeReason?: string;
  revokedAt?: string;
  revokedById?: string;
  notes?: string;
}

export interface EligibilityCertificateInput {
  businessId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  certifyingAuthority?: string;
  certificationScope?: string;
  notes?: string;
}

export interface EligibilityCertificateFilter {
  filter?: string;
  businessId?: string;
  status?: LicenseStatus;
  expiringWithinDays?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface BusinessOption {
  id: string;
  code?: string;
  name: string;
}

export interface PublicEligibilityCertificate {
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  certifyingAuthority?: string;
  certificationScope?: string;
  businessName: string;
  status: LicenseStatus;
}

export interface FileAttachment {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType?: string;
  uploadTime?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}
