import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { poisoningCaseApi, poisoningIncidentApi } from "./foodPoisoningApi";

describe("foodPoisoningApi", () => {
  it("poisoningCaseApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/food-poisoning-case", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await poisoningCaseApi.list({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/food-poisoning-case");
    expect(result.items).toEqual([]);
  });

  it("poisoningCaseApi uses the expected submit path contract", async () => {
    let requestedPath = "";
    server.use(
      http.post(
        "*/api/v1/app/food-poisoning-case/:id/submit",
        ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json({
            id: "case-1",
            organizationId: "org-1",
            status: 2,
          });
        },
      ),
    );

    const result = await poisoningCaseApi.submit("case-1");

    expect(requestedPath).toBe(
      "/api/v1/app/food-poisoning-case/case-1/submit",
    );
    expect(result.id).toBe("case-1");
  });

  it("poisoningIncidentApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/food-poisoning-incident", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await poisoningIncidentApi.list({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/food-poisoning-incident");
    expect(result.items).toEqual([]);
  });

  it("poisoningIncidentApi uses the expected submit path contract", async () => {
    let requestedPath = "";
    server.use(
      http.post(
        "*/api/v1/app/food-poisoning-incident/:id/submit",
        ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json({
            id: "incident-1",
            organizationId: "org-1",
            status: 2,
          });
        },
      ),
    );

    const result = await poisoningIncidentApi.submit("incident-1");

    expect(requestedPath).toBe(
      "/api/v1/app/food-poisoning-incident/incident-1/submit",
    );
    expect(result.id).toBe("incident-1");
  });
});
