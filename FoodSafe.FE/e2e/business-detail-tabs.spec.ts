/**
 * FR-19-11..16 — the per-business "Hồ sơ cơ sở" detail drawer aggregates the
 * business's related records across five tabs, each scoped to that business:
 *   • Tự công bố            → GET /api/v1/app/self-declaration?businessId=…
 *   • Đăng ký công bố       → GET /api/v1/app/product-registration?businessId=…
 *   • Quảng cáo             → GET /api/v1/app/advertisement-registration?businessId=…
 *   • GCN đủ điều kiện      → GET /api/v1/app/eligibility-certificate?businessId=…
 *   • Kết quả thanh kiểm tra→ GET /api/v1/app/inspection-result?businessId=…
 *
 * Driven through the REAL UI with no interception. To avoid brittle hard-coded
 * IDs, the test DISCOVERS a real business that actually owns a self-declaration
 * by reading the real self-declaration list endpoint (authenticated, real HTTP)
 * and reusing the DTO's businessId/businessName. It then opens that business's
 * drawer through the real browser and, for every tab, asserts that the real
 * business-scoped GET fires and returns 200 (the businessId query parameter is
 * checked so the scoping is proven, not just that a table renders). The
 * data-bearing "Tự công bố" tab is additionally asserted to show ≥1 real row.
 */

import { expect, test, type Page, type Response } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

interface SelfDeclarationRow {
  businessId: string;
  businessName: string;
}

/** Discovers a real business that owns at least one self-declaration. */
async function discoverBusinessWithRelatedData(
  page: Page,
): Promise<SelfDeclarationRow> {
  const res = await page.context().request.get(
    "/api/v1/app/self-declaration?MaxResultCount=1",
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { items: SelfDeclarationRow[] };
  expect(
    body.items.length,
    "need at least one self-declaration to anchor the business detail test",
  ).toBeGreaterThan(0);
  const row = body.items[0];
  expect(row.businessId).toBeTruthy();
  expect(row.businessName).toBeTruthy();
  return row;
}

/** Builds a predicate matching a business-scoped GET to the given app endpoint. */
function scopedGet(endpoint: string, businessId: string) {
  return (resp: Response): boolean =>
    resp.request().method() === "GET" &&
    resp.url().includes(`/api/v1/app/${endpoint}`) &&
    resp.url().includes(`businessId=${businessId}`);
}

test.describe("FR-19-11..16 — business detail drawer related-record tabs", () => {
  test.setTimeout(90_000);

  test("each tab loads the business-scoped related records from the real backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const { businessId, businessName } =
      await discoverBusinessWithRelatedData(page);

    await page.goto("/businesses");
    await page.getByPlaceholder("Tên, mã, MST hoặc địa chỉ").fill(businessName);
    await page.getByPlaceholder("Tên, mã, MST hoặc địa chỉ").press("Enter");

    // Opening the drawer immediately fires the default tab's scoped request;
    // that default is now the products tab.
    const productsPromise = page.waitForResponse(
      scopedGet("product", businessId),
    );
    await page
      .getByRole("button", { name: `Hồ sơ ${businessName}` })
      .first()
      .click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toContainText(`Hồ sơ cơ sở: ${businessName}`, {
      timeout: 10_000,
    });

    // FR-19-14 — Sản phẩm (default tab): real scoped GET.
    expect((await productsPromise).status()).toBe(200);

    // FR-19-11..16 — every other record tab fires its own business-scoped GET.
    const tabs: { label: string; endpoint: string }[] = [
      { label: "Tự công bố", endpoint: "self-declaration" },
      { label: "Đăng ký công bố", endpoint: "product-registration" },
      { label: "Quảng cáo", endpoint: "advertisement-registration" },
      { label: "GCN đủ điều kiện", endpoint: "eligibility-certificate" },
      { label: "CFS", endpoint: "cfs-certificate" },
      { label: "GCN xuất khẩu", endpoint: "export-food-certificate" },
      { label: "Thanh kiểm tra", endpoint: "inspection-result" },
    ];

    for (const { label, endpoint } of tabs) {
      const tab = drawer.getByRole("tab", { name: label, exact: true });
      const respPromise = page.waitForResponse(scopedGet(endpoint, businessId));
      // The drawer animates in, so a first click can land before the tab strip
      // settles; confirm the tab actually became active before waiting on it.
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute("aria-selected", "true", {
          timeout: 2_000,
        });
      }).toPass({ timeout: 15_000 });
      expect(
        (await respPromise).status(),
        `${label} tab must load ${endpoint} for the business`,
      ).toBe(200);
      // The tab's table structure renders (header row present).
      await expect(
        page.getByRole("tabpanel").getByRole("table").first(),
      ).toBeVisible();
      if (label === "Tự công bố") {
        // The anchor business owns a self-declaration, so this tab has data.
        await expect(
          page.getByRole("tabpanel").locator("tbody tr.ant-table-row").first(),
        ).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
