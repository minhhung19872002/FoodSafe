import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
  registrationNumber?: string;
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
  const registrations = await request.get(
    "/api/v1/app/advertisement-registration?Filter=E2E-STT23&MaxResultCount=100",
  );
  expect(registrations.ok(), await registrations.text()).toBeTruthy();
  for (const item of ((await registrations.json()) as { items: ListItem[] })
    .items) {
    if (item.registrationNumber?.startsWith("E2E-STT23")) {
      const deletion = await request.delete(
        `/api/v1/app/advertisement-registration/${item.id}`,
        { headers },
      );
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }

  for (const endpoint of ["product", "business"]) {
    const response = await request.get(
      `/api/v1/app/${endpoint}?Filter=E2E-STT23&MaxResultCount=100`,
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    for (const item of ((await response.json()) as { items: ListItem[] })
      .items) {
      if (item.code?.startsWith("E2E-STT23")) {
        const deletion = await request.delete(
          `/api/v1/app/${endpoint}/${item.id}`,
          { headers },
        );
        expect(deletion.ok(), await deletion.text()).toBeTruthy();
      }
    }
  }
}

test.describe("advertisement registration management", () => {
  test.setTimeout(75_000);

  test("completes multi-product, file, revocation and retention rules", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
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

    const catalogResponse = await request.get(
      "/api/v1/app/master-catalog/advertisement-types?Filter=E2E-STT23&MaxResultCount=10",
    );
    expect(catalogResponse.ok(), await catalogResponse.text()).toBeTruthy();
    let advertisementType = (
      (await catalogResponse.json()) as {
        items: { id: string; name: string }[];
      }
    ).items[0];
    if (!advertisementType) {
      const createTypeResponse = await request.post(
        "/api/v1/app/master-catalog/advertisement-type",
        {
          headers,
          data: {
            code: "E2E-STT23-QC",
            name: "Loại quảng cáo E2E STT23",
            description: "Dữ liệu kiểm thử lưu trữ dài hạn",
            isActive: true,
            sortOrder: 999,
          },
        },
      );
      expect(
        createTypeResponse.ok(),
        await createTypeResponse.text(),
      ).toBeTruthy();
      advertisementType = (await createTypeResponse.json()) as {
        id: string;
        name: string;
      };
    }

    const suffix = Date.now().toString().slice(-8);
    const businessName = `Cơ sở STT23 ${suffix}`;
    const firstProductName = `Sản phẩm quảng cáo A ${suffix}`;
    const secondProductName = `Sản phẩm quảng cáo B ${suffix}`;
    const registrationNumber = `E2E-STT23-${suffix}/QN`;
    const businessResponse = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: organization!.id,
        code: `E2E-STT23-CS-${suffix}`,
        name: businessName,
        productGroupIds: [],
      },
    });
    expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
    const business = (await businessResponse.json()) as { id: string };

    const products: { id: string; name: string }[] = [];
    for (const [marker, name] of [
      ["A", firstProductName],
      ["B", secondProductName],
    ] as const) {
      const response = await request.post("/api/v1/app/product", {
        headers,
        data: {
          businessId: business.id,
          code: `E2E-STT23-SP-${marker}-${suffix}`,
          name,
        },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      products.push({ ...(await response.json()), name });
    }

    await page.goto("/advertisement-registrations");
    await expect(
      page.getByRole("heading", { name: "Đăng ký nội dung quảng cáo" }),
    ).toBeVisible();
    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^dang-ky-noi-dung-quang-cao-\d{8}-\d{6}\.xlsx$/,
    );
    const exportPath = await exportDownload.path();
    expect((await readFile(exportPath!)).subarray(0, 2).toString()).toBe("PK");

    await page.getByRole("button", { name: "Thêm đăng ký" }).click();
    await page.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.keyboard.type(businessName);
    await page.getByText(businessName, { exact: false }).last().click();
    await page.getByRole("combobox", { name: "Sản phẩm quảng cáo" }).click();
    await page.getByText(firstProductName, { exact: false }).last().click();
    await page.getByText(secondProductName, { exact: false }).last().click();
    await page.keyboard.press("Escape");
    await page.getByRole("combobox", { name: "Loại hình quảng cáo" }).click();
    await page
      .getByText(advertisementType.name, { exact: false })
      .last()
      .click();
    await page
      .getByRole("textbox", { name: "Số đăng ký" })
      .fill(registrationNumber);
    await page
      .getByRole("textbox", { name: "Phương tiện quảng cáo" })
      .fill("Báo điện tử");
    await page
      .getByRole("textbox", { name: "Mô tả nội dung" })
      .fill("Nội dung kiểm thử STT23");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu đăng ký quảng cáo.")).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: registrationNumber });
    await expect(row).toContainText(firstProductName);
    await expect(row).toContainText(secondProductName);
    await row
      .getByRole("button", { name: `Tệp ${registrationNumber}` })
      .click();
    const fileDialog = page.getByRole("dialog", {
      name: `Tệp đăng ký — ${registrationNumber}`,
    });
    await fileDialog.locator('input[type="file"]').setInputFiles({
      name: "noi-dung-quang-cao.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await fileDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải tệp lên.")).toBeVisible();
    const attachmentDownloadPromise = page.waitForEvent("download");
    await fileDialog
      .getByRole("button", { name: "Tải noi-dung-quang-cao.pdf" })
      .click();
    const attachmentDownload = await attachmentDownloadPromise;
    expect(
      (await readFile((await attachmentDownload.path())!))
        .subarray(0, 4)
        .toString(),
    ).toBe("%PDF");
    await fileDialog
      .getByRole("button", { name: "Xóa noi-dung-quang-cao.pdf" })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa tệp.")).toBeVisible();
    await fileDialog.getByRole("button", { name: "Close" }).click();

    const foundResponse = await request.get(
      `/api/v1/app/advertisement-registration?Filter=${encodeURIComponent(registrationNumber)}&MaxResultCount=10`,
    );
    expect(foundResponse.ok(), await foundResponse.text()).toBeTruthy();
    const registration = (
      (await foundResponse.json()) as {
        items: {
          id: string;
          registrationDate: string;
        }[];
      }
    ).items[0];
    const updateResponse = await request.put(
      `/api/v1/app/advertisement-registration/${registration.id}`,
      {
        headers,
        data: {
          businessId: business.id,
          advertisementTypeId: advertisementType.id,
          productIds: [products[1].id],
          registrationNumber,
          registrationDate: registration.registrationDate,
          medium: "Báo điện tử",
          contentDescription: "Đã cập nhật liên kết nhiều-nhiều",
        },
      },
    );
    expect(updateResponse.ok(), await updateResponse.text()).toBeTruthy();
    const updated = (await updateResponse.json()) as {
      products: { id: string }[];
    };
    expect(updated.products.map((item) => item.id)).toEqual([products[1].id]);

    await page.reload();
    row = page.getByRole("row").filter({ hasText: registrationNumber });
    await expect(row).not.toContainText(firstProductName);
    await expect(row).toContainText(secondProductName);
    await row
      .getByRole("button", { name: `Thao tác ${registrationNumber}` })
      .click();
    await page.getByRole("menuitem", { name: "Thu hồi" }).click();
    const revokeDialog = page.getByRole("dialog", {
      name: `Thu hồi đăng ký ${registrationNumber}`,
    });
    await revokeDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Kiểm thử quy trình thu hồi");
    await revokeDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();
    await expect(page.getByText("Đã thu hồi đăng ký.")).toBeVisible();

    const blockedUpload = await request.post(
      `/api/v1/app/advertisement-registration/${registration.id}/attachments`,
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

    row = page.getByRole("row").filter({ hasText: registrationNumber });
    await row
      .getByRole("button", { name: `Xóa ${registrationNumber}` })
      .click();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("Đã xóa đăng ký.")).toBeVisible();
    const duplicate = await request.post(
      "/api/v1/app/advertisement-registration",
      {
        headers,
        data: {
          businessId: business.id,
          advertisementTypeId: advertisementType.id,
          productIds: [products[1].id],
          registrationNumber,
          registrationDate: "2026-07-25",
        },
      },
    );
    expect(duplicate.ok()).toBeFalsy();

    for (const product of products) {
      await request.delete(`/api/v1/app/product/${product.id}`, { headers });
    }
    await request.delete(`/api/v1/app/business/${business.id}`, { headers });
  });
});
