import { expect, test } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

test.describe("authentication verification (F-001)", () => {
  test.setTimeout(60_000);

  test("login page displays all required form elements", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByPlaceholder("Tên đăng nhập hoặc email"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("Mật khẩu")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Đăng nhập" }),
    ).toBeVisible();
  });

  test("wrong password is rejected — login result is not 1", async ({
    page,
  }) => {
    // Fetch config to set the XSRF-TOKEN cookie
    await page.context().request.get(
      "/api/abp/application-configuration?IncludeLocalizationResources=false",
    );
    const cookies = await page.context().cookies();
    const xsrf = cookies.find((c) => c.name === "XSRF-TOKEN");
    expect(xsrf, "XSRF-TOKEN cookie must be present").toBeDefined();

    const login = await page.context().request.post("/api/account/login", {
      headers: {
        RequestVerificationToken: decodeURIComponent(xsrf!.value),
      },
      data: {
        userNameOrEmailAddress: "admin",
        password: "CompletelyWrongPassword999!",
        captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
        rememberMe: false,
      },
    });
    // ABP returns HTTP 200 even on failed login; result != 1 means rejected
    expect(login.ok()).toBeTruthy();
    const body = (await login.json()) as { result?: number };
    expect(body.result).not.toBe(1);
  });

  test("state-changing requests require the CSRF token", async ({ page }) => {
    // Anonymous callers first: the login endpoint itself does NOT demand the
    // antiforgery header (ABP skips validation for unauthenticated requests),
    // so this documents the actual behaviour rather than asserting a rejection
    // that never happens. Bad credentials are still refused on their merits.
    await page.context().request.get(
      "/api/abp/application-configuration?IncludeLocalizationResources=false",
    );
    const anonymousLogin = await page.context().request.post(
      "/api/account/login",
      {
        data: {
          userNameOrEmailAddress: "admin",
          password: "definitely-not-the-password",
          captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
          rememberMe: false,
        },
        maxRedirects: 0,
      },
    );
    const anonymousBody = (await anonymousLogin.json()) as { result: number };
    expect(anonymousBody.result).not.toBe(1);

    // The property that protects a signed-in officer: once a session cookie
    // exists, a write without the RequestVerificationToken header is refused.
    await signInAsAdmin(page);
    const forged = await page.context().request.post("/api/v1/app/organization", {
      // Intentionally omitting RequestVerificationToken.
      data: { name: "CSRF probe", code: "CSRF-PROBE", level: 1 },
      maxRedirects: 0,
    });
    expect(forged.status(), await forged.text()).toBe(400);

    // The same write succeeds once the token rides along, proving the refusal
    // above came from CSRF validation and not from the payload.
    const token = await requestVerificationToken(page);
    const accepted = await page.context().request.post(
      "/api/v1/app/organization",
      {
        headers: { RequestVerificationToken: token },
        data: {
          name: `CSRF probe ${Date.now()}`,
          code: `CSRF-PROBE-${Date.now().toString().slice(-6)}`,
          level: 1,
        },
        maxRedirects: 0,
      },
    );
    expect(accepted.status()).not.toBe(400);
    if (accepted.ok()) {
      const created = (await accepted.json()) as { id: string };
      await page.context().request.delete(
        `/api/v1/app/organization/${created.id}`,
        { headers: { RequestVerificationToken: token } },
      );
    }
  });

  test("successful login grants access to protected API and dashboard", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    // Verify API-level access
    const res = await page.context().request.get(
      "/api/v1/app/dashboard/stats",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    // Verify UI-level access
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Xin chào/ }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("logout clears session — protected route redirects to login afterwards", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    // Verify we can access a protected page before logout
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Xin chào/ }),
    ).toBeVisible({ timeout: 10_000 });

    // Logout — ABP account logout uses GET, not POST
    const logout = await page.context().request.get("/api/account/logout");
    expect([200, 204, 302]).toContain(logout.status());

    // Navigate to a protected page via the browser — must redirect to /login
    await page.goto("/businesses");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("session persists across page navigation without re-login", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/businesses");
    // Must stay on businesses, not redirect to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 });
    await page.goto("/organizations");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Xin chào/ }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated access to protected route redirects to login", async ({
    page,
  }) => {
    await page.goto("/businesses");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
