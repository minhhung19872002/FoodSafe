import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { selfDeclarationApi } from "./selfDeclarationApi";

describe("selfDeclarationApi", () => {
  it("uses the generated product-options path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get(
        "*/api/v1/app/self-declaration/product-options/:businessId",
        ({ params, request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json([
            {
              id: "product-1",
              businessId: params.businessId,
              code: "SP-01",
              name: "Sản phẩm kiểm thử",
            },
          ]);
        },
      ),
    );

    const result = await selfDeclarationApi.productOptions("business-1");

    expect(requestedPath).toBe(
      "/api/v1/app/self-declaration/product-options/business-1",
    );
    expect(result[0]?.businessId).toBe("business-1");
  });
});
