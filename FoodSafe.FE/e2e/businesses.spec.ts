import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
}

interface AttachmentItem {
  id: string;
}

async function removeStaleArtifacts(page: Page) {
  const request = page.context().request;
  const token = await requestVerificationToken(page);
  const headers = { RequestVerificationToken: token };

  const products = await request.get(
    "/api/v1/app/product?Filter=E2E-&MaxResultCount=100",
  );
  expect(products.ok()).toBeTruthy();
  for (const item of ((await products.json()) as { items: ListItem[] }).items) {
    if (item.code?.startsWith("E2E-")) {
      const attachments = await request.get(
        `/api/v1/app/product/${item.id}/attachments`,
      );
      expect(attachments.ok()).toBeTruthy();
      for (const attachment of (await attachments.json()) as AttachmentItem[]) {
        const attachmentDeletion = await request.delete(
          `/api/v1/app/product/${item.id}/attachments/${attachment.id}`,
          { headers },
        );
        expect(
          attachmentDeletion.ok(),
          await attachmentDeletion.text(),
        ).toBeTruthy();
      }
      const deletion = await request.delete(`/api/v1/app/product/${item.id}`, {
        headers,
      });
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }

  const businesses = await request.get(
    "/api/v1/app/business?Filter=E2E-&MaxResultCount=100",
  );
  expect(businesses.ok()).toBeTruthy();
  for (const item of ((await businesses.json()) as { items: ListItem[] })
    .items) {
    if (item.code?.startsWith("E2E-")) {
      // Businesses that still carry licences from another spec are protected by
      // the delete guard (FoodSafe:Business:0010). Leaving them is fine — this
      // pass only clears what it can, and each test uses a unique code.
      await request.delete(`/api/v1/app/business/${item.id}`, { headers });
    }
  }
}

async function chooseFirstOption(page: Page, label: string) {
  const combo = page.getByRole("combobox", { name: label });
  const wrapper = page.locator(".ant-select", { has: combo }).first();
  // antd re-renders the dropdown while options load; retry until the
  // selector actually displays a chosen value (non-empty text).
  await expect(async () => {
    await combo.click();
    await page
      .locator(".ant-select-dropdown:visible .ant-select-item-option")
      .first()
      .click({ timeout: 2_000 });
    await expect(wrapper).toContainText(/\S/, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("business and product management", () => {
  test.setTimeout(60_000);

  test("completes the business, handler, and product lifecycle", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await removeStaleArtifacts(page);
    await page.goto("/businesses");

    await expect(
      page.getByRole("heading", { name: "Cơ sở và sản phẩm" }),
    ).toBeVisible();

    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Xuất Excel/ }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^danh-sach-co-so-\d{8}-\d{6}\.xlsx$/,
    );
    const exportPath = await exportDownload.path();
    expect(exportPath).not.toBeNull();
    const exportBytes = await readFile(exportPath!);
    expect(exportBytes.subarray(0, 2).toString()).toBe("PK");

    await page.getByRole("button", { name: "Import" }).click();
    const importDialog = page.getByRole("dialog", {
      name: "Import cơ sở từ Excel",
    });
    const templatePromise = page.waitForEvent("download");
    await importDialog.getByRole("button", { name: /tải file mẫu/i }).click();
    const templateDownload = await templatePromise;
    const templatePath = await templateDownload.path();
    expect(templatePath).not.toBeNull();
    await importDialog.locator('input[type="file"]').setInputFiles({
      name: templateDownload.suggestedFilename(),
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: await readFile(templatePath!),
    });
    await importDialog
      .getByRole("button", { name: /kiểm tra và xem trước/i })
      .click();
    // The downloaded template now ships a ready-to-use sample row, so the
    // preview must validate it cleanly and offer the confirm step. (It is not
    // confirmed here — the lifecycle below creates its own business via the UI.)
    await expect(importDialog.getByText(/Tổng số: 1/)).toBeVisible();
    await expect(
      importDialog.getByText(/Hợp lệ: 1/).first(),
    ).toBeVisible();
    await expect(
      importDialog.getByText("File hợp lệ và sẵn sàng import"),
    ).toBeVisible();
    await expect(
      importDialog.getByRole("button", { name: /Xác nhận import/ }),
    ).toBeVisible();
    await importDialog.getByRole("button", { name: "Close" }).click();

    const suffix = Date.now().toString().slice(-8);
    const businessCode = `E2E-CS-${suffix}`;
    const businessName = `Cơ sở E2E ${suffix}`;
    const updatedBusinessName = `${businessName} cập nhật`;
    const productCode = `E2E-SP-${suffix}`;
    const productName = `Sản phẩm E2E ${suffix}`;
    const handlerName = `Phụ trách E2E ${suffix}`;

    await page.getByRole("button", { name: /thêm cơ sở/i }).click();
    await chooseFirstOption(page, "Đơn vị quản lý");
    await page.getByRole("textbox", { name: "Mã cơ sở" }).fill(businessCode);
    await page.getByRole("textbox", { name: "Tên cơ sở" }).fill(businessName);
    // Contact details are mandatory for a facility record.
    await page.locator('input[name="contactPhone"]').fill("0203 3825 111");
    await page
      .locator('input[name="contactEmail"]')
      .fill(`e2e-${suffix}@foodsafe.local`);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã thêm cơ sở")).toBeVisible();

    let businessRow = page.getByRole("row").filter({ hasText: businessCode });
    await expect(businessRow).toContainText(businessName);

    await businessRow
      .getByRole("button", { name: `Sửa ${businessName}` })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Cập nhật cơ sở" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Tên cơ sở" })
      .fill(updatedBusinessName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã cập nhật cơ sở")).toBeVisible();
    businessRow = page.getByRole("row").filter({ hasText: businessCode });
    await expect(businessRow).toContainText(updatedBusinessName);

    await businessRow
      .getByRole("button", { name: `Thao tác ${updatedBusinessName}` })
      .click();
    await page.getByRole("menuitem", { name: "Người phụ trách" }).click();
    await page.getByRole("button", { name: /thêm người phụ trách/i }).click();
    await page
      .getByRole("textbox", { name: "Họ tên người phụ trách" })
      .fill(handlerName);
    await page.getByRole("button", { name: "Lưu người phụ trách" }).click();
    await expect(page.getByText("Đã lưu người phụ trách")).toBeVisible();

    await page.getByRole("tab", { name: "Sản phẩm" }).click();
    const productExportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Xuất Excel/ }).click();
    const productExport = await productExportPromise;
    expect(productExport.suggestedFilename()).toMatch(
      /^danh-sach-san-pham-\d{8}-\d{6}\.xlsx$/,
    );
    const productExportPath = await productExport.path();
    expect(productExportPath).not.toBeNull();
    expect((await readFile(productExportPath!)).subarray(0, 2).toString()).toBe(
      "PK",
    );

    await page.getByRole("button", { name: "Import" }).click();
    const productImportDialog = page.getByRole("dialog", {
      name: "Import sản phẩm từ Excel",
    });
    const productTemplatePromise = page.waitForEvent("download");
    await productImportDialog
      .getByRole("button", { name: /tải file mẫu/i })
      .click();
    const productTemplate = await productTemplatePromise;
    const productTemplatePath = await productTemplate.path();
    expect(productTemplatePath).not.toBeNull();
    await productImportDialog.locator('input[type="file"]').setInputFiles({
      name: productTemplate.suggestedFilename(),
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: await readFile(productTemplatePath!),
    });
    await productImportDialog
      .getByRole("button", { name: /kiểm tra và xem trước/i })
      .click();
    // The product template's sample row references a placeholder facility code,
    // so the preview must reject it with a row-level, human-readable reason
    // instead of importing anything.
    await expect(productImportDialog.getByText(/Tổng số: 1/)).toBeVisible();
    await expect(productImportDialog.getByText(/Lỗi: 1/)).toBeVisible();
    await expect(
      productImportDialog.getByText(/không tồn tại hoặc nằm ngoài phạm vi/),
    ).toBeVisible();
    await productImportDialog.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: /thêm sản phẩm/i }).click();
    // exact: the header global-search box is also labelled "...hồ sơ, cơ sở".
    await page.getByRole("combobox", { name: "Cơ sở", exact: true }).click();
    await page.getByText(updatedBusinessName, { exact: false }).last().click();
    await page.getByRole("textbox", { name: "Mã sản phẩm" }).fill(productCode);
    await page.getByRole("textbox", { name: "Tên sản phẩm" }).fill(productName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã thêm sản phẩm")).toBeVisible();

    const productRow = page.getByRole("row").filter({ hasText: productCode });
    await expect(productRow).toContainText(productName);
    await productRow
      .getByRole("button", { name: `Tệp đính kèm ${productName}` })
      .click();
    const attachmentDialog = page.getByRole("dialog", {
      name: `Tệp đính kèm — ${productName}`,
    });
    await attachmentDialog.locator('input[type="file"]').setInputFiles({
      name: "eicar.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(
        "UEsDBBQAAAAIAESn+VziZOZcDwAAABUAAAAPAAAAeGwvd29ya2Jvb2sueG1ssynPL8pOys/PtrPRhzMBUEsDBBQAAAAIAESn+Vy8/hnLDAAAAA8AAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbLMJqSxILbaz0YfQAFBLAwQUAAAACABEp/lcPM9RaEYAAABEAAAACQAAAGVpY2FyLmNvbYsw9VcMUHVwDIg2iQmIijA10QiI0zR3dtY0r1Vx9XR2DNINDnH0c3EMctF19AvxDPMMCg3WDXENDtF18/RxVVTx0PbQAgBQSwECFAAUAAAACABEp/lc4mTmXA8AAAAVAAAADwAAAAAAAAAAAAAAAAAAAAAAeGwvd29ya2Jvb2sueG1sUEsBAhQAFAAAAAgARKf5XLz+GcsMAAAADwAAABMAAAAAAAAAAAAAAAAAPAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAACABEp/lcPM9RaEYAAABEAAAACQAAAAAAAAAAAAAAAAB5AAAAZWljYXIuY29tUEsFBgAAAAADAAMAtQAAAOYAAAAAAA==",
        "base64",
      ),
    });
    await attachmentDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(
      page.getByText("Không thể tải file lên hoặc file không an toàn"),
    ).toBeVisible();
    await expect(attachmentDialog.getByText("eicar.xlsx")).toHaveCount(0);

    await attachmentDialog.locator('input[type="file"]').setInputFiles({
      name: "e2e-chung-nhan.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await attachmentDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải file lên")).toBeVisible();
    await expect(
      attachmentDialog.getByRole("cell", {
        name: "e2e-chung-nhan.pdf",
        exact: true,
      }),
    ).toBeVisible();
    const attachmentDownloadPromise = page.waitForEvent("download");
    await attachmentDialog
      .getByRole("button", { name: "Tải e2e-chung-nhan.pdf" })
      .click();
    const attachmentDownload = await attachmentDownloadPromise;
    const attachmentPath = await attachmentDownload.path();
    expect(attachmentPath).not.toBeNull();
    expect((await readFile(attachmentPath!)).subarray(0, 4).toString()).toBe(
      "%PDF",
    );
    await attachmentDialog
      .getByRole("button", { name: "Xóa e2e-chung-nhan.pdf" })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa file đính kèm")).toBeVisible();
    await attachmentDialog.getByRole("button", { name: "Close" }).click();

    await productRow
      .getByRole("button", { name: `Thao tác ${productName}` })
      .click();
    await page.getByRole("menuitem", { name: "Xóa" }).click();
    // Nhãn nút xác nhận phụ thuộc cấu hình RowActions/locale antd.
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(page.getByText("Đã xóa sản phẩm")).toBeVisible();

    await page.getByRole("tab", { name: "Cơ sở SXKD" }).click();
    businessRow = page.getByRole("row").filter({ hasText: businessCode });
    await businessRow
      .getByRole("button", { name: `Thao tác ${updatedBusinessName}` })
      .click();
    await page.getByRole("menuitem", { name: "Xóa" }).click();
    // Nhãn nút xác nhận phụ thuộc cấu hình RowActions/locale antd.
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(page.getByText("Đã xóa cơ sở")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: businessCode }),
    ).toHaveCount(0);
  });
});
