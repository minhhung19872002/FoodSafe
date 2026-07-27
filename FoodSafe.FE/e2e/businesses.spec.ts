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
      const deletion = await request.delete(`/api/v1/app/business/${item.id}`, {
        headers,
      });
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
}

async function chooseFirstOption(page: Page, label: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page
    .locator(".ant-select-dropdown:visible .ant-select-item-option")
    .first()
    .click();
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
    await expect(importDialog.getByText(/Tổng số: 1/)).toBeVisible();
    await expect(
      importDialog.getByText(/không phải GUID hợp lệ/).first(),
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
      .getByRole("button", {
        name: `Người phụ trách ${updatedBusinessName}`,
      })
      .click();
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
    expect(
      (await readFile(productExportPath!)).subarray(0, 2).toString(),
    ).toBe("PK");

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
    await expect(
      productImportDialog.getByText(/Tổng số: 1/),
    ).toBeVisible();
    await expect(
      productImportDialog.getByText(/Cơ sở không tồn tại/),
    ).toBeVisible();
    await productImportDialog.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: /thêm sản phẩm/i }).click();
    await page.getByRole("combobox", { name: "Cơ sở" }).click();
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
    expect(
      (await readFile(attachmentPath!)).subarray(0, 4).toString(),
    ).toBe("%PDF");
    await attachmentDialog
      .getByRole("button", { name: "Xóa e2e-chung-nhan.pdf" })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa file đính kèm")).toBeVisible();
    await attachmentDialog.getByRole("button", { name: "Close" }).click();

    await productRow
      .getByRole("button", { name: `Xóa ${productName}` })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa sản phẩm")).toBeVisible();

    await page.getByRole("tab", { name: "Cơ sở SXKD" }).click();
    businessRow = page.getByRole("row").filter({ hasText: businessCode });
    await businessRow
      .getByRole("button", { name: `Xóa ${updatedBusinessName}` })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa cơ sở")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: businessCode }),
    ).toHaveCount(0);
  });
});
