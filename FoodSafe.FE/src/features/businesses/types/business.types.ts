export const BUSINESS_STATUS = {
  Active: 1,
  Inactive: 2,
  Suspended: 3,
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

export const PRODUCT_STATUS = {
  Active: 1,
  Inactive: 2,
} as const;

export type ProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export interface BusinessHandler {
  id: string;
  businessId: string;
  fullName: string;
  position?: string;
  idCardNumber?: string;
  trainingCertificateNumber?: string;
  trainingDate?: string;
  trainingOrganization?: string;
  trainingExpiryDate?: string;
  healthCertificateNumber?: string;
  healthCheckDate?: string;
  healthCheckFacility?: string;
  healthCheckExpiryDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface BusinessHandlerInput {
  fullName: string;
  position?: string;
  idCardNumber?: string;
  trainingCertificateNumber?: string;
  trainingDate?: string;
  trainingOrganization?: string;
  trainingExpiryDate?: string;
  healthCertificateNumber?: string;
  healthCheckDate?: string;
  healthCheckFacility?: string;
  healthCheckExpiryDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface Business {
  id: string;
  organizationId: string;
  code?: string;
  name: string;
  businessTypeId?: string;
  businessClassificationId?: string;
  taxCode?: string;
  representativeName?: string;
  representativeIdCard?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  addressStreet?: string;
  addressProvinceId?: string;
  addressCommuneId?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  status: BusinessStatus;
  suspensionReason?: string;
  suspendedAt?: string;
  hasEligibilityCertificate: boolean;
  hasVsattpCommitment: boolean;
  establishedDate?: string;
  employeeCount?: number;
  notes?: string;
  productGroupIds: string[];
  handlers: BusinessHandler[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface BusinessInput {
  organizationId: string;
  code?: string;
  name: string;
  businessTypeId?: string;
  businessClassificationId?: string;
  taxCode?: string;
  representativeName?: string;
  representativeIdCard?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  addressStreet?: string;
  addressProvinceId?: string;
  addressCommuneId?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  establishedDate?: string;
  employeeCount?: number;
  notes?: string;
  productGroupIds: string[];
}

export interface UpdateBusinessInput extends BusinessInput {
  status: BusinessStatus;
  suspensionReason?: string;
  suspendedAt?: string;
  hasEligibilityCertificate: boolean;
  hasVsattpCommitment: boolean;
}

export interface BusinessFilter {
  filter?: string;
  organizationId?: string;
  businessTypeId?: string;
  businessClassificationId?: string;
  status?: BusinessStatus;
  hasEligibilityCertificate?: boolean;
  provinceId?: string;
  communeId?: string;
  sorting?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface BusinessRelatedRecord {
  id: string;
  number?: string;
  name?: string;
  status?: number | string;
  issuedDate?: string;
  expiryDate?: string;
}

export interface BusinessInspectionRecord {
  id: string;
  inspectionDate: string;
  overallResult: number;
  hasViolation: boolean;
  violationDescription?: string;
  adminDecisionNumber?: string;
}

export interface BusinessTestingRecord {
  id: string;
  sampleCode: string;
  sampleName: string;
  sampleDate: string;
  outcome: number;
  failedCriteria: string | null;
  certificateNumber: string | null;
}

export interface Product {
  id: string;
  businessId: string;
  organizationId: string;
  code?: string;
  name: string;
  productGroupId?: string;
  brandName?: string;
  manufacturer?: string;
  manufacturingCountryId?: string;
  netWeight?: string;
  specifications?: string;
  ingredients?: string;
  expiryPeriodMonths?: number;
  storageConditions?: string;
  usageInstructions?: string;
  status: ProductStatus;
  notes?: string;
}

export interface ProductInput {
  businessId: string;
  code?: string;
  name: string;
  productGroupId?: string;
  brandName?: string;
  manufacturer?: string;
  manufacturingCountryId?: string;
  netWeight?: string;
  specifications?: string;
  ingredients?: string;
  expiryPeriodMonths?: number;
  storageConditions?: string;
  usageInstructions?: string;
  notes?: string;
}

export interface UpdateProductInput extends ProductInput {
  status: ProductStatus;
}

export interface ProductFilter {
  filter?: string;
  businessId?: string;
  productGroupId?: string;
  status?: ProductStatus;
  sorting?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface ProductBusinessOption {
  id: string;
  code?: string;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface BusinessPagedResult extends PagedResult<Business> {
  hasRestrictedScope: boolean;
}

export interface ExcelDownload {
  blob: Blob;
  fileName: string;
}

export interface ExcelImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ExcelImportPreview {
  confirmationToken?: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: ExcelImportError[];
}

export interface ExcelImportResult {
  importedCount: number;
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

export const BUSINESS_STATUS_CONFIG: Record<
  BusinessStatus,
  { color: string; label: string }
> = {
  [BUSINESS_STATUS.Active]: { color: "green", label: "Đang hoạt động" },
  [BUSINESS_STATUS.Inactive]: { color: "default", label: "Ngừng hoạt động" },
  [BUSINESS_STATUS.Suspended]: { color: "red", label: "Đình chỉ" },
};

export interface PublicBusiness {
  name: string;
  code?: string;
  taxCode?: string;
  representativeName?: string;
  contactPhone?: string;
  addressStreet?: string;
  status: BusinessStatus;
  hasEligibilityCertificate: boolean;
  hasVsattpCommitment: boolean;
}

export interface PublicSelfDeclaration {
  id: string;
  declarationNumber: string;
  declarationDate: string;
  productName: string;
  productStandard?: string;
  businessName: string;
  status: number;
}
