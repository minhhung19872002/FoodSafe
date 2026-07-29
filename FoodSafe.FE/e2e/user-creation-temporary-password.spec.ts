import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

/**
 * Real full-stack verification that creating an account no longer depends on
 * the mail server.
 *
 * FR STT 2 asks for a temporary password plus an account notification email.
 * The implementation used to hide the temporary password and rely solely on the
 * email, so an SMTP outage turned account creation into a 500 and rolled the
 * whole account back. Creation must now succeed and hand the password over.
 */

interface CreatedUser {
  user: { id: string; email: string; mustChangePassword: boolean };
  temporaryPassword: string;
  notificationEmailSent: boolean;
}

async function firstOrganizationId(page: Page) {
  const response = await page
    .context()
    .request.get("/api/v1/app/organization/tree");
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { items: { id: string }[] };
  expect(body.items.length).toBeGreaterThan(0);
  return body.items[0].id;
}

async function createUser(page: Page, email: string) {
  const token = await requestVerificationToken(page);
  const response = await page
    .context()
    .request.post("/api/v1/administration/users", {
      headers: { RequestVerificationToken: token },
      failOnStatusCode: false,
      data: {
        fullName: "E2E Temp Password User",
        email,
        phoneNumber: "0912345678",
        organizationId: await firstOrganizationId(page),
        position: "Chuyên viên",
        department: "Phòng nghiệp vụ",
        roleNames: ["ProvinceStaff"],
        geographyScopes: [],
      },
    });
  return response;
}

async function deleteUser(page: Page, id: string) {
  const token = await requestVerificationToken(page);
  await page.context().request.delete(`/api/v1/administration/users/${id}`, {
    headers: { RequestVerificationToken: token },
    failOnStatusCode: false,
  });
}

test.describe("Account creation hands over a temporary password", () => {
  test("returns a usable temporary password and reports mail delivery", async ({
    page,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);

    const email = `e2e-temp-${Date.now()}@foodsafe.local`;
    const response = await createUser(page, email);

    expect(response.status(), await response.text()).toBe(200);
    const created = (await response.json()) as CreatedUser;

    // The password policy: at least 8 characters with upper, lower, digit and
    // a non-alphanumeric character.
    const password = created.temporaryPassword;
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^A-Za-z0-9]/);

    expect(created.user.email).toBe(email);
    expect(created.user.mustChangePassword).toBe(true);
    // Mailpit is part of the local stack, so delivery should succeed here.
    expect(created.notificationEmailSent).toBe(true);

    await deleteUser(page, created.user.id);
  });

  /**
   * The regression this whole change exists for. Run against a stack whose SMTP
   * host is unreachable:
   *   SMTP_HOST=smtp.invalid docker compose up -d --no-deps --force-recreate api
   *   E2E_SMTP_DOWN=1 npx playwright test e2e/user-creation-temporary-password.spec.ts
   */
  test("still creates the account when the mail server is unreachable", async ({
    page,
  }) => {
    test.skip(
      process.env.E2E_SMTP_DOWN !== "1",
      "needs a stack with an unreachable SMTP host",
    );

    await page.goto("/");
    await signInAsAdmin(page);

    const email = `e2e-nosmtp-${Date.now()}@foodsafe.local`;
    const response = await createUser(page, email);

    // Used to be 500 with the account rolled back.
    expect(response.status(), await response.text()).toBe(200);
    const created = (await response.json()) as CreatedUser;
    expect(created.notificationEmailSent).toBe(false);
    expect(created.temporaryPassword.length).toBeGreaterThanOrEqual(8);

    // The account must really be there, not half-written.
    const fetched = await page
      .context()
      .request.get(`/api/v1/administration/users/${created.user.id}`);
    expect(fetched.status()).toBe(200);
    expect(((await fetched.json()) as { email: string }).email).toBe(email);

    await deleteUser(page, created.user.id);
  });

  test("the temporary password is accepted and forces a password change", async ({
    page,
    browser,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);

    const email = `e2e-temp-login-${Date.now()}@foodsafe.local`;
    const response = await createUser(page, email);
    expect(response.status(), await response.text()).toBe(200);
    const created = (await response.json()) as CreatedUser;

    // Fresh context: the new user signing in for the first time, with no
    // administrator session bleeding through.
    const context = await browser.newContext();
    try {
      const fresh = await context.newPage();
      await fresh.goto("/");
      await fresh
        .context()
        .request.get(
          "/api/abp/application-configuration?IncludeLocalizationResources=false",
        );
      const xsrf = (await fresh.context().cookies()).find(
        (cookie) => cookie.name === "XSRF-TOKEN",
      );
      expect(xsrf, "XSRF-TOKEN cookie").toBeDefined();

      const login = await fresh.context().request.post("/api/account/login", {
        headers: { RequestVerificationToken: decodeURIComponent(xsrf!.value) },
        failOnStatusCode: false,
        data: {
          userNameOrEmailAddress: email,
          password: created.temporaryPassword,
          captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
          rememberMe: false,
        },
      });
      expect(login.status(), await login.text()).toBe(200);
      // 3 = NotAllowed. PreSignInCheck runs before the password is verified and
      // answers this for any account flagged "must change password", so it
      // proves the forced-change rule fired — not that the password is right.
      expect(((await login.json()) as { result: number }).result).toBe(3);

      // The forced-change endpoint does verify the current password, so this is
      // what actually proves the temporary password we handed over is correct.
      const complete = async (currentPassword: string) =>
        fresh
          .context()
          .request.post(
            "/api/v1/app/account-security/complete-initial-password-change",
            {
              headers: {
                RequestVerificationToken: decodeURIComponent(xsrf!.value),
              },
              failOnStatusCode: false,
              data: {
                userNameOrEmailAddress: email,
                currentPassword,
                newPassword: "Doi-Mat-Khau-9!",
                captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
              },
            },
          );

      const wrong = await complete("Definitely-Wrong-1!");
      expect(wrong.status(), await wrong.text()).toBeGreaterThanOrEqual(400);

      const right = await complete(created.temporaryPassword);
      expect(right.status(), await right.text()).toBeLessThan(300);
    } finally {
      await context.close();
    }

    await deleteUser(page, created.user.id);
  });
});
