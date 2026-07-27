import { expect, type Page } from "@playwright/test";

export async function signIn(
  page: Page,
  userNameOrEmailAddress: string,
  password: string,
) {
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
      userNameOrEmailAddress,
      password,
      captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
      rememberMe: false,
    },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const loginResult = (await login.json()) as { result?: number };
  expect(
    loginResult.result,
    `login for ${userNameOrEmailAddress} returned result=${loginResult.result}`,
  ).toBe(1);

  const refresh = await request.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  expect(refresh.ok()).toBeTruthy();
}

export async function signInAsAdmin(page: Page) {
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "E2E_ADMIN_PASSWORD is required for authenticated E2E tests",
    );
  }
  await signIn(page, "admin", password);
}

export async function requestVerificationToken(page: Page) {
  const xsrfCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
  expect(xsrfCookie, "XSRF-TOKEN cookie").toBeDefined();
  return decodeURIComponent(xsrfCookie!.value);
}
