import {
  ConfigProvider,
  message as staticMessage,
  notification as staticNotification,
} from "antd";
import type { MessageArgsProps, NotificationArgsProps } from "antd";
import viVN from "antd/locale/vi_VN";
import { themeConfig } from "@/theme/themeConfig";
import { describeApiError } from "./apiError";
import type { ApiErrorInfo } from "./apiError";

/**
 * API tối thiểu mà module này cần. Tương thích với cả static API của antd
 * (`import { message } from "antd"`) lẫn instance lấy từ `App.useApp()`.
 */
export interface AntdNotifier {
  message: { error: (config: MessageArgsProps) => unknown };
  notification: { error: (config: NotificationArgsProps) => void };
}

/**
 * Static API của antd render trong một React root riêng nên KHÔNG nhận được
 * theme/locale từ `<ConfigProvider>` trong `main.tsx`. `ConfigProvider.config`
 * với `holderRender` là cơ chế chính thức của antd để bọc lại root đó — nhờ vậy
 * thông báo phát ra từ ngoài React (ví dụ tầng TanStack Query) vẫn đúng theme
 * và tiếng Việt.
 */
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider locale={viVN} theme={themeConfig}>
      {children}
    </ConfigProvider>
  ),
});

const staticNotifier: AntdNotifier = {
  message: staticMessage,
  notification: staticNotification,
};

let boundNotifier: AntdNotifier | undefined;

/**
 * Tùy chọn: một component nằm trong `<App>` của antd có thể gọi hàm này với
 * `App.useApp()` để module dùng đúng instance gắn với App context thay cho
 * static API.
 *
 * @example
 * ```tsx
 * const instances = App.useApp();
 * useEffect(() => bindAntdNotifier(instances), [instances]);
 * ```
 */
export function bindAntdNotifier(notifier: AntdNotifier): () => void {
  boundNotifier = notifier;
  return () => {
    if (boundNotifier === notifier) {
      boundNotifier = undefined;
    }
  };
}

function currentNotifier(): AntdNotifier {
  return boundNotifier ?? staticNotifier;
}

/**
 * Khoảng chờ trước khi hiện thông báo dự phòng. Trong khoảng này, nếu nơi gọi
 * đã tự hiện thông báo lỗi thì thông báo dự phòng bị hủy.
 */
const SUPPRESSION_WINDOW_MS = 250;

/**
 * Nhận diện thông báo lỗi/cảnh báo của antd trong DOM.
 * antd đặt class `<prefix>-message-error`, `<prefix>-message-notice-error`,
 * `<prefix>-notification-notice-error`... nên khớp theo hậu tố để không phụ
 * thuộc vào `prefixCls`. Chỉ tính lỗi và cảnh báo — thông báo thành công của
 * thao tác khác không được phép che lỗi.
 */
const ERROR_NOTICE_SELECTOR = [
  '[class*="message-error"]',
  '[class*="message-warning"]',
  '[class*="message-notice-error"]',
  '[class*="message-notice-warning"]',
  '[class*="notification-notice-error"]',
  '[class*="notification-notice-warning"]',
].join(",");

let domObserver: MutationObserver | undefined;
let watcherCount = 0;
let lastErrorNoticeAt = 0;

function containsErrorNotice(node: Node): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  // Lọc rẻ tiền trước khi chạy selector: đại đa số DOM mutation không liên quan.
  const className = node.className;
  if (
    typeof className !== "string" ||
    (!className.includes("message") && !className.includes("notification"))
  ) {
    return false;
  }
  return (
    node.matches(ERROR_NOTICE_SELECTOR) ||
    node.querySelector(ERROR_NOTICE_SELECTOR) !== null
  );
}

function handleDomMutations(records: MutationRecord[]): void {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (containsErrorNotice(node)) {
        lastErrorNoticeAt = Date.now();
        return;
      }
    }
  }
}

/**
 * Chỉ theo dõi DOM trong lúc đang chờ một thông báo dự phòng, để không tạo chi
 * phí thường trực cho toàn ứng dụng.
 */
function startWatchingNotices(): void {
  watcherCount += 1;
  if (domObserver !== undefined || typeof MutationObserver === "undefined") {
    return;
  }
  domObserver = new MutationObserver(handleDomMutations);
  domObserver.observe(document.body, { childList: true, subtree: true });
}

function stopWatchingNotices(): void {
  watcherCount = Math.max(0, watcherCount - 1);
  if (watcherCount === 0 && domObserver !== undefined) {
    domObserver.disconnect();
    domObserver = undefined;
  }
}

function showApiError(info: ApiErrorInfo): void {
  const notifier = currentNotifier();
  if (info.kind === "system") {
    // Lỗi hệ thống hiển thị bằng notification để phân biệt rõ với lỗi thao tác
    // của người dùng và để người dùng kịp đọc trước khi báo quản trị viên.
    notifier.notification.error({
      title: "Lỗi hệ thống",
      description: info.message,
      key: `foodsafe-error-${info.message}`,
      duration: 8,
    });
    return;
  }
  void notifier.message.error({
    content: info.message,
    key: `foodsafe-error-${info.message}`,
    duration: 5,
  });
}

/** Ghi log lỗi gốc ra console — không được nuốt lỗi kể cả khi đã hiển thị. */
export function logApiError(error: unknown, context?: string): void {
  console.error(`[FoodSafe] Lỗi API${context ? ` (${context})` : ""}:`, error);
}

/**
 * Hiển thị thông báo lỗi dự phòng cho những lời gọi API không tự xử lý lỗi.
 *
 * Thông báo được lên lịch sau {@link SUPPRESSION_WINDOW_MS}; nếu trong khoảng
 * đó có bất kỳ thông báo lỗi/cảnh báo nào của antd xuất hiện (nơi gọi tự báo,
 * kể cả bằng `try/catch` quanh `mutateAsync`) thì thông báo dự phòng bị hủy để
 * người dùng không thấy hai popup cho cùng một lỗi.
 */
export function notifyApiError(error: unknown): void {
  const info = describeApiError(error);

  // Request bị hủy chủ động không phải lỗi của người dùng.
  if (info.canceled) {
    return;
  }

  // 401 đã được interceptor trong `lib/axios.ts` xử lý bằng cách chuyển hướng
  // sang trang đăng nhập; hiện toast lúc này chỉ nhấp nháy rồi mất theo reload.
  if (info.status === 401) {
    return;
  }

  if (typeof document === "undefined") {
    showApiError(info);
    return;
  }

  const raisedAt = Date.now();
  startWatchingNotices();
  window.setTimeout(() => {
    stopWatchingNotices();
    if (lastErrorNoticeAt >= raisedAt) {
      return;
    }
    showApiError(info);
  }, SUPPRESSION_WINDOW_MS);
}
