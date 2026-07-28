import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

/**
 * Regression cover for the itemised-violation set on an inspection result.
 *
 * The editor modal used to submit `violations: []` on every save while the
 * server replaces the whole collection on update, so editing any field of a
 * result silently destroyed its violation records — violation code, legal
 * reference, fine, remedy deadline and remediation state. The previous suite
 * never touched violations at all, so a full green run said nothing about it.
 */

interface Violation {
  id: string;
  violationCode?: string;
  description: string;
  regulationReference?: string;
  fineAmount?: number;
  remedyRequired?: string;
  remedyDeadline?: string;
  isRemedied: boolean;
}

interface InspectionResultPayload {
  id: string;
  violations: Violation[];
}

const VIOLATIONS = [
  {
    violationCode: "VP-01",
    description: "Không có giấy khám sức khỏe cho nhân viên chế biến",
    regulationReference: "Điều 5 Nghị định 155/2018/NĐ-CP",
    fineAmount: 3_000_000,
    remedyRequired: "Bổ sung hồ sơ khám sức khỏe",
    remedyDeadline: "2026-12-31",
  },
  {
    violationCode: "VP-02",
    description: "Khu vực chế biến chưa tách biệt khu vực chứa chất thải",
    regulationReference: "Điều 4 Nghị định 155/2018/NĐ-CP",
    fineAmount: 5_000_000,
    remedyRequired: "Bố trí lại mặt bằng",
    remedyDeadline: "2026-11-30",
  },
];

async function jsonHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function readResult(
  request: APIRequestContext,
  id: string,
): Promise<InspectionResultPayload> {
  const response = await request.get(`/api/v1/app/inspection-result/${id}`);
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as InspectionResultPayload;
}

test.describe("inspection violations verification", () => {
  test("editing a result preserves its itemised violations", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = await jsonHeaders(page);

    const orgResponse = await request.get(
      "/api/v1/app/organization?MaxResultCount=1",
    );
    expect(orgResponse.ok(), await orgResponse.text()).toBeTruthy();
    const organization = (
      (await orgResponse.json()) as { items: { id: string }[] }
    ).items[0];
    expect(organization, "seeded organization").toBeDefined();

    const suffix = Date.now().toString().slice(-8);
    const businessResponse = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: organization.id,
        code: `E2E-VP-CS-${suffix}`,
        name: `Cơ sở vi phạm ${suffix}`,
        productGroupIds: [],
      },
    });
    expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
    const business = (await businessResponse.json()) as { id: string };

    const createResponse = await request.post("/api/v1/app/inspection-result", {
      headers,
      data: {
        businessId: business.id,
        inspectionDate: "2026-07-01",
        inspectionType: 1,
        overallResult: 2,
        hasViolation: true,
        violationDescription: `Kiểm chứng vi phạm ${suffix}`,
        followUpRequired: false,
        violations: VIOLATIONS,
        inspectors: [],
      },
    });
    expect(createResponse.ok(), await createResponse.text()).toBeTruthy();
    const created = (await createResponse.json()) as InspectionResultPayload;

    try {
      // Baseline: the server really stored both violations.
      const afterCreate = await readResult(request, created.id);
      expect(afterCreate.violations).toHaveLength(2);
      expect(afterCreate.violations.map((v) => v.violationCode).sort()).toEqual(
        ["VP-01", "VP-02"],
      );

      // Edit through the real UI: open the result, change one unrelated field.
      await page.goto("/inspection");
      await page.getByRole("tab", { name: /Kết quả/ }).click();
      const row = page.getByRole("row", {
        name: new RegExp(`vi phạm ${suffix}`, "i"),
      });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Sửa" }).click();

      const dialog = page.getByRole("dialog", {
        name: "Cập nhật kết quả kiểm tra",
      });
      await expect(dialog).toBeVisible();

      // The form must hydrate the existing violations, otherwise saving wipes
      // them. Playwright has no getByDisplayValue, so assert on the inputs'
      // value attribute directly.
      await expect(
        dialog.locator('input[value="VP-01"]'),
        "violation VP-01 must be hydrated into the form",
      ).toBeVisible();
      await expect(dialog.locator('input[value="VP-02"]')).toBeVisible();

      const recommendations = dialog.getByLabel("Kiến nghị");
      await recommendations.fill(`Cập nhật kiến nghị ${suffix}`);
      await dialog.getByRole("button", { name: "Lưu" }).click();
      await expect(dialog).toBeHidden();

      // The regression assertion: violations survive an unrelated edit.
      const afterEdit = await readResult(request, created.id);
      expect(
        afterEdit.violations,
        "editing a result must not delete its violations",
      ).toHaveLength(2);

      const byCode = new Map(
        afterEdit.violations.map((v) => [v.violationCode, v]),
      );
      expect(byCode.get("VP-01")?.fineAmount).toBe(3_000_000);
      expect(byCode.get("VP-01")?.regulationReference).toBe(
        "Điều 5 Nghị định 155/2018/NĐ-CP",
      );
      expect(byCode.get("VP-02")?.remedyRequired).toBe("Bố trí lại mặt bằng");

      // Persistence survives a reload, not just the in-memory cache.
      await page.reload();
      const afterReload = await readResult(request, created.id);
      expect(afterReload.violations).toHaveLength(2);
    } finally {
      await request.delete(`/api/v1/app/inspection-result/${created.id}`, {
        headers,
      });
      await request.delete(`/api/v1/app/business/${business.id}`, { headers });
    }
  });
});
