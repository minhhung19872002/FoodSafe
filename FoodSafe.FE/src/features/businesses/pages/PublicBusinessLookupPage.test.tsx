import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicBusinessLookupPage from "./PublicBusinessLookupPage";

describe("PublicBusinessLookupPage", () => {
  it("renders search form for public business lookup", () => {
    render(<PublicBusinessLookupPage />);

    expect(
      screen.getByText("Tra cứu cơ sở sản xuất, kinh doanh thực phẩm"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nhập mã cơ sở hoặc mã số thuế để kiểm tra thông tin."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tên cơ sở hoặc mã số"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tra cứu/ }),
    ).toBeInTheDocument();
  });
});
