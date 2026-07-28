/**
 * F-006 hardening — real-stack regression for two fixes:
 *
 * 1. Delete guard: a business that still owns products cannot be deleted
 *    (`FoodSafe:Business:0010`), preventing orphaned products after the
 *    soft delete. Verified over the real API and through the real UI
 *    (the toast must surface the server's Vietnamese reason, not a
 *    generic failure).
 * 2. Excel export honours the geographic filters: filtering by a province
 *    that matches nothing must yield a workbook with fewer bytes than the
 *    unfiltered export of the same scope (before the fix ProvinceId was
 *    silently dropped, so both files were identical).
 */
import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

async function csrfHeaders(page: Page) {
  return {
    RequestVerificationToken: await requestVerificationToken(page),
  };
}

test.describe("business delete guard & filtered export (F-006)", () => {
  test.setTimeout(90_000);
  // Người dùng thật chạy trình duyệt tiếng Việt; Accept-Language quyết định
  // ngôn ngữ thông điệp lỗi ABP trả về nên phải ghim vi-VN cho assertion.
  test.use({ locale: "vi-VN" });

  test("deleting a business with products is blocked until products are removed", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const request = page.context().request;
    const suffix = Date.now().toString().slice(-8);
    const businessCode = `E2E-GRD-${suffix}`;
    const businessName = `Cơ sở guard ${suffix}`;

    const orgs = await request.get(
      "/api/v1/app/organization?MaxResultCount=1",
    );
    expect(orgs.ok(), await orgs.text()).toBeTruthy();
    const organizationId = ((await orgs.json()) as { items: { id: string }[] })
      .items[0].id;

    const createdBusiness = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId,
        code: businessCode,
        name: businessName,
        productGroupIds: [],
      },
    });
    expect(createdBusiness.ok(), await createdBusiness.text()).toBeTruthy();
    const business = (await createdBusiness.json()) as { id: string };

    const createdProduct = await request.post("/api/v1/app/product", {
      headers,
      data: {
        businessId: business.id,
        code: `E2E-GRD-SP-${suffix}`,
        name: `Sản phẩm guard ${suffix}`,
      },
    });
    expect(createdProduct.ok(), await createdProduct.text()).toBeTruthy();
    const product = (await createdProduct.json()) as { id: string };

    // API: delete must be refused with the dedicated error code.
    const blockedDeletion = await request.delete(
      `/api/v1/app/business/${business.id}`,
      { headers, maxRedirects: 0 },
    );
    expect(blockedDeletion.ok()).toBeFalsy();
    expect(await blockedDeletion.text()).toContain("FoodSafe:Business:0010");

    // Real UI: the toast surfaces the server's Vietnamese reason.
    await page.goto("/businesses");
    await page
      .getByPlaceholder("Tên, mã, MST hoặc địa chỉ")
      .fill(businessCode);
    const row = page.getByRole("row").filter({ hasText: businessCode });
    await expect(row).toContainText(businessName);
    await row.getByRole("button", { name: `Thao tác ${businessName}` }).click();
    await page.getByRole("menuitem", { name: "Xóa" }).click();
    // Nhãn nút xác nhận phụ thuộc cấu hình RowActions/locale antd.
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(
      page.getByText(/Cơ sở vẫn còn sản phẩm trực thuộc/),
    ).toBeVisible();
    await expect(row).toContainText(businessName);

    // Removing the product unblocks the business deletion.
    const productDeletion = await request.delete(
      `/api/v1/app/product/${product.id}`,
      { headers, maxRedirects: 0 },
    );
    expect(productDeletion.ok(), await productDeletion.text()).toBeTruthy();
    const unblockedDeletion = await request.delete(
      `/api/v1/app/business/${business.id}`,
      { headers, maxRedirects: 0 },
    );
    expect(unblockedDeletion.ok(), await unblockedDeletion.text()).toBeTruthy();
  });

  test("business Excel export honours the geographic filter", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const request = page.context().request;
    const suffix = Date.now().toString().slice(-8);

    // Guarantee at least one exportable row regardless of database state.
    const orgs = await request.get(
      "/api/v1/app/organization?MaxResultCount=1",
    );
    expect(orgs.ok(), await orgs.text()).toBeTruthy();
    const organizationId = ((await orgs.json()) as { items: { id: string }[] })
      .items[0].id;
    const seeded = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId,
        code: `E2E-EXP-${suffix}`,
        name: `Cơ sở export ${suffix}`,
        productGroupIds: [],
      },
    });
    expect(seeded.ok(), await seeded.text()).toBeTruthy();
    const seededBusiness = (await seeded.json()) as { id: string };

    const unfiltered = await request.get("/api/v1/app/business/excel/export");
    expect(unfiltered.ok(), await unfiltered.text()).toBeTruthy();
    const unfilteredBytes = await unfiltered.body();
    expect(unfilteredBytes.subarray(0, 2).toString()).toBe("PK");

    // A province GUID that matches no business → the workbook must shrink.
    // Before the fix the ProvinceId filter was dropped and both exports
    // were byte-identical.
    const noMatchProvince = "00000000-0000-4000-8000-0000000000ff";
    const filtered = await request.get(
      `/api/v1/app/business/excel/export?ProvinceId=${noMatchProvince}`,
    );
    expect(filtered.ok(), await filtered.text()).toBeTruthy();
    const filteredBytes = await filtered.body();
    expect(filteredBytes.subarray(0, 2).toString()).toBe("PK");
    expect(filteredBytes.length).toBeLessThan(unfilteredBytes.length);

    const cleanup = await request.delete(
      `/api/v1/app/business/${seededBusiness.id}`,
      { headers, maxRedirects: 0 },
    );
    expect(cleanup.ok(), await cleanup.text()).toBeTruthy();
  });
});
