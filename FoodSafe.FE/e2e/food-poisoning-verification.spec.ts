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

async function createDraftCase(page: Page, victimName: string) {
  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const response = await page.context().request.post(
    "/api/v1/app/food-poisoning-case",
    {
      headers,
      data: {
        reportDate: "2026-07-27",
        victimName,
        location: "Địa điểm kiểm chứng E2E",
        suspectedFood: "Thực phẩm kiểm chứng",
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  return {
    caseItem: (await response.json()) as { id: string },
    headers,
  };
}

async function deleteCase(
  page: Page,
  caseId: string,
  headers: Record<string, string>,
) {
  await page.context().request.delete(
    `/api/v1/app/food-poisoning-case/${caseId}`,
    { headers, maxRedirects: 0 },
  );
}

test.describe("food poisoning verification (F-014)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/food-poisoning-case", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without food poisoning permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/food-poisoning-case",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("cross-organization case is hidden and blocked", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const victimName = `E2E-NDTPV-SCOPE-${suffix}`;
    const { caseItem, headers } = await createDraftCase(page, victimName);

    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const list = await district.page.context().request.get(
        `/api/v1/app/food-poisoning-case?Filter=${victimName}&MaxResultCount=10`,
      );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as {
        items: { victimName?: string }[];
      };
      expect(
        payload.items.filter((x) => x.victimName === victimName),
      ).toHaveLength(0);

      const detail = await district.page.context().request.get(
        `/api/v1/app/food-poisoning-case/${caseItem.id}`,
        { maxRedirects: 0 },
      );
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await deleteCase(page, caseItem.id, headers);
    }
  });

  test("invalid workflow transition is rejected by backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const { caseItem, headers } = await createDraftCase(
      page,
      `E2E-NDTPV-WF-${suffix}`,
    );
    try {
      const verifyDraft = await page.context().request.post(
        `/api/v1/app/food-poisoning-case/${caseItem.id}/verify`,
        { headers, maxRedirects: 0 },
      );
      expect(verifyDraft.ok()).toBeFalsy();
      expect(await verifyDraft.text()).toContain("FoodSafe:FoodPoisoning");

      const submit = await page.context().request.post(
        `/api/v1/app/food-poisoning-case/${caseItem.id}/submit`,
        { headers, maxRedirects: 0 },
      );
      expect(submit.ok(), await submit.text()).toBeTruthy();

      const submitAgain = await page.context().request.post(
        `/api/v1/app/food-poisoning-case/${caseItem.id}/submit`,
        { headers, maxRedirects: 0 },
      );
      expect(submitAgain.ok()).toBeFalsy();

      const editSubmitted = await page.context().request.put(
        `/api/v1/app/food-poisoning-case/${caseItem.id}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            reportDate: "2026-07-27",
            victimName: "Sửa sau khi gửi",
          },
        },
      );
      expect(editSubmitted.ok()).toBeFalsy();
    } finally {
      await deleteCase(page, caseItem.id, headers);
    }
  });

  test("server-side validation rejects oversized input", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    const response = await page.context().request.post(
      "/api/v1/app/food-poisoning-case",
      {
        headers,
        maxRedirects: 0,
        data: {
          reportDate: "2026-07-27",
          victimName: "A".repeat(201),
        },
      },
    );
    expect(response.status()).toBe(400);
  });

  test("persistence after reload and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const victimName = `E2E-NDTPV-UI-${suffix}`;
    const { caseItem, headers } = await createDraftCase(page, victimName);
    try {
      await page.goto("/food-poisoning");
      await page
        .getByPlaceholder("Tìm theo mã ca, tên nạn nhân...")
        .fill(victimName);
      await page.keyboard.press("Enter");
      await expect(page.getByText(victimName)).toBeVisible({
        timeout: 10_000,
      });

      await page.reload();
      await page
        .getByPlaceholder("Tìm theo mã ca, tên nạn nhân...")
        .fill(victimName);
      await page.keyboard.press("Enter");
      await expect(page.getByText(victimName)).toBeVisible({
        timeout: 10_000,
      });

      await page
        .getByPlaceholder("Tìm theo mã ca, tên nạn nhân...")
        .fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page
          .locator(".ant-empty-description", { hasText: "Trống" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteCase(page, caseItem.id, headers);
    }
  });
});
