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

async function createDraftAnalysis(
  page: Page,
  headers: Record<string, string>,
  title: string,
) {
  const response = await page.context().request.post(
    "/api/v1/app/risk-analysis",
    {
      headers,
      data: {
        title,
        content: "Nội dung phân tích nguy cơ kiểm chứng E2E",
        category: 4,
        riskLevel: 3,
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string };
}

async function deleteAnalysis(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(`/api/v1/app/risk-analysis/${id}`, {
    headers,
    maxRedirects: 0,
  });
}

test.describe("risk analysis verification (F-018)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/risk-analysis", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without risk-analysis permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/risk-analysis",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("publish workflow: draft-only edits, publish once, immutable after", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-RAV Phân tích ${suffix}`;
    const analysis = await createDraftAnalysis(page, headers, title);
    const request = page.context().request;
    const base = `/api/v1/app/risk-analysis/${analysis.id}`;

    try {
      const publish = await request.post(`${base}/publish`, {
        headers,
        maxRedirects: 0,
      });
      expect(publish.ok(), await publish.text()).toBeTruthy();
      const published = (await publish.json()) as {
        status?: number | string;
        publishedById?: string | null;
        publishedAt?: string | null;
      };
      expect(String(published.status)).toMatch(/^(Published|2)$/);
      expect(published.publishedById).toBeTruthy();
      expect(published.publishedAt).toBeTruthy();

      const publishAgain = await request.post(`${base}/publish`, {
        headers,
        maxRedirects: 0,
      });
      expect(publishAgain.ok()).toBeFalsy();

      const editPublished = await request.put(base, {
        headers,
        maxRedirects: 0,
        data: {
          title: `${title} đã sửa`,
          content: "Sửa sau khi xuất bản",
          category: 4,
          riskLevel: 3,
        },
      });
      expect(editPublished.ok()).toBeFalsy();

      const deletePublished = await request.delete(base, {
        headers,
        maxRedirects: 0,
      });
      expect(deletePublished.ok()).toBeFalsy();
    } finally {
      await deleteAnalysis(page, headers, analysis.id);
    }
  });

  test("server-side validation rejects incomplete input", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const response = await page.context().request.post(
      "/api/v1/app/risk-analysis",
      {
        headers,
        maxRedirects: 0,
        data: { content: "Thiếu tiêu đề", category: 4, riskLevel: 3 },
      },
    );
    expect(response.ok()).toBeFalsy();
  });

  test("persistence after reload and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-RAV UI ${suffix}`;
    const analysis = await createDraftAnalysis(page, headers, title);

    try {
      await page.goto("/risk-analysis");
      const search = page.getByPlaceholder("Tìm kiếm...");
      await search.fill(title);
      await page.keyboard.press("Enter");
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

      await page.reload();
      await page.getByPlaceholder("Tìm kiếm...").fill(title);
      await page.keyboard.press("Enter");
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

      await page
        .getByPlaceholder("Tìm kiếm...")
        .fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page
          .locator(".ant-empty-description", { hasText: "Trống" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteAnalysis(page, headers, analysis.id);
    }
  });
});

