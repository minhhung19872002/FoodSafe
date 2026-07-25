import { expect, test, type Page } from "@playwright/test";

async function signInAsAdmin(page: Page) {
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "E2E_ADMIN_PASSWORD is required for authenticated E2E tests",
    );
  }

  const request = page.context().request;
  const configuration = await request.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  expect(configuration.ok()).toBeTruthy();

  const cookies = await page.context().cookies();
  const xsrfCookie = cookies.find((cookie) => cookie.name === "XSRF-TOKEN");
  expect(xsrfCookie, "XSRF-TOKEN cookie").toBeDefined();

  const login = await request.post("/api/account/login", {
    headers: {
      RequestVerificationToken: decodeURIComponent(xsrfCookie!.value),
    },
    data: {
      userNameOrEmailAddress: "admin",
      password,
      captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
      rememberMe: false,
    },
  });
  expect(login.ok(), await login.text()).toBeTruthy();

  const refresh = await request.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  expect(refresh.ok()).toBeTruthy();
}

async function removeStaleE2eArtifacts(page: Page) {
  const request = page.context().request;
  const response = await request.get(
    "/api/v1/app/master-catalog/document-types?Filter=E2E-&MaxResultCount=100",
  );
  expect(response.ok()).toBeTruthy();
  const pageResult = (await response.json()) as {
    items: Array<{ id: string; code: string }>;
  };
  const xsrfCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
  expect(xsrfCookie, "XSRF-TOKEN cookie").toBeDefined();

  for (const item of pageResult.items.filter(({ code }) =>
    code.startsWith("E2E-"),
  )) {
    const deletion = await request.delete(
      `/api/v1/app/master-catalog/${item.id}/document-type`,
      {
        headers: {
          RequestVerificationToken: decodeURIComponent(xsrfCookie!.value),
        },
      },
    );
    expect(deletion.ok()).toBeTruthy();
  }
}

test.describe("master catalog administration", () => {
  test("creates, edits, and deletes a document type", async ({ page }) => {
    await signInAsAdmin(page);
    await removeStaleE2eArtifacts(page);
    await page.goto("/catalogs");

    await expect(
      page.getByRole("heading", { name: "Danh mục dùng chung" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Loại văn bản" }).click();

    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-${suffix}`;
    const initialName = `Văn bản E2E ${suffix}`;
    const updatedName = `${initialName} cập nhật`;

    await page.getByRole("button", { name: /thêm mới/i }).click();
    await page.getByRole("textbox", { name: "Mã", exact: true }).fill(code);
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(initialName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();

    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible();
    let row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(initialName);

    await row.getByRole("button", { name: `Sửa ${initialName}` }).click();
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(updatedName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();

    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible();
    row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(updatedName);

    await row.getByRole("button", { name: `Xóa ${updatedName}` }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();

    await expect(page.getByText("Đã xóa dữ liệu danh mục")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: code })).toHaveCount(
      0,
    );
  });
});
