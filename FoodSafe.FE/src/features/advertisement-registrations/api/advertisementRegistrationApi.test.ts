import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { advertisementRegistrationApi } from "./advertisementRegistrationApi";

describe("advertisementRegistrationApi", () => {
  it("uses generated option route contracts", async () => {
    const paths: string[] = [];
    server.use(
      http.get(
        "*/api/v1/app/advertisement-registration/product-options/:id",
        ({ request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json([]);
        },
      ),
      http.get(
        "*/api/v1/app/advertisement-registration/advertisement-type-options",
        ({ request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json([]);
        },
      ),
    );
    await advertisementRegistrationApi.productOptions("business-1");
    await advertisementRegistrationApi.advertisementTypes();
    expect(paths).toEqual([
      "/api/v1/app/advertisement-registration/product-options/business-1",
      "/api/v1/app/advertisement-registration/advertisement-type-options",
    ]);
  });
});
