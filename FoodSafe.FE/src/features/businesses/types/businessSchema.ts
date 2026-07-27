import { z } from "zod";
import { BUSINESS_STATUS, PRODUCT_STATUS } from "./business.types";

const optionalText = z.string().trim().optional().or(z.literal(""));
const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const guid = (message: string) => z.string().regex(guidPattern, message);
const optionalGuid = z.string().regex(guidPattern).optional().or(z.literal(""));

export const businessSchema = z
  .object({
    organizationId: guid("Vui lòng chọn đơn vị quản lý"),
    code: z.string().trim().max(50).optional().or(z.literal("")),
    name: z.string().trim().min(1, "Vui lòng nhập tên cơ sở").max(500),
    businessTypeId: optionalGuid,
    businessClassificationId: optionalGuid,
    taxCode: z.string().trim().max(50).optional().or(z.literal("")),
    representativeName: z.string().trim().max(200).optional().or(z.literal("")),
    representativeIdCard: z
      .string()
      .trim()
      .max(50)
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().trim().max(50).optional().or(z.literal("")),
    contactEmail: z
      .string()
      .trim()
      .email("Email không hợp lệ")
      .optional()
      .or(z.literal("")),
    contactWebsite: z
      .string()
      .trim()
      .url("Website không hợp lệ")
      .optional()
      .or(z.literal("")),
    addressStreet: optionalText,
    addressProvinceId: optionalGuid,
    addressDistrictId: optionalGuid,
    addressCommuneId: optionalGuid,
    addressLatitude: z.number().min(-90).max(90).optional(),
    addressLongitude: z.number().min(-180).max(180).optional(),
    establishedDate: optionalText,
    employeeCount: z.number().int().min(0).optional(),
    notes: optionalText,
    productGroupIds: z.array(guid("Nhóm sản phẩm không hợp lệ")),
    status: z.union([
      z.literal(BUSINESS_STATUS.Active),
      z.literal(BUSINESS_STATUS.Inactive),
      z.literal(BUSINESS_STATUS.Suspended),
    ]),
    suspensionReason: optionalText,
    hasEligibilityCertificate: z.boolean(),
    hasVsattpCommitment: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.status === BUSINESS_STATUS.Suspended && !value.suspensionReason) {
      context.addIssue({
        code: "custom",
        path: ["suspensionReason"],
        message: "Vui lòng nhập lý do đình chỉ",
      });
    }
    if (
      (value.addressLatitude === undefined) !==
      (value.addressLongitude === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["addressLatitude"],
        message: "Vui lòng chọn đủ tọa độ trên bản đồ",
      });
    }
  });

export type BusinessFormValues = z.infer<typeof businessSchema>;

export const productSchema = z.object({
  businessId: guid("Vui lòng chọn cơ sở"),
  code: z.string().trim().max(50).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm").max(500),
  productGroupId: optionalGuid,
  brandName: z.string().trim().max(200).optional().or(z.literal("")),
  manufacturer: z.string().trim().max(300).optional().or(z.literal("")),
  manufacturingCountryId: optionalGuid,
  netWeight: z.string().trim().max(100).optional().or(z.literal("")),
  specifications: optionalText,
  ingredients: optionalText,
  expiryPeriodMonths: z.number().int().min(0).optional(),
  storageConditions: optionalText,
  usageInstructions: optionalText,
  notes: optionalText,
  status: z.union([
    z.literal(PRODUCT_STATUS.Active),
    z.literal(PRODUCT_STATUS.Inactive),
  ]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const businessHandlerSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(200),
  position: z.string().trim().max(200).optional().or(z.literal("")),
  idCardNumber: z.string().trim().max(50).optional().or(z.literal("")),
  trainingCertificateNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),
  trainingDate: optionalText,
  trainingOrganization: z.string().trim().max(300).optional().or(z.literal("")),
  trainingExpiryDate: optionalText,
  healthCertificateNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),
  healthCheckDate: optionalText,
  healthCheckFacility: z.string().trim().max(300).optional().or(z.literal("")),
  healthCheckExpiryDate: optionalText,
  isActive: z.boolean(),
  notes: optionalText,
});

export type BusinessHandlerFormValues = z.infer<typeof businessHandlerSchema>;
