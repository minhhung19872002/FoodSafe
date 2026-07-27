import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios";
import { authApi } from "./authApi";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("authApi.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: {} });
  });

  it("refreshes the antiforgery token after the claims identity changes", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { result: 1, description: "Success" },
    });

    await authApi.login({
      userNameOrEmailAddress: "admin",
      password: "secret",
      captchaToken: "token",
    });

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "/abp/application-configuration",
      { params: { IncludeLocalizationResources: false } },
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/abp/application-configuration",
      { params: { IncludeLocalizationResources: false } },
    );
  });

  it("does not establish an authenticated token after a failed login", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { result: 2, description: "Invalid credentials" },
    });

    await authApi.login({
      userNameOrEmailAddress: "admin",
      password: "wrong",
      captchaToken: "token",
    });

    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
