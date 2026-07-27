import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const STAMP = `PP${Date.now().toString(36).toUpperCase()}`;

async function adminHeaders(page: Page) {
  await signInAsAdmin(page);
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

test.describe("public portal (STT 41-49)", () => {
  test.setTimeout(120_000);

  test("portal home reaches every public function", async ({ page }) => {
    await page.goto("/cong-thong-tin");
    await expect(
      page.getByText("Cổng thông tin An toàn thực phẩm", { exact: false }).first(),
    ).toBeVisible();
    for (const path of [
      "/tra-cuu-chung",
      "/tra-cuu-giay-phep",
      "/co-so-bi-canh-bao",
      "/tin-tuc",
      "/tra-cuu-van-ban",
      "/gui-phan-anh",
    ]) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible();
    }
  });

  test("public business search returns real seeded data", async ({
    browser,
    page,
  }) => {
    const headers = await adminHeaders(page);
    const context = await page.context().request.get(
      "/api/v1/app/current-user-context",
    );
    expect(context.ok()).toBeTruthy();
    const organizationId = ((await context.json()) as {
      organizationId: string;
    }).organizationId;

    const name = `Cơ sở công khai ${STAMP}`;
    const create = await page.context().request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId,
        code: `PPB-${STAMP}`,
        name,
        productGroupIds: [],
      },
    });
    expect(create.ok(), await create.text()).toBeTruthy();

    const anonContext = await browser.newContext();
    const anon = await anonContext.newPage();
    try {
      await anon.goto("/tra-cuu-chung");
      await anon.getByPlaceholder(/Tên|từ khóa/i).first().fill(STAMP);
      await anon.getByRole("button", { name: /Tìm/ }).first().click();
      await expect(anon.getByText(name)).toBeVisible({ timeout: 10_000 });
    } finally {
      await anonContext.close();
    }
  });

  test("published public news appears on the portal; drafts do not", async ({
    browser,
    page,
  }) => {
    const headers = await adminHeaders(page);
    const request = page.context().request;

    const publishedTitle = `Tin công khai ${STAMP}`;
    const draftTitle = `Tin nháp ${STAMP}`;

    const published = await request.post("/api/v1/app/atp-news", {
      headers,
      data: { title: publishedTitle, content: "Nội dung tin công khai." },
    });
    expect(published.ok(), await published.text()).toBeTruthy();
    const publishedId = ((await published.json()) as { id: string }).id;
    const publish = await request.post(
      `/api/v1/app/atp-news/${publishedId}/publish`,
      { headers, data: { isPublic: true } },
    );
    expect(publish.ok(), await publish.text()).toBeTruthy();

    const draft = await request.post("/api/v1/app/atp-news", {
      headers,
      data: { title: draftTitle, content: "Tin nháp không được lộ." },
    });
    expect(draft.ok()).toBeTruthy();

    const anonContext = await browser.newContext();
    const anon = await anonContext.newPage();
    try {
      const list = await anon.request.get(
        `/api/v1/public/news?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=20`,
      );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as {
        items: { id: string; title: string }[];
      };
      expect(payload.items.some((n) => n.title === publishedTitle)).toBeTruthy();
      expect(payload.items.some((n) => n.title === draftTitle)).toBeFalsy();

      await anon.goto("/tin-tuc");
      await anon.getByPlaceholder(/từ khóa|Tìm/i).first().fill(STAMP);
      await anon.getByRole("button", { name: /Tìm/ }).first().click();
      await expect(anon.getByText(publishedTitle).first()).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await anonContext.close();
    }
  });

  test("citizen alert submission creates a moderation-queue draft", async ({
    browser,
    page,
  }) => {
    const title = `Phản ánh của dân ${STAMP}`;

    const anonContext = await browser.newContext();
    const anon = await anonContext.newPage();
    try {
      await anon.goto("/gui-phan-anh");
      await anon
        .getByPlaceholder(/Mô tả ngắn gọn vấn đề/)
        .fill(title);
      await anon
        .getByPlaceholder(/Mô tả chi tiết sự cố/)
        .fill("Phát hiện thực phẩm không đảm bảo vệ sinh tại chợ trung tâm.");
      // Turnstile test key auto-resolves; give the widget time to set a token
      await anon.waitForTimeout(2500);
      const responsePromise = anon.waitForResponse(
        (r) => r.url().includes("/alert-reports") && r.request().method() === "POST",
        { timeout: 20_000 },
      );
      await anon.getByRole("button", { name: /Gửi phản ánh|Gửi/ }).click();
      const submitResponse = await responsePromise;
      expect(submitResponse.ok(), await submitResponse.text()).toBeTruthy();
      await expect(
        anon.getByText(/Đã tiếp nhận phản ánh/, { exact: false }),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await anonContext.close();
    }

    // Officer sees the citizen report as a Draft alert with PublicReport source
    await signInAsAdmin(page);
    const list = await page.context().request.get(
      "/api/v1/app/atp-alert?MaxResultCount=50",
    );
    expect(list.ok(), await list.text()).toBeTruthy();
    const alerts = (await list.json()) as {
      items: { title: string; source: number; status: number }[];
    };
    const found = alerts.items.find((a) => a.title === title);
    expect(found).toBeTruthy();
    expect(found!.source).toBe(2); // PublicReport
    expect(found!.status).toBe(1); // Draft — awaiting moderation
  });

  test("submission without captcha token is rejected", async ({ request }) => {
    const response = await request.post("/api/v1/public/alert-reports", {
      maxRedirects: 0,
      data: {
        title: "Thiếu captcha",
        content: "Không có token.",
        category: 6,
        captchaToken: "",
      },
    });
    expect([400, 403]).toContain(response.status());
  });

  test("warned businesses and documents pages load with empty/data states", async ({
    browser,
  }) => {
    const anonContext = await browser.newContext();
    const anon = await anonContext.newPage();
    try {
      await anon.goto("/co-so-bi-canh-bao");
      await expect(
        anon.getByText(/Cơ sở bị cảnh báo|cảnh báo/i).first(),
      ).toBeVisible();
      await anon.goto("/tra-cuu-van-ban");
      await expect(
        anon.getByText(/Văn bản|Tra cứu văn bản/i).first(),
      ).toBeVisible();
      // Either a table with rows or the AntD empty state must render
      await expect(
        anon.locator(".ant-table, .ant-empty").first(),
      ).toBeVisible();
    } finally {
      await anonContext.close();
    }
  });
});
