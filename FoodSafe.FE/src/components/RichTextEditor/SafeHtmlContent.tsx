import { sanitizeHtml } from "@/utils/sanitizeHtml";
import "./RichTextEditor.css";

interface SafeHtmlContentProps {
  html: string;
  className?: string;
  id?: string;
}

/** Hiển thị nội dung rich text sau khi đã loại bỏ HTML nguy hiểm. */
export function SafeHtmlContent({ html, className, id }: SafeHtmlContentProps) {
  const classes = ["rte-readonly", className].filter(Boolean).join(" ");

  return (
    <div
      id={id}
      className={classes}
      // Nội dung đã được lọc theo allow-list trong sanitizeHtml.
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
