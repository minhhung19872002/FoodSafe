import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios";
import { deleteCatalog, getCatalog, saveCatalog } from "./catalogApi";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe("master catalog API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes country fields for the shared table", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [{ id: "vn", codeAlpha2: "VN", nameVi: "Việt Nam" }],
        totalCount: 1,
      },
    });

    const result = await getCatalog("country", { filter: "VN" });

    expect(api.get).toHaveBeenCalledWith("/v1/app/master-catalog/countries", {
      params: { filter: "VN" },
    });
    expect(result.items[0]).toEqual(
      expect.objectContaining({ code: "VN", name: "Việt Nam" }),
    );
  });

  it("uses conventional id-before-action mutation routes", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: "d1" } });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    const input = {
      code: "DEC",
      name: "Decision",
      isActive: true,
      sortOrder: 0,
    };

    await saveCatalog("document-type", input, "d1");
    await deleteCatalog("document-type", "d1");

    expect(api.put).toHaveBeenCalledWith(
      "/v1/app/master-catalog/d1/document-type",
      input,
    );
    expect(api.delete).toHaveBeenCalledWith(
      "/v1/app/master-catalog/d1/document-type",
    );
  });
});
