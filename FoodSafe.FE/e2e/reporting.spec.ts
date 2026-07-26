import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  year?: number;
  month?: number;
}

async function removeStaleReports(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/ndtp-report?MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.year === 2099) {
      await request.delete(`/api/v1/app/ndtp-report/${item.id}`, { headers });
    }
  }
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
    await removeStaleReports(request, headers);

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
      .fill("2099");
    await createDialog.getByRole("combobox", { name: "Tháng" }).click();
    await page.getByText("Tháng 1", { exact: true }).click();
    await createDialog
      .getByRole("textbox", { name: "Ghi chú" })
      .fill("E2E test report");
    await createDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText("Đã tạo")).toBeVisible();

    const reportRow = page
      .getByRole("row")
      .filter({ hasText: "2099" })
      .filter({ hasText: "Nháp" });
    await expect(reportRow).toBeVisible();

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

    let row = page
      .getByRole("row")
      .filter({ hasText: "2099" });
    await row.getByRole("button", { name: /Gửi/ }).click();
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(page.getByText("Đã gửi")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "2099" });
    await expect(row.getByText("Đã gửi")).toBeVisible();
    await row.getByRole("button", { name: /Xác minh/ }).click();
    await page
      .getByRole("button", { name: "Xác minh", exact: true })
      .click();
    await expect(page.getByText("Đã xác minh")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "2099" });
    await row.getByRole("button", { name: /Hoàn thành/ }).click();
    await page
      .getByRole("button", { name: "Hoàn thành", exact: true })
      .click();
    await expect(page.getByText("Đã hoàn thành")).toBeVisible();

    await expect(
      page.getByRole("tab", { name: "Công tác ATTP" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Tháng hành động" }),
    ).toBeVisible();
  });
});
