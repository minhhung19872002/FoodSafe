import { expect, type Page } from "@playwright/test";

export async function signInAsAdmin(page: Page) {
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

  const xsrfCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
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

export async function requestVerificationToken(page: Page) {
  const xsrfCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
  expect(xsrfCookie, "XSRF-TOKEN cookie").toBeDefined();
  return decodeURIComponent(xsrfCookie!.value);
}
