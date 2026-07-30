import { useTableDragScroll } from "@/hooks/useTableDragScroll";

/**
 * Gắn các hành vi UI dùng chung toàn ứng dụng (không render gì).
 */
export function GlobalBehaviors() {
  useTableDragScroll();
  return null;
}
