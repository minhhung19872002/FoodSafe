import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { logApiError, notifyApiError } from "./notify";

/**
 * Cờ trong `meta` để tắt thông báo lỗi mặc định cho một query/mutation cụ thể.
 *
 * @example
 * ```ts
 * useMutation({ mutationFn, meta: { skipGlobalErrorToast: true } });
 * ```
 */
const SKIP_GLOBAL_ERROR_TOAST = "skipGlobalErrorToast";

function isOptedOut(meta: Record<string, unknown> | undefined): boolean {
  return meta?.[SKIP_GLOBAL_ERROR_TOAST] === true;
}

export const queryClient = new QueryClient({
  /**
   * TanStack Query v5 gọi `MutationCache.onError` TRƯỚC rồi mới gọi `onError`
   * của từng mutation — cả hai đều chạy. Vì vậy handler toàn cục ở đây chỉ được
   * phép hiển thị thông báo khi nơi gọi chưa tự xử lý, nếu không ~120 chỗ đang
   * có `onError` riêng sẽ hiện hai popup cho cùng một lỗi.
   *
   * Có hai lớp chặn:
   * 1. Nếu mutation khai báo `onError` ở cấp `useMutation` thì bỏ qua ngay
   *    (kiểm tra tất định, không cần chờ).
   * 2. Với `mutate(vars, { onError })` và `try/catch` quanh `mutateAsync` —
   *    những callback đó nằm trong field private của MutationObserver nên không
   *    đọc được — `notifyApiError` hoãn thông báo một nhịp ngắn và tự hủy nếu
   *    phát hiện antd đã hiện thông báo lỗi khác trong khoảng đó.
   */
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      logApiError(error, mutation.options.mutationKey?.join("/"));
      if (isOptedOut(mutation.meta)) {
        return;
      }
      if (typeof mutation.options.onError === "function") {
        return;
      }
      notifyApiError(error);
    },
  }),

  /**
   * Với query, màn hình thường đã có sẵn trạng thái lỗi/empty của riêng nó nên
   * chỉ thông báo khi query đã có dữ liệu cũ: đó là trường hợp refetch nền thất
   * bại, người dùng đang nhìn dữ liệu cũ mà không hề biết.
   */
  queryCache: new QueryCache({
    onError: (error, query) => {
      logApiError(error, query.queryHash);
      if (isOptedOut(query.meta) || query.state.data === undefined) {
        return;
      }
      notifyApiError(error);
    },
  }),

  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
