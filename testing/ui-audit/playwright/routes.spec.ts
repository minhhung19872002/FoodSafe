import { expect, test } from "@playwright/test";
import {
  ADMIN_STATE,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
  auditNavigate,
  recordFinding,
  recordIssues,
  visibleTextLength,
  type PageIssues,
} from "./helpers";

/**
 * Route coverage: mọi route phải tải sạch — không trang trắng, không lỗi
 * console/runtime, không request API hỏng, không redirect ngoài dự kiến.
 * Dùng expect.soft để một route hỏng nhiều kiểu vẫn báo đủ mọi kiểu.
 */

const SLOW_LOAD_MS = 10_000; // NFR §6: luồng chính < 10s

function assertClean(
  route: { slug: string; path: string },
  spec: string,
  issues: PageIssues,
  navMs: number,
): void {
  recordIssues(spec, route.path, issues);
  expect
    .soft(issues.pageErrors, `uncaught page errors on ${route.path}`)
    .toEqual([]);
  expect
    .soft(issues.consoleErrors, `console errors on ${route.path}`)
    .toEqual([]);
  expect
    .soft(issues.failedRequests, `failed requests on ${route.path}`)
    .toEqual([]);
  if (navMs > SLOW_LOAD_MS) {
    recordFinding({
      spec,
      route: route.path,
      type: "slow-load",
      detail: `navigation settled after ${navMs}ms (NFR target < ${SLOW_LOAD_MS}ms)`,
    });
  }
}

test.describe("route coverage — public pages (anonymous)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads clean`, async ({ page }) => {
      const { issues, navMs } = await auditNavigate(page, route.path);

      expect
        .soft(page.url(), `unexpected redirect away from ${route.path}`)
        .toContain(route.path);

      const textLength = await visibleTextLength(page);
      if (textLength < 40) {
        recordFinding({
          spec: "routes",
          route: route.path,
          type: "blank-page",
          detail: `visible text length=${textLength} — page renders (near-)blank`,
        });
      }
      expect
        .soft(textLength, `blank screen on ${route.path}`)
        .toBeGreaterThan(40);

      assertClean(route, "routes", issues, navMs);
    });
  }
});

test.describe("route coverage — authenticated pages (admin)", () => {
  test.use({ storageState: ADMIN_STATE });

  for (const route of PRIVATE_ROUTES) {
    test(`${route.path} loads clean`, async ({ page }) => {
      const { issues, navMs } = await auditNavigate(page, route.path);

      expect
        .soft(page.url(), `session lost or redirected away from ${route.path}`)
        .toContain(route.path);

      const textLength = await visibleTextLength(page);
      if (textLength < 40) {
        recordFinding({
          spec: "routes",
          route: route.path,
          type: "blank-page",
          detail: `visible text length=${textLength} — page renders (near-)blank`,
        });
      }
      expect
        .soft(textLength, `blank screen on ${route.path}`)
        .toBeGreaterThan(40);

      assertClean(route, "routes", issues, navMs);
    });
  }

  test("unknown URL renders in-app 404 (not blank, not crash)", async ({
    page,
  }) => {
    const { issues } = await auditNavigate(
      page,
      "/duong-dan-nay-khong-ton-tai",
    );
    // NotFoundPage nằm trong AppLayout: vẫn còn menu + nội dung 404.
    await expect
      .soft(page.locator(".ant-result"), "404 Result visible")
      .toBeVisible();
    expect.soft(issues.pageErrors, "page errors on 404").toEqual([]);
    recordIssues("routes", "/duong-dan-nay-khong-ton-tai", issues);
  });

  test("news detail opens from public list (real id)", async ({ browser }) => {
    // Danh sách tin công khai → mở bài đầu tiên nếu có dữ liệu.
    const context = await browser.newContext();
    const page = await context.newPage();
    const { issues } = await auditNavigate(page, "/tin-tuc");
    const firstNews = page
      .locator("a[href^='/tin-tuc/'], .ant-card, .ant-list-item")
      .first();
    if ((await firstNews.count()) === 0) {
      recordFinding({
        spec: "routes",
        route: "/tin-tuc/:id",
        type: "note",
        detail: "no published news item available — detail route not exercised",
      });
    } else {
      await firstNews.click();
      await page.waitForTimeout(1000);
      expect
        .soft(issues.pageErrors, "page errors opening news detail")
        .toEqual([]);
    }
    recordIssues("routes", "/tin-tuc/:id", issues);
    await context.close();
  });
});

test.describe("route guards", () => {
  test("anonymous access to a private route redirects to /login", async ({
    page,
  }) => {
    await page.goto("/businesses");
    await expect(page).toHaveURL(/\/login/);
  });

  test("anonymous unknown URL is bounced to /login (no route list leak)", async ({
    page,
  }) => {
    await page.goto("/duong-dan-nay-khong-ton-tai");
    await expect(page).toHaveURL(/\/login/);
  });
});
