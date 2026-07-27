import { defineLicensingVerificationSuite } from "./helpers/licensing";

defineLicensingVerificationSuite({
  featureId: "F-012",
  title: "export food certificates",
  endpoint: "/v1/app/export-food-certificate",
  route: "/export-food-certificates",
  searchPlaceholder: "Tìm theo số GCN",
  numberField: "certificateNumber",
  numberPrefix: "E2E-XKV",
  buildCreatePayload: (businessId, number) => ({
    businessId,
    certificateNumber: number || undefined,
    issueDate: "2026-07-01",
  }),
});
