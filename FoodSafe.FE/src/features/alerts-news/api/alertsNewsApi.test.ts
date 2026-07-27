import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { alertApi, newsApi } from "./alertsNewsApi";

describe("alertsNewsApi", () => {
  it("alertApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/atp-alert", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await alertApi.list({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/atp-alert");
    expect(result.items).toEqual([]);
  });

  it("alertApi uses the expected get path contract with a specific id", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/atp-alert/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "alert-1",
          organizationId: "org-1",
          title: "Cảnh báo ngộ độc",
        });
      }),
    );

    const result = await alertApi.get("alert-1");

    expect(requestedPath).toBe("/api/v1/app/atp-alert/alert-1");
    expect(result.id).toBe("alert-1");
  });

  it("newsApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/atp-news", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await newsApi.list({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/atp-news");
    expect(result.items).toEqual([]);
  });

  it("newsApi uses the expected alertOptions path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/atp-news/alert-options", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json([{ id: "alert-1", title: "Cảnh báo 01" }]);
      }),
    );

    const result = await newsApi.alertOptions();

    expect(requestedPath).toBe("/api/v1/app/atp-news/alert-options");
    expect(result).toEqual([{ id: "alert-1", title: "Cảnh báo 01" }]);
  });
});
