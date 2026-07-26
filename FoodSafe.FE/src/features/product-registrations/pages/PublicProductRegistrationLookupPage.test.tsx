import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicProductRegistrationLookupPage from "./PublicProductRegistrationLookupPage";

describe("PublicProductRegistrationLookupPage", () => {
  it("renders search form for product registration lookup", () => {
    render(<PublicProductRegistrationLookupPage />);

    expect(
      screen.getByText("Tra cứu đăng ký công bố sản phẩm"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Số đăng ký")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tra cứu/ }),
    ).toBeInTheDocument();
  });
});
