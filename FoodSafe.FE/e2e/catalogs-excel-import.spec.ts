import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";
import { buildXlsx } from "./helpers/xlsx";
import { activateTab } from "./helpers/tabs";

const DOCUMENT_TYPE_SHEET = "Loại văn bản";
const DOCUMENT_TYPE_HEADERS = ["Mã*", "Tên*", "Mô tả", "Thứ tự", "Trạng thái"];

async function removeStaleE2eArtifacts(page: Page) {
  const request = page.context().request;
  const response = await request.get(
    "/api/v1/app/master-catalog/document-types?Filter=E2EIMP-&MaxResultCount=100",
  );
  expect(response.ok()).toBeTruthy();
  const result = (await response.json()) as {
    items: Array<{ id: string; code: string }>;
  };
  const token = await requestVerificationToken(page);

  for (const item of result.items.filter(({ code }) =>
    code.startsWith("E2EIMP-"),
  )) {
    const deletion = await request.delete(
      `/api/v1/app/master-catalog/${item.id}/document-type`,
      { headers: { RequestVerificationToken: token } },
    );
    expect(deletion.ok()).toBeTruthy();
  }
}

async function openImportModal(page: Page) {
  await page.goto("/catalogs");
  await expect(
    page.getByRole("heading", { name: "Danh mục dùng chung" }),
  ).toBeVisible();
  await activateTab(page, "Loại văn bản");
  // Icon của AntD mang aria-label riêng nên tên trợ năng là "import Import";
  // lọc theo nội dung văn bản để không phụ thuộc vào icon.
  await page
    .getByRole("button")
    .filter({ hasText: /^Import$/ })
    .click();
  return page.getByRole("dialog").filter({ hasText: "Import Loại văn bản" });
}

test.describe("master catalog Excel import", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await removeStaleE2eArtifacts(page);
  });

  test("downloads a template that carries headers, a sample row and guidance", async ({
    page,
  }) => {
    const modal = await openImportModal(page);

    const download = await Promise.all([
      page.waitForEvent("download"),
      modal.getByRole("button", { name: "Tải file mẫu" }).click(),
    ]).then(([event]) => event);

    expect(download.suggestedFilename()).toBe("mau-import-loai-van-ban.xlsx");
    const path = await download.path();
    expect(path).toBeTruthy();

    // Đọc thẳng nội dung workbook: phải có tiêu đề cột, dòng mẫu và sheet hướng dẫn.
    const entries = unzipSync(new Uint8Array(await readFile(path!)));
    const text = Object.keys(entries)
      .filter((entry) => entry.endsWith(".xml"))
      .map((entry) => strFromU8(entries[entry]))
      .join("");

    expect(text).toContain("Loại văn bản");
    expect(text).toContain("Mã*");
    expect(text).toContain("Tên*");
    // Dòng mẫu (giống file mẫu import cơ sở)
    expect(text).toContain("VB-01");
    expect(text).toContain("Nghị định");
    expect(text).toContain("← Dòng mẫu, xóa trước khi upload");
    expect(text).toContain("Hướng dẫn");
  });

  test("previews a valid file then imports the rows into the real database", async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-8);
    const firstCode = `E2EIMP-${suffix}A`;
    const secondCode = `E2EIMP-${suffix}B`;
    const firstName = `Nghị định import ${suffix}`;
    const secondName = `Thông tư import ${suffix}`;

    const modal = await openImportModal(page);

    await modal
      .locator('input[type="file"]')
      .setInputFiles({
        name: "import-loai-van-ban.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: buildXlsx(DOCUMENT_TYPE_SHEET, [
          DOCUMENT_TYPE_HEADERS,
          [firstCode, firstName, "Ghi chú A", "10", "Có"],
          [secondCode, secondName, "", "20", "Không"],
        ]),
      });

    await modal.getByRole("button", { name: /Kiểm tra và xem trước/ }).click();

    await expect(
      modal.getByText("Tổng số: 2 — Hợp lệ: 2 — Lỗi: 0"),
    ).toBeVisible();
    await expect(
      modal.getByText("File hợp lệ và sẵn sàng import"),
    ).toBeVisible();

    await modal.getByRole("button", { name: /Xác nhận import 2 dòng/ }).click();

    await expect(page.getByText("Đã import 2 dòng loại văn bản")).toBeVisible();

    // Dữ liệu phải nằm trong danh sách lấy từ API thật, không phải state cục bộ.
    await page
      .getByPlaceholder("Tìm theo mã hoặc tên")
      .fill(`E2EIMP-${suffix}`);
    await expect(
      page.getByRole("row").filter({ hasText: firstCode }),
    ).toContainText(firstName);
    await expect(
      page.getByRole("row").filter({ hasText: secondCode }),
    ).toContainText(secondName);

    // Còn tồn tại sau khi tải lại trang => đã ghi xuống PostgreSQL.
    await page.reload();
    await activateTab(page, "Loại văn bản");
    await page
      .getByPlaceholder("Tìm theo mã hoặc tên")
      .fill(`E2EIMP-${suffix}`);
    await expect(
      page.getByRole("row").filter({ hasText: firstCode }),
    ).toContainText(firstName);
    await expect(
      page.getByRole("row").filter({ hasText: secondCode }),
    ).toBeVisible();
  });

  test("reports row level errors and refuses to import an invalid file", async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-8);
    const duplicated = `E2EIMP-${suffix}D`;
    const modal = await openImportModal(page);

    await modal.locator('input[type="file"]').setInputFiles({
      name: "import-loi.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: buildXlsx(DOCUMENT_TYPE_SHEET, [
        DOCUMENT_TYPE_HEADERS,
        // Thiếu tên (bắt buộc)
        [`E2EIMP-${suffix}X`, "", "", "", ""],
        // Thứ tự không phải số
        [`E2EIMP-${suffix}Y`, "Hợp lệ", "", "abc", ""],
        // Trùng mã trong cùng file
        [duplicated, "Trùng 1", "", "", ""],
        [duplicated, "Trùng 2", "", "", ""],
      ]),
    });

    await modal.getByRole("button", { name: /Kiểm tra và xem trước/ }).click();

    await expect(modal.getByText(/Tổng số: 4 —/)).toBeVisible();
    await expect(modal.getByText('"Tên*" là bắt buộc.')).toBeVisible();
    await expect(
      modal.getByText("Thứ tự phải là số nguyên từ 0 đến 2147483647."),
    ).toBeVisible();
    await expect(modal.getByText("Mã* bị trùng trong file.")).toHaveCount(2);

    // Không có token xác nhận => không thể ghi dữ liệu.
    await expect(
      modal.getByRole("button", { name: /Xác nhận import/ }),
    ).toHaveCount(0);

    const request = page.context().request;
    const check = await request.get(
      `/api/v1/app/master-catalog/document-types?Filter=E2EIMP-${suffix}&MaxResultCount=100`,
    );
    expect(check.ok()).toBeTruthy();
    expect(((await check.json()) as { totalCount: number }).totalCount).toBe(0);
  });

  test("rejects a file whose header row does not match the template", async ({
    page,
  }) => {
    const modal = await openImportModal(page);

    await modal.locator('input[type="file"]').setInputFiles({
      name: "sai-header.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: buildXlsx(DOCUMENT_TYPE_SHEET, [
        ["Code", "Name", "Description", "Order", "Active"],
        ["E2EIMP-HEADER", "Không được import", "", "", ""],
      ]),
    });

    await modal.getByRole("button", { name: /Kiểm tra và xem trước/ }).click();

    await expect(modal.getByText('Cột 1 phải có tên "Mã*".')).toBeVisible();
    await expect(
      modal.getByRole("button", { name: /Xác nhận import/ }),
    ).toHaveCount(0);
  });
});
