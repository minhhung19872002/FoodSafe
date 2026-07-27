import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  periodYear?: number;
  periodMonth?: number;
}

const TEST_YEARS = [2099, 2098, 2097, 2096, 2095, 2094, 2093, 2092, 2091, 2090];

async function cleanTestReports(
  request: APIRequestContext,
  headers: Record<string, string>,
): Promise<Set<string>> {
  const response = await request.get(
    "/api/v1/app/ndtp-report?MaxResultCount=1000",
  );
  if (!response.ok()) return new Set();
  const staleItems = (
    (await response.json()) as { items: ListItem[] }
  ).items.filter(
    (item) => item.periodYear !== undefined && TEST_YEARS.includes(item.periodYear),
  );
  for (const item of staleItems) {
    for (const action of ["return", "return-to-draft"]) {
      await request.post(`/api/v1/app/ndtp-report/${item.id}/${action}`, {
        headers,
        maxRedirects: 0,
        data: action === "return" ? { reason: "E2E cleanup" } : undefined,
      });
    }
    await request.delete(`/api/v1/app/ndtp-report/${item.id}`, {
      headers,
      maxRedirects: 0,
    });
  }
  const remaining = await request.get(
    "/api/v1/app/ndtp-report?MaxResultCount=1000",
  );
  if (!remaining.ok()) return new Set();
  return new Set(
    ((await remaining.json()) as { items: ListItem[] }).items
      .filter(
        (item) =>
          item.periodYear !== undefined &&
          TEST_YEARS.includes(item.periodYear) &&
          item.periodMonth !== undefined,
      )
      .map((item) => `${item.periodYear}-${item.periodMonth}`),
  );
}

function firstFreePeriod(taken: Set<string>) {
  for (const year of TEST_YEARS) {
    for (let month = 1; month <= 12; month++) {
      if (!taken.has(`${year}-${month}`)) return { year, month };
    }
  }
  return undefined;
}

test.describe("reporting management", () => {
  test.setTimeout(90_000);

  test("creates NDTP report, full workflow draft→submit→verify→complete, exports excel", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    const takenPeriods = await cleanTestReports(request, headers);
    const period = firstFreePeriod(takenPeriods);
    expect(period, "no free test period available").toBeDefined();
    const { year, month } = period!;
    const monthLabel = `Tháng ${month}`;
    const periodLabel = `Tháng ${month}/${year}`;

    await page.goto("/reporting");
    await expect(
      page.getByRole("tab", { name: "Báo cáo NĐTP" }),
    ).toBeVisible();

    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).first().click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(
      (await readFile((await exportDownload.path())!))
        .subarray(0, 2)
        .toString(),
    ).toBe("PK");

    await page.getByRole("button", { name: "Tạo báo cáo" }).click();
    const createDialog = page.getByRole("dialog", {
      name: "Tạo báo cáo NĐTP",
    });
    await createDialog
      .getByRole("spinbutton", { name: "Năm" })
      .fill(String(year));
    await createDialog.getByRole("combobox", { name: "Tháng" }).click();
    await page.getByText(monthLabel, { exact: true }).click();
    await createDialog
      .getByRole("textbox", { name: "Ghi chú" })
      .fill("E2E test report");
    await createDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(createDialog).not.toBeVisible({ timeout: 10_000 });

    const reportRow = page
      .getByRole("row")
      .filter({ hasText: periodLabel })
      .filter({ hasText: "Nháp" });
    await expect(reportRow).toBeVisible({ timeout: 10_000 });

    await reportRow.getByRole("button", { name: /Sửa/ }).click();
    const editDialog = page.getByRole("dialog", {
      name: /Sửa báo cáo NĐTP/,
    });
    await editDialog
      .getByRole("spinbutton", { name: "Số ca" })
      .first()
      .fill("5");
    await editDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();

    let row = page.getByRole("row").filter({ hasText: periodLabel });
    await row.getByRole("button", { name: /Gửi/ }).click();
    await page.locator(".ant-popover:visible").getByRole("button", { name: "Gửi" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Đã gửi")).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: /Xác minh/ }).click();
    await page.locator(".ant-popover:visible").getByRole("button", { name: "Xác minh" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Đã xác minh")).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: /Hoàn thành/ }).click();
    await page.locator(".ant-popover:visible").getByRole("button", { name: "Hoàn thành" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Hoàn thành")).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole("tab", { name: "Công tác ATTP" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Tháng hành động" }),
    ).toBeVisible();
  });
});
