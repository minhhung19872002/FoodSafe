import { expect, test } from "@playwright/test";

test.describe("public lookup pages", () => {
  test.setTimeout(30_000);

  const lookupPages = [
    {
      route: "/tra-cuu-co-so",
      heading: "Tra cứu cơ sở sản xuất, kinh doanh thực phẩm",
      placeholder: "Tên cơ sở hoặc mã số",
    },
    {
      route: "/tra-cuu-tu-cong-bo",
      heading: "Tra cứu tự công bố sản phẩm",
      placeholder: "Số tự công bố",
    },
    {
      route: "/tra-cuu-dang-ky-cong-bo",
      heading: "Tra cứu đăng ký công bố sản phẩm",
      placeholder: "Số đăng ký",
    },
    {
      route: "/tra-cuu-giay-du-dieu-kien",
      heading: "Tra cứu giấy chứng nhận đủ điều kiện ATTP",
      placeholder: "Số giấy chứng nhận",
    },
    {
      route: "/tra-cuu-cfs",
      heading: "Tra cứu chứng nhận lưu hành tự do (CFS)",
      placeholder: "Số CFS",
    },
    {
      route: "/tra-cuu-gcn-xuat-khau",
      heading: "Tra cứu giấy chứng nhận xuất khẩu thực phẩm",
      placeholder: "Số GCN xuất khẩu",
    },
    {
      route: "/tra-cuu-dang-ky-quang-cao",
      heading: "Tra cứu đăng ký quảng cáo thực phẩm",
      placeholder: "Số đăng ký",
    },
  ];

  for (const { route, heading, placeholder } of lookupPages) {
    test(`${route} renders and handles not-found`, async ({ page }) => {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: heading }),
      ).toBeVisible();

      const input = page.getByPlaceholder(placeholder);
      await expect(input).toBeVisible();

      const button = page.getByRole("button", { name: "Tra cứu" });
      await expect(button).toBeVisible();

      await input.fill("NONEXISTENT-999999999");
      await button.click();
      await expect(page.getByText("Không tìm thấy")).toBeVisible({
        timeout: 10_000,
      });
    });
  }
});
