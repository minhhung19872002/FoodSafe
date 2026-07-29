import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  it("keeps formatting and removes executable markup", () => {
    const result = sanitizeHtml(
      '<p onclick="steal()">Nội dung <strong>đậm</strong></p>' +
        '<a href="javascript:steal()" target="_blank">Liên kết</a>' +
        '<iframe src="https://example.com"></iframe><script>steal()</script>',
    );

    expect(result).toContain("<p>Nội dung <strong>đậm</strong></p>");
    expect(result).toContain('<a target="_blank" rel="noopener noreferrer">');
    expect(result).not.toMatch(/onclick|javascript:|iframe|script|steal\(\)/);
  });
});
