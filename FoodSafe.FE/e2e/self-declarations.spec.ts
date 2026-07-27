import { readFile } from "node:fs/promises";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
  declarationNumber?: string;
}

interface OrganizationNode {
  id: string;
  children?: OrganizationNode[];
}

function firstOrganization(
  nodes: OrganizationNode[],
): OrganizationNode | undefined {
  for (const node of nodes) {
    return node ?? firstOrganization(node.children ?? []);
  }
  return undefined;
}

async function removeStaleArtifacts(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const declarations = await request.get(
    "/api/v1/app/self-declaration?Filter=E2E-STT21&MaxResultCount=100",
  );
  expect(declarations.ok(), await declarations.text()).toBeTruthy();
  for (const item of ((await declarations.json()) as { items: ListItem[] })
    .items) {
    if (item.declarationNumber?.startsWith("E2E-STT21")) {
      const deletion = await request.delete(
        `/api/v1/app/self-declaration/${item.id}`,
        { headers },
      );
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }

  const products = await request.get(
    "/api/v1/app/product?Filter=E2E-STT21&MaxResultCount=100",
  );
  expect(products.ok(), await products.text()).toBeTruthy();
  for (const item of ((await products.json()) as { items: ListItem[] }).items) {
    if (item.code?.startsWith("E2E-STT21")) {
      const deletion = await request.delete(`/api/v1/app/product/${item.id}`, {
        headers,
      });
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }

  const businesses = await request.get(
    "/api/v1/app/business?Filter=E2E-STT21&MaxResultCount=100",
  );
  expect(businesses.ok(), await businesses.text()).toBeTruthy();
  for (const item of ((await businesses.json()) as { items: ListItem[] })
    .items) {
    if (item.code?.startsWith("E2E-STT21")) {
      const deletion = await request.delete(`/api/v1/app/business/${item.id}`, {
        headers,
      });
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
}

test.describe("self-declaration management", () => {
  test.setTimeout(60_000);

  test("completes declaration, attachment, revocation and retention rules", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const token = await requestVerificationToken(page);
    const headers = { RequestVerificationToken: token };
    await removeStaleArtifacts(request, headers);

    const organizationsResponse = await request.get(
      "/api/v1/app/organization/tree",
    );
    expect(
      organizationsResponse.ok(),
      await organizationsResponse.text(),
    ).toBeTruthy();
    const organizationPayload = (await organizationsResponse.json()) as {
      items?: OrganizationNode[];
    };
    const organization = firstOrganization(organizationPayload.items ?? []);
    expect(organization).toBeDefined();

    const suffix = Date.now().toString().slice(-8);
    const businessCode = `E2E-STT21-CS-${suffix}`;
    const businessName = `Cơ sở STT21 ${suffix}`;
    const productCode = `E2E-STT21-SP-${suffix}`;
    const declarationNumber = `E2E-STT21-${suffix}`;
    const productName = `Sản phẩm tự công bố ${suffix}`;
    const businessResponse = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: organization!.id,
        code: businessCode,
        name: businessName,
        productGroupIds: [],
      },
    });
    expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
    const business = (await businessResponse.json()) as { id: string };
    const productResponse = await request.post("/api/v1/app/product", {
      headers,
      data: {
        businessId: business.id,
        code: productCode,
        name: productName,
      },
    });
    expect(productResponse.ok(), await productResponse.text()).toBeTruthy();
    const product = (await productResponse.json()) as { id: string };

    await page.goto("/self-declarations");
    await expect(
      page.getByRole("heading", { name: "Hồ sơ tự công bố" }),
    ).toBeVisible();

    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^ho-so-tu-cong-bo-\d{8}-\d{6}\.xlsx$/,
    );
    const exportPath = await exportDownload.path();
    expect(exportPath).not.toBeNull();
    expect((await readFile(exportPath!)).subarray(0, 2).toString()).toBe("PK");

    await page.getByRole("button", { name: "Thêm hồ sơ" }).click();
    await page.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.getByText(businessName, { exact: false }).last().click();
    await page.getByRole("combobox", { name: "Sản phẩm liên kết" }).click();
    await page.getByText(productName, { exact: false }).last().click();
    await page
      .getByRole("textbox", { name: "Số hồ sơ tự công bố" })
      .fill(declarationNumber);
    await expect(
      page.getByRole("textbox", { name: "Tên sản phẩm công bố" }),
    ).toHaveValue(productName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu hồ sơ tự công bố.")).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: declarationNumber });
    await expect(row).toContainText(productName);
    await row.getByRole("button", { name: `Tệp ${declarationNumber}` }).click();
    const attachmentDialog = page.getByRole("dialog", {
      name: `Tệp hồ sơ — ${declarationNumber}`,
    });
    await attachmentDialog.locator('input[type="file"]').setInputFiles({
      name: "tu-cong-bo.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await attachmentDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải tệp lên.")).toBeVisible();
    await expect(
      attachmentDialog.getByRole("cell", {
        name: "tu-cong-bo.pdf",
        exact: true,
      }),
    ).toBeVisible();

    const attachmentDownloadPromise = page.waitForEvent("download");
    await attachmentDialog
      .getByRole("button", { name: "Tải tu-cong-bo.pdf" })
      .click();
    const attachmentDownload = await attachmentDownloadPromise;
    const attachmentPath = await attachmentDownload.path();
    expect(attachmentPath).not.toBeNull();
    expect((await readFile(attachmentPath!)).subarray(0, 4).toString()).toBe(
      "%PDF",
    );
    await attachmentDialog
      .getByRole("button", { name: "Xóa tu-cong-bo.pdf" })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa tệp.")).toBeVisible();
    await attachmentDialog.getByRole("button", { name: "Close" }).click();

    row = page.getByRole("row").filter({ hasText: declarationNumber });
    await row
      .getByRole("button", { name: `Thu hồi ${declarationNumber}` })
      .click();
    const revokeDialog = page.getByRole("dialog", {
      name: `Thu hồi hồ sơ ${declarationNumber}`,
    });
    await revokeDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Kiểm thử quy trình thu hồi");
    await revokeDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();
    await expect(page.getByText("Đã thu hồi hồ sơ.")).toBeVisible();
    row = page.getByRole("row").filter({ hasText: declarationNumber });
    await expect(row).toContainText("Đã thu hồi");

    const declarationsAfterRevoke = await request.get(
      `/api/v1/app/self-declaration?Filter=${declarationNumber}&MaxResultCount=10`,
    );
    const declaration = (
      (await declarationsAfterRevoke.json()) as {
        items: { id: string }[];
      }
    ).items[0];
    expect(declaration).toBeDefined();
    const blockedUpload = await request.post(
      `/api/v1/app/self-declaration/${declaration.id}/attachments`,
      {
        headers,
        multipart: {
          file: {
            name: "blocked.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
          },
        },
      },
    );
    expect(blockedUpload.ok()).toBeFalsy();

    await row.getByRole("button", { name: `Xóa ${declarationNumber}` }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa hồ sơ.")).toBeVisible();

    const duplicateResponse = await request.post(
      "/api/v1/app/self-declaration",
      {
        headers,
        data: {
          businessId: business.id,
          declarationNumber,
          declarationDate: "2026-07-25",
          productName,
        },
      },
    );
    expect(duplicateResponse.ok()).toBeFalsy();

    const productDeletion = await request.delete(
      `/api/v1/app/product/${product.id}`,
      { headers },
    );
    expect(productDeletion.ok(), await productDeletion.text()).toBeTruthy();
    const businessDeletion = await request.delete(
      `/api/v1/app/business/${business.id}`,
      { headers },
    );
    expect(businessDeletion.ok(), await businessDeletion.text()).toBeTruthy();
  });
});
