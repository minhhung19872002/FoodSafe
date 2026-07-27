import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicCfsCertificateLookupPage from "./PublicCfsCertificateLookupPage";

describe("PublicCfsCertificateLookupPage", () => {
  it("renders search form for CFS certificate lookup", () => {
    render(<PublicCfsCertificateLookupPage />);

    expect(
      screen.getByText("Tra cứu chứng nhận lưu hành tự do (CFS)"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Số CFS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tra cứu/ })).toBeInTheDocument();
  });
});
