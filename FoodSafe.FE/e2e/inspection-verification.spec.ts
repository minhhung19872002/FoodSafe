import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

async function createDraftPlan(page: Page, planCode: string) {
  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const response = await page
    .context()
    .request.post("/api/v1/app/inspection-plan", {
      headers,
      data: {
        planCode,
        title: `Kế hoạch kiểm chứng ${planCode}`,
        planType: 3,
        year: new Date().getFullYear(),
        items: [],
      },
    });
  expect(response.ok(), await response.text()).toBeTruthy();
  return {
    plan: (await response.json()) as { id: string },
    headers,
  };
}

async function deletePlan(
  page: Page,
  planId: string,
  headers: Record<string, string>,
) {
  await page
    .context()
    .request.delete(`/api/v1/app/inspection-plan/${planId}`, {
      headers,
      maxRedirects: 0,
    });
}

test.describe("inspection verification (F-013)", () => {
  // Server error toasts are localized by Accept-Language; assert the VN texts.
  test.use({ locale: "vi-VN" });

  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/inspection-plan", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without inspection permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page
        .context()
        .request.get("/api/v1/app/inspection-plan", { maxRedirects: 0 });
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("cross-organization plan is hidden and blocked", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const planCode = `E2E-KHV-SCOPE-${suffix}`;
    const { plan, headers } = await createDraftPlan(page, planCode);

    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const list = await district.page
        .context()
        .request.get(
          `/api/v1/app/inspection-plan?Filter=${planCode}&MaxResultCount=10`,
        );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as {
        items: { planCode?: string }[];
      };
      expect(payload.items.filter((x) => x.planCode === planCode)).toHaveLength(
        0,
      );

      const detail = await district.page
        .context()
        .request.get(`/api/v1/app/inspection-plan/${plan.id}`, {
          maxRedirects: 0,
        });
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await deletePlan(page, plan.id, headers);
    }
  });

  test("invalid workflow transition is rejected by backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const planCode = `E2E-KHV-WF-${suffix}`;
    const { plan, headers } = await createDraftPlan(page, planCode);
    try {
      const approve = await page
        .context()
        .request.post(`/api/v1/app/inspection-plan/${plan.id}/approve`, {
          headers,
          maxRedirects: 0,
        });
      expect(approve.ok()).toBeFalsy();

      const submitWithoutBusiness = await page
        .context()
        .request.post(`/api/v1/app/inspection-plan/${plan.id}/submit`, {
          headers,
          maxRedirects: 0,
        });
      expect(submitWithoutBusiness.status()).toBe(403);
      expect(await submitWithoutBusiness.text()).toContain(
        "FoodSafe:Inspection:0004",
      );
    } finally {
      await deletePlan(page, plan.id, headers);
    }
  });

  test("server-side validation rejects incomplete input", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    const response = await page
      .context()
      .request.post("/api/v1/app/inspection-plan", {
        headers,
        data: { title: "Thiếu mã kế hoạch", planType: 3, year: 2026 },
        maxRedirects: 0,
      });
    expect(response.status()).toBe(400);
  });

  test("client validation, duplicate prevention, persistence after reload", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const planCode = `E2E-KHV-UI-${suffix}`;

    await page.goto("/inspection");
    await expect(
      page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Tạo kế hoạch" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Tạo kế hoạch thanh kiểm tra",
    });
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(dialog.getByText("Vui lòng nhập mã kế hoạch.")).toBeVisible();
    await expect(dialog.getByText("Vui lòng nhập tên kế hoạch.")).toBeVisible();

    await dialog.getByRole("textbox", { name: "Mã kế hoạch" }).fill(planCode);
    await dialog
      .getByRole("textbox", { name: "Tên kế hoạch" })
      .fill(`Kế hoạch UI ${suffix}`);
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText(planCode)).toBeVisible();

    await page.reload();
    await expect(page.getByText(planCode)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Tạo kế hoạch" }).click();
    const duplicateDialog = page.getByRole("dialog", {
      name: "Tạo kế hoạch thanh kiểm tra",
    });
    await duplicateDialog
      .getByRole("textbox", { name: "Mã kế hoạch" })
      .fill(planCode);
    await duplicateDialog
      .getByRole("textbox", { name: "Tên kế hoạch" })
      .fill("Trùng mã kế hoạch");
    await duplicateDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(
      page.getByText("Mã kế hoạch đã tồn tại."),
    ).toBeVisible({ timeout: 10_000 });
    await duplicateDialog.getByRole("button", { name: "Hủy" }).click();

    const row = page.getByRole("row").filter({ hasText: planCode });
    await row.getByRole("button", { name: `Thao tác ${planCode}` }).click();
    await page.getByRole("menuitem", { name: "Xóa" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(page.getByText(planCode)).not.toBeVisible({
      timeout: 10_000,
    });

    await page.reload();
    await expect(page.getByText(planCode)).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test("empty state renders for unmatched search", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/inspection");
    await page
      .getByPlaceholder("Mã kế hoạch, tên kế hoạch")
      .fill("KHONG-TON-TAI-XYZ-99999");
    await page.keyboard.press("Enter");
    const activePane = page.getByRole("tabpanel", { name: "Kế hoạch" });
    await expect(
      activePane.locator(".ant-empty-description", { hasText: "Trống" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      activePane.locator("table tbody tr.ant-table-row"),
    ).toHaveCount(0);
  });
});
