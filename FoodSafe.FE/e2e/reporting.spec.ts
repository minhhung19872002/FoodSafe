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
    (item) =>
      item.periodYear !== undefined && TEST_YEARS.includes(item.periodYear),
  );
  for (const item of staleItems) {
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
    await expect(page.getByRole("tab", { name: "Báo cáo NĐTP" })).toBeVisible();

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
    const monthCombobox = createDialog.getByRole("combobox", {
      name: "Tháng",
    });
    const monthDropdown = page.locator(".ant-select-dropdown:visible");
    const monthOption = monthDropdown.locator(
      `.ant-select-item-option[title="${monthLabel}"]`,
    );
    // The dropdown virtualizes options and can close/re-render on slow
    // machines; retry opening it and scroll near the target month until
    // the option is actually rendered and visible before clicking.
    const scrollRatio = (month - 1) / 12;
    await expect(async () => {
      if (!(await monthDropdown.isVisible().catch(() => false))) {
        await monthCombobox.click();
      }
      await monthDropdown
        .locator(".rc-virtual-list-holder")
        .evaluate((el, ratio) => {
          el.scrollTop = el.scrollHeight * ratio;
        }, scrollRatio)
        .catch(() => undefined);
      await expect(monthOption).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await monthOption.click();
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

    await reportRow
      .getByRole("button", { name: `Thao tác ${periodLabel}` })
      .click();
    await page.getByRole("menuitem", { name: "Sửa" }).click();
    const editDialog = page.getByRole("dialog", {
      name: /Sửa báo cáo NĐTP/,
    });
    await editDialog
      .getByRole("spinbutton", { name: "Số ca" })
      .first()
      .fill("5");
    await editDialog.getByRole("button", { name: "Lưu", exact: true }).click();

    let row = page.getByRole("row").filter({ hasText: periodLabel });
    await row.getByRole("button", { name: `Thao tác ${periodLabel}` }).click();
    await page.getByRole("menuitem", { name: "Gửi" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Đã gửi")).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: `Thao tác ${periodLabel}` }).click();
    await page.getByRole("menuitem", { name: "Xác minh" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Đã xác minh")).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: `Thao tác ${periodLabel}` }).click();
    await page.getByRole("menuitem", { name: "Hoàn thành" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();

    row = page.getByRole("row").filter({ hasText: periodLabel });
    await expect(row.getByText("Hoàn thành")).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole("tab", { name: "Công tác ATTP" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Tháng hành động" }),
    ).toBeVisible();
  });

  // The forward path (submit→verify→complete) is UI-driven above; the RETURN
  // buttons ("Trả lại" + "Về nháp") were only ever exercised at the API level
  // (reporting-verification.spec.ts). This drives them through the real DOM so
  // the full Submit/Verify/Return/Complete button set has browser evidence.
  test("return path through the UI: submit → return (with reason) → back to draft", async ({
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
    const periodLabel = `Tháng ${month}/${year}`;

    // Seed the Draft over real HTTP (the create UI is already covered above);
    // this test's subject is the return workflow buttons, not creation.
    const created = await request.post("/api/v1/app/ndtp-report", {
      headers,
      data: { periodYear: year, periodMonth: month, notes: "E2E return path" },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const { id } = (await created.json()) as { id: string };

    try {
      await page.goto("/reporting");
      await expect(
        page.getByRole("tab", { name: "Báo cáo NĐTP" }),
      ).toBeVisible();
      // Isolate the seeded row via the year filter so it is unambiguous.
      await page.getByPlaceholder("Năm").first().fill(String(year));
      await page.keyboard.press("Enter");

      let row = page.getByRole("row").filter({ hasText: periodLabel });
      await expect(
        row.locator(".ant-tag").filter({ hasText: "Nháp" }),
      ).toBeVisible({
        timeout: 10_000,
      });

      // Draft → Submitted via the "Gửi" overflow item + modal confirm.
      await row
        .getByRole("button", { name: `Thao tác ${periodLabel}` })
        .click();
      await page.getByRole("menuitem", { name: "Gửi" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "OK" })
        .click();
      row = page.getByRole("row").filter({ hasText: periodLabel });
      await expect(row.getByText("Đã gửi")).toBeVisible({ timeout: 10_000 });

      // Submitted → Returned via the "Trả lại" overflow item, which opens a modal
      // that requires a reason (server-enforced) before the "Lưu" submit.
      await row
        .getByRole("button", { name: `Thao tác ${periodLabel}` })
        .click();
      await page.getByRole("menuitem", { name: "Trả lại" }).click();
      const returnDialog = page.getByRole("dialog", {
        name: "Trả lại báo cáo",
      });
      await returnDialog
        .getByRole("textbox", { name: "Lý do trả lại" })
        .fill("Thiếu số liệu, đề nghị bổ sung");
      await returnDialog
        .getByRole("button", { name: "Lưu", exact: true })
        .click();
      await expect(returnDialog).not.toBeVisible({ timeout: 10_000 });
      row = page.getByRole("row").filter({ hasText: periodLabel });
      await expect(
        row.locator(".ant-tag").filter({ hasText: "Trả lại" }),
      ).toBeVisible({ timeout: 10_000 });

      // Returned → Draft via the "Về nháp" overflow item + modal confirm.
      await row
        .getByRole("button", { name: `Thao tác ${periodLabel}` })
        .click();
      await page.getByRole("menuitem", { name: "Về nháp" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "OK" })
        .click();
      row = page.getByRole("row").filter({ hasText: periodLabel });
      await expect(
        row.locator(".ant-tag").filter({ hasText: "Nháp" }),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await request.delete(`/api/v1/app/ndtp-report/${id}`, {
        headers,
        maxRedirects: 0,
      });
    }
  });
});
