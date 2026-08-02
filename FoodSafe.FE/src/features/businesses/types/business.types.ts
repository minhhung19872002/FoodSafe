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

/** Khoản 1 Điều 12 Nghị định 15/2018/NĐ-CP — điểm a → k. */
export const ELIGIBILITY_EXEMPTION_REASON = {
  SmallScalePrimaryProduction: 1,
  NoFixedLocation: 2,
  SmallScalePreliminaryProcessing: 3,
  SmallScaleTrading: 4,
  PrepackagedFoodTrading: 5,
  PackagingMaterialProduction: 6,
  HotelRestaurant: 7,
  CollectiveKitchenNoRegistration: 8,
  StreetFood: 9,
  QualitySystemCertified: 10,
} as const;

export type EligibilityExemptionReason =
  (typeof ELIGIBILITY_EXEMPTION_REASON)[keyof typeof ELIGIBILITY_EXEMPTION_REASON];

export const QUALITY_CERTIFICATION_TYPE = {
  Gmp: 1,
  Haccp: 2,
  Iso22000: 3,
  Ifs: 4,
  Brc: 5,
  Fssc22000: 6,
  Other: 99,
} as const;

export type QualityCertificationType =
  (typeof QUALITY_CERTIFICATION_TYPE)[keyof typeof QUALITY_CERTIFICATION_TYPE];

export const EXEMPTION_REASON_LABELS: Record<EligibilityExemptionReason, string> =
  {
    [ELIGIBILITY_EXEMPTION_REASON.SmallScalePrimaryProduction]:
      "a) Sản xuất ban đầu nhỏ lẻ",
    [ELIGIBILITY_EXEMPTION_REASON.NoFixedLocation]:
      "b) Sản xuất, kinh doanh không có địa điểm cố định",
    [ELIGIBILITY_EXEMPTION_REASON.SmallScalePreliminaryProcessing]:
      "c) Sơ chế nhỏ lẻ",
    [ELIGIBILITY_EXEMPTION_REASON.SmallScaleTrading]:
      "d) Kinh doanh thực phẩm nhỏ lẻ",
    [ELIGIBILITY_EXEMPTION_REASON.PrepackagedFoodTrading]:
      "đ) Kinh doanh thực phẩm bao gói sẵn",
    [ELIGIBILITY_EXEMPTION_REASON.PackagingMaterialProduction]:
      "e) SXKD dụng cụ, vật liệu bao gói, chứa đựng thực phẩm",
    [ELIGIBILITY_EXEMPTION_REASON.HotelRestaurant]:
      "g) Nhà hàng trong khách sạn",
    [ELIGIBILITY_EXEMPTION_REASON.CollectiveKitchenNoRegistration]:
      "h) Bếp ăn tập thể không đăng ký ngành nghề KD thực phẩm",
    [ELIGIBILITY_EXEMPTION_REASON.StreetFood]:
      "i) Kinh doanh thức ăn đường phố",
    [ELIGIBILITY_EXEMPTION_REASON.QualitySystemCertified]:
      "k) Đã có chứng nhận GMP/HACCP/ISO 22000/IFS/BRC/FSSC 22000 còn hiệu lực",
  };

export const QUALITY_CERT_LABELS: Record<QualityCertificationType, string> = {
  [QUALITY_CERTIFICATION_TYPE.Gmp]: "GMP",
  [QUALITY_CERTIFICATION_TYPE.Haccp]: "HACCP",
  [QUALITY_CERTIFICATION_TYPE.Iso22000]: "ISO 22000",
  [QUALITY_CERTIFICATION_TYPE.Ifs]: "IFS",
  [QUALITY_CERTIFICATION_TYPE.Brc]: "BRC",
  [QUALITY_CERTIFICATION_TYPE.Fssc22000]: "FSSC 22000",
  [QUALITY_CERTIFICATION_TYPE.Other]: "Khác",
};

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
  eligibilityExemptionReason?: EligibilityExemptionReason;
  qualityCertificationType?: QualityCertificationType;
  qualityCertificationNumber?: string;
  qualityCertificationExpiry?: string;
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
  eligibilityExemptionReason?: EligibilityExemptionReason;
  qualityCertificationType?: QualityCertificationType;
  qualityCertificationNumber?: string;
  qualityCertificationExpiry?: string;
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
  status?: number;
  issuedDate?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  // Module-specific fields, each populated only by the adapter it's meaningful
  // for — mirrors the "prominent" column each feature's own list page shows.
  receiptNumber?: string;
  advertisementTypeName?: string;
  certifyingAuthority?: string;
  destinationCountryName?: string;
  lotNumber?: string;
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
  testingCenterName?: string;
  sampleDate: string;
  outcome: number;
  failedCriteria: string | null;
  certificateNumber: string | null;
}

export interface Product {
  id: string;
  businessId: string;
  businessName?: string;
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

export type {
  ExcelImportError,
  ExcelImportPreview,
  ExcelImportResult,
} from "@/types/excelImport";

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
