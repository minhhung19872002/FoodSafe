import axios from "axios";

/**
 * Phân loại nguồn gốc lỗi để tầng hiển thị chọn đúng kênh thông báo.
 *
 * - `user`   — lỗi do người dùng / dữ liệu gửi lên (4xx). Thông báo phải nêu rõ
 *              quy tắc nghiệp vụ mà máy chủ trả về để người dùng tự sửa được.
 * - `system` — lỗi phía hệ thống (5xx, lỗi không xác định). Không hiển thị chi
 *              tiết kỹ thuật, hướng người dùng liên hệ quản trị viên.
 * - `network` — không gọi được máy chủ (mất mạng, timeout, request bị hủy).
 */
export type ApiErrorKind = "user" | "system" | "network";

export interface ApiErrorInfo {
  /** Thông điệp tiếng Việt hiển thị cho người dùng. Luôn khác rỗng. */
  message: string;
  kind: ApiErrorKind;
  /** HTTP status nếu máy chủ có phản hồi. */
  status?: number;
  /** Mã lỗi ABP, ví dụ `FoodSafe:Business:0002`. */
  code?: string;
  /** Request bị hủy chủ động (đổi filter, unmount...) — thường không cần báo. */
  canceled: boolean;
}

/** Cấu trúc `RemoteServiceErrorResponse` của ABP Framework. */
interface AbpValidationError {
  message?: string;
  members?: string[];
}

interface AbpErrorEnvelope {
  code?: string;
  message?: string;
  details?: string;
  validationErrors?: AbpValidationError[];
}

const UNKNOWN_MESSAGE = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

const SYSTEM_MESSAGE =
  "Hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";

const INVALID_INPUT_MESSAGE =
  "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.";

const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

const OFFLINE_MESSAGE =
  "Không kết nối được tới máy chủ. Vui lòng kiểm tra đường truyền và thử lại.";

const TIMEOUT_MESSAGE =
  "Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít phút.";

const CANCELED_MESSAGE = "Yêu cầu đã bị hủy.";

/** Thông điệp mặc định theo HTTP status khi máy chủ không trả về lý do cụ thể. */
const STATUS_FALLBACK_MESSAGES: Readonly<Record<number, string>> = {
  400: INVALID_INPUT_MESSAGE,
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: FORBIDDEN_MESSAGE,
  404: "Không tìm thấy dữ liệu yêu cầu. Dữ liệu có thể đã bị xóa.",
  405: "Thao tác không được hỗ trợ.",
  409: "Dữ liệu đã được thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
  413: "Tệp tải lên vượt quá dung lượng cho phép.",
  415: "Định dạng tệp không được hỗ trợ.",
  422: INVALID_INPUT_MESSAGE,
  429: "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.",
  503: "Hệ thống đang bảo trì hoặc quá tải. Vui lòng thử lại sau ít phút.",
};

/**
 * ABP trả về một số thông điệp mặc định bằng tiếng Anh khi không tìm thấy bản
 * dịch. Giao diện bắt buộc tiếng Việt nên phải thay thế trước khi hiển thị.
 */
const ABP_DEFAULT_MESSAGES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^internal server error/i, SYSTEM_MESSAGE],
  [/^an internal error occurred/i, SYSTEM_MESSAGE],
  [/^your request is not valid/i, INVALID_INPUT_MESSAGE],
  [/^authorization failed/i, FORBIDDEN_MESSAGE],
  [/^you are not authori[sz]ed/i, FORBIDDEN_MESSAGE],
  [/^current user did not login/i, "Vui lòng đăng nhập để tiếp tục."],
  [/^there is no entity/i, "Không tìm thấy dữ liệu yêu cầu."],
  [/^the given key/i, "Không tìm thấy dữ liệu yêu cầu."],
];

/** Dấu hiệu văn bản là stack trace / chi tiết kỹ thuật — tuyệt đối không hiển thị. */
const STACK_TRACE_PATTERNS: readonly RegExp[] = [
  /\n\s*at\s+\S/,
  /\bstack ?trace\b/i,
  /\b(?:System|Volo|Microsoft|Npgsql|FoodSafe)\.[A-Za-z0-9_.]*Exception\b/,
  /:line\s+\d+/i,
  /[A-Za-z]:\\[^\s]*\.(?:cs|dll)\b/,
  /\/[^\s]*\.cs:\d+/,
];

/** Lỗi runtime của JavaScript — thông điệp là dành cho lập trình viên. */
const RUNTIME_ERROR_NAMES: readonly string[] = [
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  "RangeError",
  "EvalError",
  "URIError",
  "AggregateError",
  "InternalError",
];

const MAX_MESSAGE_LENGTH = 400;
const MAX_VALIDATION_ITEMS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Body không phải JSON (trang lỗi HTML của reverse proxy...) — không dùng được.
    return undefined;
  }
}

function looksLikeStackTrace(text: string): boolean {
  return STACK_TRACE_PATTERNS.some((pattern) => pattern.test(text));
}

function truncate(text: string): string {
  return text.length > MAX_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd()}…`
    : text;
}

/**
 * Chuẩn hóa một chuỗi đến từ máy chủ: bỏ khoảng trắng thừa, loại bỏ nội dung
 * mang dấu hiệu stack trace, cắt bớt độ dài. Trả về `undefined` nếu không dùng được.
 */
function sanitizeServerText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length === 0 || looksLikeStackTrace(value)) {
    return undefined;
  }
  return truncate(text);
}

function localizeAbpDefaultMessage(text: string): string {
  const match = ABP_DEFAULT_MESSAGES.find(([pattern]) => pattern.test(text));
  return match ? match[1] : text;
}

function readOptionalString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function readValidationErrors(
  value: unknown,
): AbpValidationError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter(isRecord).map((item) => ({
    message: readOptionalString(item, "message"),
    members: Array.isArray(item.members)
      ? item.members.filter(
          (member): member is string => typeof member === "string",
        )
      : undefined,
  }));
  return items.length > 0 ? items : undefined;
}

/**
 * Đọc `{ error: { code, message, details, validationErrors } }` của ABP.
 * Có xử lý thêm ProblemDetails của ASP.NET Core (khi lỗi phát sinh trước pipeline ABP)
 * và body dạng chuỗi JSON.
 */
function readErrorEnvelope(data: unknown): AbpErrorEnvelope | undefined {
  // Body có thể là chuỗi JSON khi Content-Type không phải application/json.
  // Với responseType "blob"/"arraybuffer" (tải file) thì không đọc được đồng bộ,
  // lúc đó rơi về thông điệp mặc định theo HTTP status.
  const payload = typeof data === "string" ? tryParseJson(data) : data;
  if (!isRecord(payload)) {
    return undefined;
  }

  const abpError = payload.error;
  if (isRecord(abpError)) {
    return {
      code: readOptionalString(abpError, "code"),
      message: readOptionalString(abpError, "message"),
      details: readOptionalString(abpError, "details"),
      validationErrors: readValidationErrors(abpError.validationErrors),
    };
  }

  // ASP.NET Core ProblemDetails: { title, detail, errors: { field: [msg] } }
  const problemTitle = readOptionalString(payload, "title");
  const problemDetail = readOptionalString(payload, "detail");
  if (problemTitle === undefined && problemDetail === undefined) {
    return undefined;
  }
  const modelStateErrors = isRecord(payload.errors)
    ? Object.values(payload.errors)
        // Kiểu trả về khai báo tường minh: `Array.isArray` thu hẹp `unknown`
        // thành `any[]`, không để kiểu đó lọt ra ngoài.
        .flatMap((entry: unknown): unknown[] =>
          Array.isArray(entry) ? entry : [entry],
        )
        .filter((entry): entry is string => typeof entry === "string")
        .map((message) => ({ message }))
    : undefined;

  return {
    message: problemTitle,
    details: problemDetail,
    validationErrors:
      modelStateErrors && modelStateErrors.length > 0
        ? modelStateErrors
        : undefined,
  };
}

function joinValidationErrors(
  validationErrors: AbpValidationError[] | undefined,
): string | undefined {
  if (validationErrors === undefined) {
    return undefined;
  }
  const messages = validationErrors
    .map((item) => sanitizeServerText(item.message))
    .filter((message): message is string => message !== undefined);
  const unique = [...new Set(messages)];
  if (unique.length === 0) {
    return undefined;
  }
  const shown = unique.slice(0, MAX_VALIDATION_ITEMS);
  const suffix = unique.length > shown.length ? " …" : "";
  return truncate(`${shown.join(" ")}${suffix}`);
}

/**
 * Chọn thông điệp cụ thể nhất mà máy chủ cung cấp.
 * Thứ tự ưu tiên: `validationErrors` → `details` → `message`.
 */
function pickServerMessage(envelope: AbpErrorEnvelope): string | undefined {
  const validationMessage = joinValidationErrors(envelope.validationErrors);
  if (validationMessage !== undefined) {
    return validationMessage;
  }
  const details = sanitizeServerText(envelope.details);
  if (details !== undefined) {
    return details;
  }
  const message = sanitizeServerText(envelope.message);
  return message === undefined ? undefined : localizeAbpDefaultMessage(message);
}

function describeTransportError(code: string | undefined): ApiErrorInfo {
  const isTimeout = code === "ECONNABORTED" || code === "ETIMEDOUT";
  return {
    message: isTimeout ? TIMEOUT_MESSAGE : OFFLINE_MESSAGE,
    kind: "network",
    canceled: false,
  };
}

function describeNonHttpError(error: unknown): ApiErrorInfo {
  if (typeof error === "string") {
    const text = sanitizeServerText(error);
    return {
      message: text ?? UNKNOWN_MESSAGE,
      kind: text === undefined ? "system" : "user",
      canceled: false,
    };
  }

  if (error instanceof Error) {
    // Lỗi runtime của trình duyệt là lỗi lập trình — không đưa nguyên văn cho
    // người dùng. Lỗi do chính ứng dụng ném ra (`new Error("...")`) đã là tiếng Việt.
    if (RUNTIME_ERROR_NAMES.includes(error.name)) {
      return { message: SYSTEM_MESSAGE, kind: "system", canceled: false };
    }
    const text = sanitizeServerText(error.message);
    return {
      message: text ?? SYSTEM_MESSAGE,
      kind: text === undefined ? "system" : "user",
      canceled: false,
    };
  }

  return { message: UNKNOWN_MESSAGE, kind: "system", canceled: false };
}

/**
 * Phân tích lỗi bất kỳ thành thông tin đủ để hiển thị: thông điệp tiếng Việt,
 * phân loại user/system/network, HTTP status và mã lỗi ABP (nếu có).
 *
 * Dùng khi cần biết thêm `kind`/`code`; phần lớn trường hợp chỉ cần
 * {@link extractApiError}.
 */
export function describeApiError(error: unknown): ApiErrorInfo {
  if (axios.isCancel(error)) {
    return { message: CANCELED_MESSAGE, kind: "network", canceled: true };
  }

  // Tham số kiểu `unknown` để `response.data` không bị suy ra thành `any`.
  if (!axios.isAxiosError<unknown>(error)) {
    return describeNonHttpError(error);
  }

  const response = error.response;
  if (response === undefined) {
    return describeTransportError(error.code);
  }

  const status = response.status;
  const envelope = readErrorEnvelope(response.data);
  const serverMessage =
    envelope === undefined ? undefined : pickServerMessage(envelope);
  const code = envelope?.code;
  const isServerFault = status >= 500;

  // 5xx: chỉ tin thông điệp của máy chủ khi đó là lỗi nghiệp vụ có mã rõ ràng.
  // Ngoài ra ABP trả về thông điệp kỹ thuật chung chung, không giúp gì người dùng.
  const useServerMessage =
    serverMessage !== undefined && (!isServerFault || code !== undefined);

  if (useServerMessage) {
    return {
      message: serverMessage,
      kind: isServerFault ? "system" : "user",
      status,
      code,
      canceled: false,
    };
  }

  const fallback =
    STATUS_FALLBACK_MESSAGES[status] ??
    (isServerFault ? SYSTEM_MESSAGE : INVALID_INPUT_MESSAGE);

  return {
    message: fallback,
    kind: isServerFault ? "system" : "user",
    status,
    code,
    canceled: false,
  };
}

/**
 * Lấy thông điệp lỗi tiếng Việt để hiển thị cho người dùng.
 *
 * Ưu tiên lý do cụ thể máy chủ trả về (`validationErrors` → `details` →
 * `message` trong envelope của ABP), sau đó mới đến thông điệp mặc định theo
 * HTTP status. Không bao giờ trả về chuỗi rỗng và không bao giờ lộ stack trace.
 *
 * @example
 * ```ts
 * onError: (error) => message.error(extractApiError(error))
 * ```
 */
export function extractApiError(error: unknown): string {
  return describeApiError(error).message;
}
