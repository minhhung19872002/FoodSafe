import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicExportFoodCertificateLookupPage from "./PublicExportFoodCertificateLookupPage";

describe("PublicExportFoodCertificateLookupPage", () => {
  it("renders search form for export food certificate lookup", () => {
    render(<PublicExportFoodCertificateLookupPage />);

    expect(
      screen.getByText("Tra cứu giấy chứng nhận xuất khẩu thực phẩm"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Số GCN xuất khẩu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tra cứu/ })).toBeInTheDocument();
  });
});
