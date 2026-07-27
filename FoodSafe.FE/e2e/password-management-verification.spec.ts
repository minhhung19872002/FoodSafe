import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const INITIAL_PASSWORD = "E2ePass@2026!";
const CHANGED_PASSWORD = "E2ePass@2026!Moi";
const WEAK_PASSWORD = "abc";

async function csrfHeaders(page: Page) {
  return {
    RequestVerificationToken: await requestVerificationToken(page),
  };
}

async function createThrowawayUser(
  adminPage: Page,
  suffix: string,
): Promise<{ id: string; userName: string }> {
  const headers = await csrfHeaders(adminPage);
  const userName = `e2e.password.${suffix}@foodsafe.local`;
  const response = await adminPage.context().request.post(
    "/api/identity/users",
    {
      headers,
      data: {
        userName,
        name: `Người dùng đổi mật khẩu ${suffix}`,
        email: userName,
        password: INITIAL_PASSWORD,
        isActive: true,
        lockoutEnabled: false,
        roleNames: [],
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  const user = (await response.json()) as { id: string };
  return { id: user.id, userName };
}

async function deleteUser(adminPage: Page, userId: string) {
  const headers = await csrfHeaders(adminPage);
  await adminPage.context().request.delete(`/api/identity/users/${userId}`, {
    headers,
    maxRedirects: 0,
  });
}

async function newUserSession(browser: Browser, userName: string, password: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, password);
  return { context, page };
}

test.describe("password management verification (F-002)", () => {
  test.setTimeout(120_000);

  test("unauthenticated change-password is rejected", async ({ request }) => {
    const response = await request.post(
      "/api/v1/app/account-security/change-password",
      {
        maxRedirects: 0,
        data: {
          currentPassword: "x",
          newPassword: "Whatever@123",
        },
      },
    );
    expect([401, 302, 400]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("full change-password lifecycle on a throwaway user", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-8);
    const user = await createThrowawayUser(page, suffix);

    try {
      const session = await newUserSession(
        browser,
        user.userName,
        INITIAL_PASSWORD,
      );
      try {
        const headers = await csrfHeaders(session.page);
        const request = session.page.context().request;
        const endpoint = "/api/v1/app/account-security/change-password";

        const wrongCurrent = await request.post(endpoint, {
          headers,
          maxRedirects: 0,
          data: {
            currentPassword: "SaiMatKhau@123",
            newPassword: CHANGED_PASSWORD,
          },
        });
        expect(wrongCurrent.ok()).toBeFalsy();
        expect(await wrongCurrent.text()).toContain("FoodSafe");

        const weak = await request.post(endpoint, {
          headers,
          maxRedirects: 0,
          data: {
            currentPassword: INITIAL_PASSWORD,
            newPassword: WEAK_PASSWORD,
          },
        });
        expect(weak.status()).toBe(400);

        const reused = await request.post(endpoint, {
          headers,
          maxRedirects: 0,
          data: {
            currentPassword: INITIAL_PASSWORD,
            newPassword: INITIAL_PASSWORD,
          },
        });
        expect(reused.ok()).toBeFalsy();

        const success = await request.post(endpoint, {
          headers,
          maxRedirects: 0,
          data: {
            currentPassword: INITIAL_PASSWORD,
            newPassword: CHANGED_PASSWORD,
          },
        });
        expect(success.ok(), await success.text()).toBeTruthy();
      } finally {
        await session.context.close();
      }

      const oldPasswordContext = await browser.newContext();
      const oldPasswordPage = await oldPasswordContext.newPage();
      try {
        const config = await oldPasswordPage.context().request.get(
          "/api/abp/application-configuration?IncludeLocalizationResources=false",
        );
        expect(config.ok()).toBeTruthy();
        const xsrf = (await oldPasswordContext.cookies()).find(
          (c) => c.name === "XSRF-TOKEN",
        );
        const failedLogin = await oldPasswordPage.context().request.post(
          "/api/account/login",
          {
            headers: {
              RequestVerificationToken: decodeURIComponent(xsrf!.value),
            },
            maxRedirects: 0,
            data: {
              userNameOrEmailAddress: user.userName,
              password: INITIAL_PASSWORD,
              captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
              rememberMe: false,
            },
          },
        );
        expect(failedLogin.ok()).toBeTruthy();
        const failedResult = (await failedLogin.json()) as {
          result?: number;
        };
        expect(
          failedResult.result,
          "login with the old password must not succeed",
        ).not.toBe(1);
      } finally {
        await oldPasswordContext.close();
      }

      const newSession = await newUserSession(
        browser,
        user.userName,
        CHANGED_PASSWORD,
      );
      await newSession.context.close();

      const relogin = await newUserSession(
        browser,
        user.userName,
        CHANGED_PASSWORD,
      );
      try {
        const historyReuse = await relogin.page.context().request.post(
          "/api/v1/app/account-security/change-password",
          {
            headers: await csrfHeaders(relogin.page),
            maxRedirects: 0,
            data: {
              currentPassword: CHANGED_PASSWORD,
              newPassword: INITIAL_PASSWORD,
            },
          },
        );
        expect(historyReuse.ok()).toBeFalsy();
      } finally {
        await relogin.context.close();
      }
    } finally {
      await deleteUser(page, user.id);
    }
  });
});
