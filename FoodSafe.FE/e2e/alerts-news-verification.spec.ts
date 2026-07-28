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

async function csrfHeaders(page: Page) {
  return {
    RequestVerificationToken: await requestVerificationToken(page),
  };
}

async function createDraftAlert(
  page: Page,
  headers: Record<string, string>,
  title: string,
) {
  const response = await page.context().request.post("/api/v1/app/atp-alert", {
    headers,
    data: {
      title,
      content: "Nội dung cảnh báo kiểm chứng E2E",
      category: 1,
      severity: 2,
      source: 1,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string };
}

async function deleteAlert(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(`/api/v1/app/atp-alert/${id}`, {
    headers,
    maxRedirects: 0,
  });
}

test.describe("alerts and news verification (F-016)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    for (const endpoint of ["/api/v1/app/atp-alert", "/api/v1/app/atp-news"]) {
      const response = await request.get(endpoint, { maxRedirects: 0 });
      expect([401, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    }
  });

  test("user without alerts permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/atp-alert",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("publish/recall workflow with audit and invalid transitions", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-ALERTV Cảnh báo ${suffix}`;
    const alert = await createDraftAlert(page, headers, title);
    const request = page.context().request;
    const base = `/api/v1/app/atp-alert/${alert.id}`;

    try {
      const recallDraft = await request.post(`${base}/recall`, {
        headers,
        maxRedirects: 0,
        data: { reason: "Thu hồi khi chưa xuất bản" },
      });
      expect(recallDraft.ok()).toBeFalsy();

      const publish = await request.post(`${base}/publish`, {
        headers,
        maxRedirects: 0,
        data: { isPublic: true },
      });
      expect(publish.ok(), await publish.text()).toBeTruthy();

      const publishAgain = await request.post(`${base}/publish`, {
        headers,
        maxRedirects: 0,
        data: { isPublic: true },
      });
      expect(publishAgain.ok()).toBeFalsy();

      const editPublished = await request.put(base, {
        headers,
        maxRedirects: 0,
        data: {
          title: `${title} đã sửa`,
          content: "Sửa sau khi xuất bản",
          category: 1,
          severity: 2,
          source: 1,
        },
      });
      expect(editPublished.ok()).toBeFalsy();

      const recallNoReason = await request.post(`${base}/recall`, {
        headers,
        maxRedirects: 0,
        data: {},
      });
      expect(recallNoReason.ok()).toBeFalsy();

      const recall = await request.post(`${base}/recall`, {
        headers,
        maxRedirects: 0,
        data: { reason: "Thông tin không chính xác (E2E)" },
      });
      expect(recall.ok(), await recall.text()).toBeTruthy();
      const recalled = (await recall.json()) as {
        status?: number | string;
        recalledById?: string | null;
        recalledAt?: string | null;
        recallReason?: string | null;
      };
      expect(String(recalled.status)).toMatch(/^(Recalled|3)$/);
      expect(recalled.recalledById).toBeTruthy();
      expect(recalled.recalledAt).toBeTruthy();
      expect(recalled.recallReason).toContain("E2E");

      const doubleRecall = await request.post(`${base}/recall`, {
        headers,
        maxRedirects: 0,
        data: { reason: "Thu hồi lần hai" },
      });
      expect(doubleRecall.ok()).toBeFalsy();
    } finally {
      await deleteAlert(page, headers, alert.id);
    }
  });

  test("server-side validation rejects incomplete input", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const missingTitle = await page.context().request.post(
      "/api/v1/app/atp-alert",
      {
        headers,
        maxRedirects: 0,
        data: { content: "Thiếu tiêu đề", category: 1, severity: 2, source: 1 },
      },
    );
    expect(missingTitle.status()).toBe(400);

    const invalidSource = await page.context().request.post(
      "/api/v1/app/atp-alert",
      {
        headers,
        maxRedirects: 0,
        data: {
          title: "Nguồn không hợp lệ",
          content: "source = 0 phải bị chặn ở tầng validation",
          category: 1,
          severity: 2,
          source: 0,
        },
      },
    );
    expect(invalidSource.status()).toBe(400);
  });

  test("linked references and length limits are validated server-side", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const request = page.context().request;
    const bogusId = "11111111-2222-3333-4444-555555555555";

    const bogusBusiness = await request.post("/api/v1/app/atp-alert", {
      headers,
      maxRedirects: 0,
      data: {
        title: "Cơ sở không tồn tại",
        content: "businessId lạ phải bị chặn, không được trả 500",
        category: 1,
        severity: 2,
        source: 1,
        businessId: bogusId,
      },
    });
    expect([400, 403]).toContain(bogusBusiness.status());
    expect(await bogusBusiness.text()).toContain("FoodSafe:Alert:0005");

    const bogusLinkedAlert = await request.post("/api/v1/app/atp-news", {
      headers,
      maxRedirects: 0,
      data: {
        title: "Cảnh báo liên kết không tồn tại",
        content: "linkedAlertIds lạ phải bị chặn, không được trả 500",
        linkedAlertIds: [bogusId],
      },
    });
    expect([400, 403]).toContain(bogusLinkedAlert.status());
    expect(await bogusLinkedAlert.text()).toContain("FoodSafe:News:0007");

    const longSummary = await request.post("/api/v1/app/atp-news", {
      headers,
      maxRedirects: 0,
      data: {
        title: "Tóm tắt quá dài",
        content: "summary 1500 ký tự phải trả 400",
        summary: "x".repeat(1500),
      },
    });
    expect(longSummary.status()).toBe(400);

    const longPhone = await request.post("/api/v1/app/atp-alert", {
      headers,
      maxRedirects: 0,
      data: {
        title: "SĐT quá dài",
        content: "reporterPhone 30 ký tự phải trả 400",
        category: 1,
        severity: 2,
        source: 1,
        reporterPhone: "0".repeat(30),
      },
    });
    expect(longPhone.status()).toBe(400);
  });

  test("editing a draft alert can change its source", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const alert = await createDraftAlert(
      page,
      headers,
      `E2E-ALERTV Nguồn ${suffix}`,
    );

    try {
      const update = await page.context().request.put(
        `/api/v1/app/atp-alert/${alert.id}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            title: `E2E-ALERTV Nguồn ${suffix}`,
            content: "Đổi nguồn từ Nội bộ sang Từ dân",
            category: 1,
            severity: 2,
            source: 2,
          },
        },
      );
      expect(update.ok(), await update.text()).toBeTruthy();
      const updated = (await update.json()) as { source: number | string };
      expect(String(updated.source)).toMatch(/^(PublicReport|2)$/);
    } finally {
      await deleteAlert(page, headers, alert.id);
    }
  });

  test("persistence after reload and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-ALERTV UI ${suffix}`;
    const alert = await createDraftAlert(page, headers, title);

    try {
      await page.goto("/alerts-news");
      const search = page.getByPlaceholder("Tìm theo tiêu đề, số cảnh báo...");
      await search.fill(title);
      await page.keyboard.press("Enter");
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

      await page.reload();
      await page
        .getByPlaceholder("Tìm theo tiêu đề, số cảnh báo...")
        .fill(title);
      await page.keyboard.press("Enter");
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

      await page
        .getByPlaceholder("Tìm theo tiêu đề, số cảnh báo...")
        .fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page.getByText("Không tìm thấy kết quả phù hợp").first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteAlert(page, headers, alert.id);
    }
  });
});
