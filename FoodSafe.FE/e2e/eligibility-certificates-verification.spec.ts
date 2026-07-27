import { defineLicensingVerificationSuite } from "./helpers/licensing";

defineLicensingVerificationSuite({
  featureId: "F-010",
  title: "eligibility certificates",
  endpoint: "/v1/app/eligibility-certificate",
  route: "/eligibility-certificates",
  searchPlaceholder: "Số giấy, cơ quan cấp, phạm vi",
  numberField: "certificateNumber",
  numberPrefix: "E2E-DKV",
  buildCreatePayload: (businessId, number) => ({
    businessId,
    certificateNumber: number || undefined,
    issueDate: "2026-07-01",
    certifyingAuthority: "Chi cục ATVSTP Quảng Ninh",
  }),
});
