import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicAdRegistrationLookupPage from "./PublicAdRegistrationLookupPage";

describe("PublicAdRegistrationLookupPage", () => {
  it("renders search form for advertisement registration lookup", () => {
    render(<PublicAdRegistrationLookupPage />);

    expect(
      screen.getByText("Tra cứu đăng ký quảng cáo thực phẩm"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Số đăng ký"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tra cứu/ }),
    ).toBeInTheDocument();
  });
});
