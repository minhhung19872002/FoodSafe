import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicEligibilityCertificateLookupPage from "./PublicEligibilityCertificateLookupPage";

describe("PublicEligibilityCertificateLookupPage", () => {
  it("renders search form for eligibility certificate lookup", () => {
    render(<PublicEligibilityCertificateLookupPage />);

    expect(
      screen.getByText("Tra cứu giấy chứng nhận đủ điều kiện ATTP"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Số giấy chứng nhận"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tra cứu/ })).toBeInTheDocument();
  });
});
