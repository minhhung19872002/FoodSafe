import { z } from "zod";
import type { CatalogInput, CatalogKind } from "./catalog.types";

const optionalText = z.string().trim().optional().or(z.literal(""));

const catalogSchema = z.object({
  code: z.string().trim().min(1, "Vui lòng nhập mã").max(50),
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  codeAlpha2: optionalText,
  codeAlpha3: optionalText,
  nameVi: optionalText,
  nameEn: z.string().trim().max(200).optional().or(z.literal("")),
  level: z.number().int().min(1).max(2).optional(),
  parentId: optionalText,
  criteria: z.string().trim().max(2000).optional().or(z.literal("")),
  riskLevel: z.number().int().min(1).max(3).optional(),
  address: optionalText,
  provinceId: optionalText,
  communeId: optionalText,
  contactPerson: optionalText,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{6,20}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .optional()
    .or(z.literal("")),
  accreditationNumber: optionalText,
  accreditationScope: optionalText,
  accreditationExpiresAt: optionalText,
  testingCenterId: optionalText,
  unit: optionalText,
  method: optionalText,
  price: z.number().min(0, "Đơn giá không được âm").optional(),
  turnaroundDays: z.number().int().min(0, "Thời gian không được âm").optional(),
  legalReference: z.string().trim().max(500).optional().or(z.literal("")),
  minFine: z.number().min(0, "Mức phạt không được âm").optional(),
  maxFine: z.number().min(0, "Mức phạt không được âm").optional(),
});

function requireField(
  value: unknown,
  path: keyof CatalogInput,
  message: string,
  context: z.core.$RefinementCtx,
) {
  if (value === undefined || value === null || value === "") {
    context.addIssue({ code: "custom", path: [path], message });
  }
}

export function createCatalogSchema(kind: CatalogKind) {
  return catalogSchema.superRefine((values, context) => {
    if (kind === "country") {
      if (values.code.length !== 2) {
        context.addIssue({
          code: "custom",
          path: ["code"],
          message: "Mã ISO Alpha-2 phải có đúng 2 ký tự",
        });
      }
      if (values.codeAlpha3 && values.codeAlpha3.length !== 3) {
        context.addIssue({
          code: "custom",
          path: ["codeAlpha3"],
          message: "Mã ISO Alpha-3 phải có đúng 3 ký tự",
        });
      }
    }

    if (kind === "product-group") {
      requireField(values.level, "level", "Vui lòng chọn cấp", context);
      if (values.level === 2) {
        requireField(
          values.parentId,
          "parentId",
          "Vui lòng chọn nhóm cha",
          context,
        );
      }
    }

    if (kind === "business-classification") {
      requireField(
        values.criteria,
        "criteria",
        "Vui lòng nhập tiêu chí phân loại",
        context,
      );
      requireField(
        values.riskLevel,
        "riskLevel",
        "Vui lòng chọn mức rủi ro",
        context,
      );
    }

    if (kind === "testing-center") {
      requireField(values.address, "address", "Vui lòng nhập địa chỉ", context);
      requireField(
        values.provinceId,
        "provinceId",
        "Vui lòng chọn tỉnh/thành phố",
        context,
      );
      requireField(
        values.accreditationNumber,
        "accreditationNumber",
        "Vui lòng nhập số công nhận",
        context,
      );
      requireField(
        values.accreditationScope,
        "accreditationScope",
        "Vui lòng nhập phạm vi công nhận",
        context,
      );
      requireField(
        values.accreditationExpiresAt,
        "accreditationExpiresAt",
        "Vui lòng chọn ngày hết hạn",
        context,
      );
    }

    if (kind === "violation-type") {
      requireField(
        values.legalReference,
        "legalReference",
        "Vui lòng nhập căn cứ pháp lý (điều, khoản)",
        context,
      );
      if (
        values.minFine !== undefined &&
        values.maxFine !== undefined &&
        values.minFine > values.maxFine
      ) {
        context.addIssue({
          code: "custom",
          path: ["maxFine"],
          message: "Mức phạt tối đa phải lớn hơn hoặc bằng mức tối thiểu",
        });
      }
    }

    if (kind === "testing-service") {
      requireField(
        values.testingCenterId,
        "testingCenterId",
        "Vui lòng chọn trung tâm kiểm nghiệm",
        context,
      );
      requireField(values.unit, "unit", "Vui lòng nhập đơn vị", context);
      requireField(
        values.method,
        "method",
        "Vui lòng nhập phương pháp",
        context,
      );
      requireField(values.price, "price", "Vui lòng nhập đơn giá", context);
      requireField(
        values.turnaroundDays,
        "turnaroundDays",
        "Vui lòng nhập thời gian trả kết quả",
        context,
      );
    }
  });
}
