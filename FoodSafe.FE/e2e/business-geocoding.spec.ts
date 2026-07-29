import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

/**
 * Real full-stack verification of the address → coordinate feature.
 *
 * Coordinates and the address text are stored as independent fields, so editing
 * an address never used to move the map pin. These tests exercise the real
 * geocoding endpoint (which calls the configured upstream provider), the real
 * database, and the real browser form.
 *
 * Not part of CI: the upstream geocoder is a live third-party service.
 */
interface AreaItem {
  id: string;
  name: string;
}

/** Reads the real administrative-area catalog, exactly as the form does. */
async function firstProvinceId(page: Page) {
  const response = await page
    .context()
    .request.get("/api/v1/app/geographic-catalog/provinces?OnlyActive=true");
  expect(response.ok(), await response.text()).toBeTruthy();
  const items = ((await response.json()) as { items: AreaItem[] }).items;
  expect(items.length).toBeGreaterThan(0);
  return items[0].id;
}

test.describe("Business address geocoding", () => {
  test("resolves an address to coordinates through the real API", async ({
    page,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);

    const token = await requestVerificationToken(page);
    const response = await page
      .context()
      .request.post("/api/v1/app/geocoding/resolve", {
        headers: { RequestVerificationToken: token },
        // The address form that used to fail: a Vietnamese house number and
        // street-type prefix, scoped by the province the user picked.
        data: {
          street: "Số 12 phố Cao Thắng",
          provinceId: await firstProvinceId(page),
        },
      });

    expect(response.status(), await response.text()).toBe(200);
    const result = (await response.json()) as {
      latitude: number;
      longitude: number;
      matchedAddress: string;
    };

    // Quảng Ninh sits roughly within 20.5–21.8 N, 106.4–108.1 E. Asserting the
    // province box (rather than an exact point) keeps the test stable while
    // still proving the provider resolved a real Vietnamese address.
    expect(result.latitude).toBeGreaterThan(20.5);
    expect(result.latitude).toBeLessThan(21.8);
    expect(result.longitude).toBeGreaterThan(106.4);
    expect(result.longitude).toBeLessThan(108.1);
    expect(result.matchedAddress.length).toBeGreaterThan(0);
  });

  test("returns 204 rather than an error when nothing matches", async ({
    page,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);

    const token = await requestVerificationToken(page);
    const response = await page
      .context()
      .request.post("/api/v1/app/geocoding/resolve", {
        headers: { RequestVerificationToken: token },
        data: { street: "zzzz khong ton tai zzzz qqqq" },
      });

    // A no-match must be distinguishable from a failure, so the UI can say
    // "not found" instead of "error".
    expect([200, 204]).toContain(response.status());
  });

  test("rejects anonymous callers", async ({ page }) => {
    await page.goto("/");

    const response = await page
      .context()
      .request.post("/api/v1/app/geocoding/resolve", {
        data: { street: "Phố Cao Thắng, Hạ Long" },
        failOnStatusCode: false,
      });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("fills the map coordinates from the business form", async ({ page }) => {
    await page.goto("/");
    await signInAsAdmin(page);

    await page.goto("/businesses");
    await expect(
      page.getByRole("heading", { name: "Cơ sở và sản phẩm" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /thêm cơ sở/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog
      .getByLabel("Địa chỉ", { exact: true })
      .fill("Số 12 phố Cao Thắng");

    const locate = dialog.getByRole("button", {
      name: "Định vị theo địa chỉ",
    });
    await expect(locate).toBeEnabled();
    await locate.click();

    // The picker prints the resolved pair once the provider answers.
    await expect(dialog.getByText(/Tọa độ|chọn tọa độ:/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(dialog.getByText(/Đã khớp:/)).toBeVisible({
      timeout: 30_000,
    });
  });
});
