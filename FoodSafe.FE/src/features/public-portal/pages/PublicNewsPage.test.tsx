import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import PublicNewsPage from "./PublicNewsPage";

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/tin-tuc/news-1"]}>
        <Routes>
          <Route path="/tin-tuc/:id" element={<PublicNewsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PublicNewsPage detail", () => {
  it("renders formatted HTML without exposing tags or unsafe content", async () => {
    server.use(
      http.get("*/api/v1/public/branding", () =>
        HttpResponse.json({ hasLogo: false, hasLoginBackground: false }),
      ),
      http.get("*/api/v1/public/news/news-1", () =>
        HttpResponse.json({
          id: "news-1",
          title: "Tin nóng hổi về sự việc ngộ độc thực phẩm",
          summary: "",
          category: "Cảnh báo",
          isFeatured: false,
          viewCount: 4,
          publishedAt: "2026-07-29T00:00:00Z",
          content:
            '<p>Bài viết <strong>đã định dạng</strong></p><script>alert("xss")</script>',
          linkedAlerts: [],
        }),
      ),
    );

    const { container } = renderDetail();

    expect(
      await screen.findByRole("heading", {
        name: "Tin nóng hổi về sự việc ngộ độc thực phẩm",
      }),
    ).toBeVisible();
    expect(screen.getByText("đã định dạng").tagName).toBe("STRONG");
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.queryByText(/alert\("xss"\)/)).not.toBeInTheDocument();
  });
});
