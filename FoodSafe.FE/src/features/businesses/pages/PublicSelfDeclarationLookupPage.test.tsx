import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PublicSelfDeclarationLookupPage from "./PublicSelfDeclarationLookupPage";

describe("PublicSelfDeclarationLookupPage", () => {
  it("renders search form for self-declaration lookup", () => {
    render(
      <MemoryRouter>
        <PublicSelfDeclarationLookupPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Tra cứu tự công bố sản phẩm")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Số tự công bố")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tra cứu/ })).toBeInTheDocument();
  });
});
