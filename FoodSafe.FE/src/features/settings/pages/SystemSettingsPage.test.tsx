import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SystemSettingsPage from "./SystemSettingsPage";

describe("SystemSettingsPage", () => {
  it("renders system info and security configuration", () => {
    render(<SystemSettingsPage />);

    expect(screen.getByText("Cấu hình hệ thống")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL 15")).toBeInTheDocument();
    expect(screen.getByText("8 ký tự")).toBeInTheDocument();
    expect(screen.getByText("90 ngày")).toBeInTheDocument();
    expect(screen.getByText("Cấp độ 2")).toBeInTheDocument();
    expect(screen.getByText(/Nghị định 85\/2016\/NĐ-CP/)).toBeInTheDocument();
  });
});
