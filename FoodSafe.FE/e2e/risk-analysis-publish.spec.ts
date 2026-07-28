/**
 * FR-36-07 (officer publishes a risk analysis) + FR-36-08 (the published
 * analysis becomes visible on the anonymous public portal), driven through the
 * REAL UI with no interception.
 *
 * A Draft risk analysis is SEEDED through the real authenticated admin API
 * (POST /api/v1/app/risk-analysis) after a real UI login — this is not
 * interception: the request carries the real session cookie + antiforgery token
 * and runs through the real ASP.NET Core pipeline, domain factory (Status=Draft)
 * and PostgreSQL. The subject under test — the officer "Xuất bản" decision
 * (Draft → Published, IsPublic=true, atomic) and the resulting public exposure —
 * is exercised entirely through the real browser:
 *   1. at /risk-analysis the officer publishes the Draft via the real button +
 *      Popconfirm; the status Tag flips Nháp → Đã xuất bản and survives a reload;
 *   2. on the anonymous /tin-tuc portal the same analysis now appears in the
 *      "Phân tích nguy cơ" tab (GET /api/v1/public/risk-analyses), proving the
 *      publish made it public end-to-end.
 *
 * Published rows are Draft-only-deletable, so cleanup is an out-of-band SQL
 * soft-delete keyed on the E2E-RISK title prefix (run by the harness).
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const RISK_ENDPOINT = "/api/v1/app/risk-analysis";
const RISK_PREFIX = "E2E-RISK";

/** Seeds one Draft risk analysis through the real authenticated admin API. */
async function seedDraftRiskAnalysis(page: Page, title: string): Promise<void> {
  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const res = await page.context().request.post(RISK_ENDPOINT, {
    headers,
    data: {
      title,
      content:
        "Phân tích nguy cơ kiểm chứng: nhóm sản phẩm có dấu hiệu vượt ngưỡng phụ gia.",
      category: 1, // An toàn thực phẩm
      riskLevel: 3, // Cao
      recommendations: "Tăng cường giám sát và lấy mẫu định kỳ.",
    },
    maxRedirects: 0,
  });
  expect(
    res.ok(),
    `risk-analysis seed failed: ${await res.text()}`,
  ).toBeTruthy();
  const body = (await res.json()) as { id: string; status: number };
  expect(body.id).toBeTruthy();
  expect(body.status, "seed must start as Draft").toBe(1);
}

test.describe("FR-36-07 / FR-36-08 — risk-analysis publish + public exposure", () => {
  test.setTimeout(90_000);

  test("officer publishes a Draft risk analysis and it appears on the public portal", async ({
    page,
  }) => {
    await signInAsAdmin(page);

    const stamp = Date.now().toString().slice(-9);
    const title = `${RISK_PREFIX}-${stamp}`;
    await seedDraftRiskAnalysis(page, title);

    // ── FR-36-07: officer publishes the Draft through the real UI ──────────────
    await page.goto("/risk-analysis");
    await page.getByPlaceholder("Tìm kiếm...").fill(title);
    await page.getByPlaceholder("Tìm kiếm...").press("Enter");

    let row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Nháp" }),
    ).toBeVisible({ timeout: 10_000 });

    await row.getByRole("button", { name: `Thao tác ${title}` }).click();
    await page.getByRole("menuitem", { name: "Xuất bản" }).click();
    await page.getByRole("button", { name: "OK" }).click();

    row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Đã xuất bản" }),
    ).toBeVisible({ timeout: 10_000 });

    // Persistence: the published status must survive a full reload.
    await page.reload();
    await page.getByPlaceholder("Tìm kiếm...").fill(title);
    await page.getByPlaceholder("Tìm kiếm...").press("Enter");
    row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Đã xuất bản" }),
    ).toBeVisible({ timeout: 10_000 });

    // ── FR-36-08: the published analysis is now visible to the public ─────────
    // Use a fresh anonymous context (no admin session) to prove the row is
    // exposed by the [AllowAnonymous] public endpoint, not by the officer login.
    const anonCtx = await page.context().browser()!.newContext();
    try {
      const anonPage = await anonCtx.newPage();
      await anonPage.goto("/tin-tuc");
      await anonPage.getByRole("tab", { name: "Phân tích nguy cơ" }).click();
      // Newest-published sorts first, so the seeded analysis is on page 1.
      await expect(
        anonPage.getByRole("row").filter({ hasText: title }),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await anonCtx.close();
    }
  });
});
