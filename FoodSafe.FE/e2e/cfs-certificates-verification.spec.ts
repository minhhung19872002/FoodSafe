import { expect } from "@playwright/test";
import { defineLicensingVerificationSuite } from "./helpers/licensing";

defineLicensingVerificationSuite({
  featureId: "F-011",
  title: "CFS certificates",
  endpoint: "/v1/app/cfs-certificate",
  route: "/cfs-certificates",
  searchPlaceholder: "Tìm theo số CFS",
  numberField: "certificateNumber",
  numberPrefix: "E2E-CFSV",
  fetchExtras: async (page) => {
    const response = await page.context().request.get(
      "/api/v1/app/cfs-certificate/country-options",
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    const countries = (await response.json()) as { id: string }[];
    expect(countries.length).toBeGreaterThan(0);
    return { destinationCountryId: countries[0].id };
  },
  buildCreatePayload: (businessId, number, extras) => ({
    businessId,
    destinationCountryId: extras.destinationCountryId,
    certificateNumber: number || undefined,
    issueDate: "2026-07-01",
  }),
});
