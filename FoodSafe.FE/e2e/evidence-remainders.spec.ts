/**
 * FUNC-EVID-001 — executed browser evidence for features that were built but
 * never had a spec (gap register G-12):
 *   • FR-03-02 — audit-log detail drawer
 *   • FR-05-04/05 — profile edit + avatar upload
 *   • FR-33/34/35-08 — formatted report views (văn bản) incl. the new
 *     "Số vụ lớn (≥30 người mắc)" NDTP indicator (GAP-POIS-1)
 *
 * Real stack, no API interception.
 */

import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const STAMP = Date.now() % 1_000_000;
// Far-future periods so reruns and other specs never collide.
const NDTP_YEAR = 2090 + (STAMP % 5);
const NDTP_MONTH = 1 + (STAMP % 12);
const ATP_YEAR = 2095 + (STAMP % 5);

// 1×1 transparent PNG — enough for a real multipart avatar upload.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk" +
    "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

test.describe("FUNC-EVID-001 — built features get executed evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await signInAsAdmin(page);
  });

  test("FR-03-02 — audit-log row opens the detail drawer with real content", async ({
    page,
  }) => {
    // Any authenticated call guarantees at least one audit row exists.
    const warmup = await page.context().request.get(
      "/api/v1/app/business?MaxResultCount=1",
    );
    expect(warmup.ok()).toBeTruthy();

    await page.goto("/administration/audit-logs");
    // Let the initial fetch settle: the table re-renders when data arrives and
    // a click dispatched onto a swapped-out row node never reaches React.
    await page.waitForLoadState("networkidle");
    // Scope to the scrollable body table (sticky mode duplicates the header
    // table) and click a data cell — row-level clicks can land on the row
    // border and miss the onRow handler.
    const firstRow = page
      .locator(".ant-table-body tbody tr.ant-table-row")
      .first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    await firstRow.locator("td").nth(2).click();
    // Current antd renders the panel as .ant-drawer-section (not -content),
    // so assert on the open drawer root + its accessible dialog.
    const drawer = page.locator(".ant-drawer-open");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Chi tiết thao tác")).toBeVisible();
    // The drawer must show real request data, not just render a shell.
    await expect(drawer.getByText(/\/api\//).first()).toBeVisible();
  });

  test("FR-05-04/05 — profile edit persists after reload and avatar uploads", async ({
    page,
  }) => {
    await page.goto("/account/profile");
    const nameInput = page.getByLabel("Họ và tên");
    await expect(nameInput).toBeVisible({ timeout: 15_000 });

    const newName = `Quản trị viên E2E ${STAMP}`;
    await nameInput.fill(newName);
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(
      page.getByText("Đã cập nhật thông tin cá nhân."),
    ).toBeVisible();

    // Persistence after a full reload (registry requirement).
    await page.reload();
    await expect(page.getByLabel("Họ và tên")).toHaveValue(newName, {
      timeout: 15_000,
    });

    // Avatar upload goes through the real MinIO-backed endpoint.
    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: TINY_PNG,
      });
    await expect(page.getByText("Đã cập nhật ảnh đại diện.")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("FR-33/34-08 — formatted report views render from real reports", async ({
    page,
  }) => {
    const headers = await csrf(page);

    // Far-future periods; a rerun may land on a period an earlier run already
    // created, and a duplicate-period refusal is fine — the row exists either way.
    const ndtp = await page.context().request.post("/api/v1/app/ndtp-report", {
      headers,
      data: { periodYear: NDTP_YEAR, periodMonth: NDTP_MONTH },
    });
    expect(
      ndtp.ok() || (await ndtp.text()).includes("FoodSafe:Report:0010"),
      await ndtp.text(),
    ).toBeTruthy();

    const atp = await page
      .context()
      .request.post("/api/v1/app/atp-work-report", {
        headers,
        data: { periodType: 2, periodYear: ATP_YEAR },
      });
    expect(
      atp.ok() || (await atp.text()).includes("FoodSafe:Report:0010"),
      await atp.text(),
    ).toBeTruthy();

    // ── NDTP formatted view ────────────────────────────────────────────────
    await page.goto("/reporting?tab=ndtp");
    const ndtpRow = page
      .locator("tbody tr.ant-table-row")
      .filter({ hasText: String(NDTP_YEAR) })
      .first();
    await expect(ndtpRow).toBeVisible({ timeout: 15_000 });
    await ndtpRow.getByRole("button", { name: "Xem văn bản" }).click();
    await expect(
      page.getByText(
        `BÁO CÁO TÌNH HÌNH NGỘ ĐỘC THỰC PHẨM THÁNG ${NDTP_MONTH}/${NDTP_YEAR}`,
      ),
    ).toBeVisible();
    // GAP-POIS-1: the TT 20/2019 large-scale indicator is part of the view.
    await expect(
      page.getByText("Số vụ lớn (≥30 người mắc)").first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // ── ATP formatted view ─────────────────────────────────────────────────
    await page.goto("/reporting?tab=atp-work");
    const atpRow = page
      .locator("tbody tr.ant-table-row")
      .filter({ hasText: String(ATP_YEAR) })
      .first();
    await expect(atpRow).toBeVisible({ timeout: 15_000 });
    await atpRow.getByRole("button", { name: "Xem văn bản" }).click();
    await expect(
      page.getByText(`BÁO CÁO CÔNG TÁC ATTP NĂM ${ATP_YEAR}`),
    ).toBeVisible();
  });
});
