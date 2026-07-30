import { useEffect } from "react";

/** Vùng cuộn ngang do Ant Design Table sinh ra. */
const SCROLL_CONTAINER_SELECTOR = ".ant-table-content, .ant-table-body";

/**
 * Các phần tử tương tác — bấm vào đây phải giữ nguyên hành vi gốc (mở dropdown,
 * chọn checkbox, sắp xếp cột...) nên không khởi tạo kéo ngang.
 */
const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  '[role="button"]',
  '[contenteditable="true"]',
  ".ant-select",
  ".ant-picker",
  ".ant-checkbox-wrapper",
  ".ant-radio-wrapper",
  ".ant-switch",
  ".ant-slider",
  ".ant-tag",
  ".ant-table-column-sorters",
  ".ant-table-filter-trigger",
  ".ant-dropdown-trigger",
].join(",");

/** Ngưỡng px trước khi coi là kéo — dưới ngưỡng vẫn tính là click bình thường. */
const DRAG_THRESHOLD = 4;

const DRAGGING_CLASS = "is-drag-scrolling";
const DRAGGABLE_CLASS = "is-drag-scrollable";

interface DragState {
  container: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  dragging: boolean;
}

/**
 * Cho phép bấm giữ và kéo ngang bên trong bảng dữ liệu như trên thiết bị cảm
 * ứng, thay vì buộc người dùng cuộn xuống cuối bảng để với tới thanh cuộn.
 *
 * Cài đặt bằng event delegation ở cấp document nên áp dụng cho mọi
 * Ant Design Table trong ứng dụng, kể cả bảng nằm trong Modal/Drawer.
 */
export function useTableDragScroll() {
  useEffect(() => {
    let state: DragState | null = null;
    /** Click phát sinh ngay sau một lần kéo phải bị bỏ qua. */
    let suppressNextClick = false;

    const stop = () => {
      if (!state) return;
      state.container.classList.remove(DRAGGING_CLASS);
      suppressNextClick = state.dragging;
      state = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      // Cảm ứng và bút đã có hành vi cuộn quán tính sẵn của trình duyệt.
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(INTERACTIVE_SELECTOR)) return;

      const container = target.closest<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
      if (!container) return;
      if (container.scrollWidth <= container.clientWidth) return;

      state = {
        container,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: container.scrollLeft,
        dragging: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state || event.pointerId !== state.pointerId) return;

      const deltaX = event.clientX - state.startX;
      if (!state.dragging) {
        const deltaY = event.clientY - state.startY;
        // Chỉ nhận khi ý định là kéo ngang — kéo dọc để cuộn trang vẫn hoạt động.
        if (Math.abs(deltaX) < DRAG_THRESHOLD) return;
        if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
        state.dragging = true;
        state.container.classList.add(DRAGGING_CLASS);
      }

      state.container.scrollLeft = state.startScrollLeft - deltaX;
      // Ngăn bôi đen văn bản trong lúc kéo.
      event.preventDefault();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressNextClick) return;
      suppressNextClick = false;
      event.stopPropagation();
      event.preventDefault();
    };

    // Gợi ý con trỏ "grab" để người dùng biết bảng kéo được. Chỉ đo lại khi
    // con trỏ chuyển sang một vùng cuộn khác nên không gây reflow liên tục.
    let hinted: HTMLElement | null = null;
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as HTMLElement | null;
      const container =
        target?.closest<HTMLElement>(SCROLL_CONTAINER_SELECTOR) ?? null;
      if (container === hinted) return;
      hinted?.classList.remove(DRAGGABLE_CLASS);
      hinted = container;
      if (container && container.scrollWidth > container.clientWidth) {
        container.classList.add(DRAGGABLE_CLASS);
      }
    };

    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", stop, true);
    document.addEventListener("pointercancel", stop, true);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", stop, true);
      document.removeEventListener("pointercancel", stop, true);
      document.removeEventListener("click", onClickCapture, true);
      hinted?.classList.remove(DRAGGABLE_CLASS);
    };
  }, []);
}
