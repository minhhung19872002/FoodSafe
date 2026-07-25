import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { fetchCatalog, persistCatalog, removeCatalog } from "./catalogApi";

describe("master catalog API", () => {
  it("normalizes country DTOs into the shared catalog view model", async () => {
    server.use(
      http.get("*/api/v1/app/master-catalog/countries", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("filter")).toBe("VN");
        return HttpResponse.json({
          items: [
            {
              id: "vn",
              codeAlpha2: "VN",
              nameVi: "Việt Nam",
              description: null,
              isActive: true,
              sortOrder: 0,
            },
          ],
          totalCount: 1,
        });
      }),
    );

    const result = await fetchCatalog("country", { filter: "VN" });

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        code: "VN",
        name: "Việt Nam",
        description: undefined,
      }),
    );
  });

  it("uses id-before-action routes for update and delete", async () => {
    let updateBody: unknown;
    server.use(
      http.put(
        "*/api/v1/app/master-catalog/d1/document-type",
        async ({ request }) => {
          updateBody = await request.json();
          return HttpResponse.json({ id: "d1" });
        },
      ),
      http.delete(
        "*/api/v1/app/master-catalog/d1/document-type",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const input = {
      code: "DEC",
      name: "Decision",
      isActive: true,
      sortOrder: 0,
    };

    await persistCatalog("document-type", input, "d1");
    await removeCatalog("document-type", "d1");

    expect(updateBody).toEqual(input);
  });

  it("maps the country view model back to the API contract", async () => {
    let createBody: unknown;
    server.use(
      http.post("*/api/v1/app/master-catalog/country", async ({ request }) => {
        createBody = await request.json();
        return HttpResponse.json({ id: "country-1" });
      }),
    );

    await persistCatalog("country", {
      code: "VN",
      codeAlpha3: "VNM",
      name: "Việt Nam",
      nameEn: "Vietnam",
      isActive: true,
      sortOrder: 1,
    });

    expect(createBody).toEqual({
      codeAlpha2: "VN",
      codeAlpha3: "VNM",
      nameVi: "Việt Nam",
      nameEn: "Vietnam",
      isActive: true,
      sortOrder: 1,
    });
  });
});
