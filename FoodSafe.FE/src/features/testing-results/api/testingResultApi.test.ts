import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { testingResultApi } from "./testingResultApi";

describe("testingResultApi", () => {
  it("uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/testing-result", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await testingResultApi.list({});

    expect(requestedPath).toBe("/api/v1/app/testing-result");
    expect(result.items).toEqual([]);
  });

  it("uses the expected get path contract with a specific id", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/testing-result/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "result-1",
          organizationId: "org-1",
          sampleCode: "MU-001",
        });
      }),
    );

    const result = await testingResultApi.get("result-1");

    expect(requestedPath).toBe("/api/v1/app/testing-result/result-1");
    expect(result.id).toBe("result-1");
  });
});
