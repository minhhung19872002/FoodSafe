const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "h2",
  "h3",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
]);

const REMOVED_WITH_CONTENT = new Set([
  "embed",
  "iframe",
  "math",
  "object",
  "script",
  "style",
  "svg",
  "template",
]);

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isSafeLink(value: string): boolean {
  const normalized = value.trim();
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("?")
  ) {
    return true;
  }

  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(normalized).protocol);
  } catch {
    return false;
  }
}

/**
 * Làm sạch HTML do người dùng nhập trước khi hiển thị công khai.
 * Chỉ giữ các thẻ định dạng mà trình soạn thảo hỗ trợ và loại bỏ toàn bộ
 * script, event handler, style cũng như URL có protocol nguy hiểm.
 */
export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return escapeHtml(html);

  const document = new DOMParser().parseFromString(html, "text/html");

  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    const tagName = element.tagName.toLowerCase();

    if (REMOVED_WITH_CONTENT.has(tagName)) {
      element.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed =
        tagName === "a" && ["href", "rel", "target", "title"].includes(name);

      if (!allowed || (name === "href" && !isSafeLink(attribute.value))) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a" && element.getAttribute("target") === "_blank") {
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  return document.body.innerHTML;
}
