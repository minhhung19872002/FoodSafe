import { defineLicensingVerificationSuite } from "./helpers/licensing";

defineLicensingVerificationSuite({
  featureId: "F-009",
  title: "advertisement registrations",
  endpoint: "/v1/app/advertisement-registration",
  route: "/advertisement-registrations",
  searchPlaceholder: "Số đăng ký, phương tiện, nội dung",
  numberField: "registrationNumber",
  numberPrefix: "E2E-QCV",
  needsProduct: true,
  buildCreatePayload: (businessId, number, extras) => ({
    businessId,
    productIds: [extras.productId],
    registrationNumber: number || undefined,
    registrationDate: "2026-07-01",
    contentDescription: "Nội dung quảng cáo kiểm chứng E2E",
  }),
});
