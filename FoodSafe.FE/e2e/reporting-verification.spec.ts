import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const VERIFICATION_YEAR = 2089;

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

interface ListItem {
  id: string;
  periodYear?: number;
  periodMonth?: number;
}

async function cleanVerificationReports(
  page: Page,
  headers: Record<string, string>,
) {
  const request = page.context().request;
  const response = await request.get(
    "/api/v1/app/ndtp-report?MaxResultCount=1000",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.periodYear !== VERIFICATION_YEAR) continue;
    for (const action of ["return", "return-to-draft"]) {
      await request.post(`/api/v1/app/ndtp-report/${item.id}/${action}`, {
        headers,
        maxRedirects: 0,
        data: action === "return" ? { returnReason: "E2E cleanup" } : undefined,
      });
    }
    await request.delete(`/api/v1/app/ndtp-report/${item.id}`, {
      headers,
      maxRedirects: 0,
    });
  }
}

async function createDraftReport(
  page: Page,
  headers: Record<string, string>,
  month: number,
) {
  const response = await page.context().request.post(
    "/api/v1/app/ndtp-report",
    {
      headers,
      data: {
        periodYear: VERIFICATION_YEAR,
        periodMonth: month,
        notes: "E2E verification report",
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string };
}

test.describe("reporting verification (F-015)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/ndtp-report", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without reporting permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/ndtp-report",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("cross-organization report is hidden and blocked", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await cleanVerificationReports(page, headers);
    const report = await createDraftReport(page, headers, 1);

    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const list = await district.page.context().request.get(
        `/api/v1/app/ndtp-report?PeriodYear=${VERIFICATION_YEAR}&MaxResultCount=100`,
      );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as { items: ListItem[] };
      expect(
        payload.items.filter((x) => x.periodYear === VERIFICATION_YEAR),
      ).toHaveLength(0);

      const detail = await district.page.context().request.get(
        `/api/v1/app/ndtp-report/${report.id}`,
        { maxRedirects: 0 },
      );
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await cleanVerificationReports(page, headers);
    }
  });

  test("workflow guards and full return path", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await cleanVerificationReports(page, headers);
    const report = await createDraftReport(page, headers, 2);
    const request = page.context().request;
    const base = `/api/v1/app/ndtp-report/${report.id}`;

    try {
      const verifyDraft = await request.post(`${base}/verify`, {
        headers,
        maxRedirects: 0,
      });
      expect(verifyDraft.ok()).toBeFalsy();

      const completeDraft = await request.post(`${base}/complete`, {
        headers,
        maxRedirects: 0,
      });
      expect(completeDraft.ok()).toBeFalsy();

      const submit = await request.post(`${base}/submit`, {
        headers,
        maxRedirects: 0,
      });
      expect(submit.ok(), await submit.text()).toBeTruthy();

      const submitAgain = await request.post(`${base}/submit`, {
        headers,
        maxRedirects: 0,
      });
      expect(submitAgain.ok()).toBeFalsy();

      const deleteSubmitted = await request.delete(base, {
        headers,
        maxRedirects: 0,
      });
      expect(deleteSubmitted.ok()).toBeFalsy();

      const returnNoReason = await request.post(`${base}/return`, {
        headers,
        maxRedirects: 0,
        data: {},
      });
      expect(returnNoReason.status()).toBe(400);

      const returned = await request.post(`${base}/return`, {
        headers,
        maxRedirects: 0,
        data: { returnReason: "Thiếu số liệu tháng" },
      });
      expect(returned.ok(), await returned.text()).toBeTruthy();

      const backToDraft = await request.post(`${base}/return-to-draft`, {
        headers,
        maxRedirects: 0,
      });
      expect(backToDraft.ok(), await backToDraft.text()).toBeTruthy();

      const deleteDraft = await request.delete(base, {
        headers,
        maxRedirects: 0,
      });
      expect(deleteDraft.ok(), await deleteDraft.text()).toBeTruthy();

      const gone = await request.get(base, { maxRedirects: 0 });
      expect(gone.ok()).toBeFalsy();
    } finally {
      await cleanVerificationReports(page, headers);
    }
  });

  test("server-side validation rejects out-of-range month", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    const response = await page.context().request.post(
      "/api/v1/app/ndtp-report",
      {
        headers,
        maxRedirects: 0,
        data: { periodYear: VERIFICATION_YEAR, periodMonth: 13 },
      },
    );
    expect(response.status()).toBe(400);
  });

  test("persistence after reload and empty state via year filter", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await cleanVerificationReports(page, headers);
    const report = await createDraftReport(page, headers, 3);
    const periodLabel = `Tháng 3/${VERIFICATION_YEAR}`;

    try {
      await page.goto("/reporting");
      const yearFilter = page.getByPlaceholder("Năm").first();
      await yearFilter.fill(String(VERIFICATION_YEAR));
      await page.keyboard.press("Enter");
      await expect(page.getByText(periodLabel)).toBeVisible({
        timeout: 10_000,
      });

      await page.reload();
      await page
        .getByPlaceholder("Năm")
        .first()
        .fill(String(VERIFICATION_YEAR));
      await page.keyboard.press("Enter");
      await expect(page.getByText(periodLabel)).toBeVisible({
        timeout: 10_000,
      });

      await page.getByPlaceholder("Năm").first().fill("2088");
      await page.keyboard.press("Enter");
      await expect(
        page
          .locator(".ant-empty-description", { hasText: "Trống" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await page.context().request.delete(
        `/api/v1/app/ndtp-report/${report.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });
});
