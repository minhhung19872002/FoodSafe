export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export const DOCUMENT_STATUS = {
  Active: 1,
  Expired: 2,
  Revoked: 3,
} as const;
export type DocumentStatus =
  (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const DOCUMENT_STATUS_CONFIG: Record<
  DocumentStatus,
  { color: string; label: string }
> = {
  [DOCUMENT_STATUS.Active]: { color: "green", label: "Hiệu lực" },
  [DOCUMENT_STATUS.Expired]: { color: "orange", label: "Hết hiệu lực" },
  [DOCUMENT_STATUS.Revoked]: { color: "red", label: "Thu hồi" },
};

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface AdministrativeDocument {
  id: string;
  organizationId: string;
  documentTypeId: string;
  documentTypeName: string | null;
  documentNumber: string;
  title: string;
  issuingAuthority: string | null;
  issuedDate: string;
  effectiveDate: string | null;
  expiryDate: string | null;
  summary: string | null;
  status: DocumentStatus;
  isPublic: boolean;
  creationTime: string;
}

export interface CreateUpdateDocumentInput {
  documentTypeId: string;
  documentNumber: string;
  title: string;
  issuingAuthority?: string;
  issuedDate: string;
  effectiveDate?: string;
  expiryDate?: string;
  summary?: string;
  status: DocumentStatus;
  isPublic: boolean;
}

export interface DocumentFilter {
  filter?: string;
  documentTypeId?: string;
  status?: DocumentStatus;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}
