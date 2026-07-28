import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

/**
 * Số liệu công khai dùng cho các khối thống kê ở trang đăng nhập và trang chủ
 * cổng thông tin. Các endpoint `/v1/public/*` cho phép truy cập ẩn danh nên
 * gọi được cả khi chưa đăng nhập.
 *
 * Đặt ở `src/hooks/` vì được dùng bởi nhiều feature (auth, public-portal) —
 * feature không import chéo lẫn nhau.
 */
export interface PublicCounts {
  businesses: number;
  eligibilityCertificates: number;
  selfDeclarations: number;
  alerts: number;
}

/** Chỉ cần `totalCount` nên lấy trang nhỏ nhất có thể. */
const COUNT_ONLY = { SkipCount: 0, MaxResultCount: 1 } as const;

async function totalOf(path: string): Promise<number> {
  const response = await api.get<{ totalCount: number }>(path, {
    params: COUNT_ONLY,
  });
  return response.data.totalCount ?? 0;
}

export function usePublicCounts() {
  return useQuery({
    queryKey: ["public-counts"] as const,
    queryFn: async (): Promise<PublicCounts> => {
      const [businesses, eligibilityCertificates, selfDeclarations, alerts] =
        await Promise.all([
          totalOf("/v1/public/businesses/search"),
          totalOf("/v1/public/eligibility-certificates/search"),
          totalOf("/v1/public/self-declarations/search"),
          totalOf("/v1/public/alerts"),
        ]);
      return {
        businesses,
        eligibilityCertificates,
        selfDeclarations,
        alerts,
      };
    },
    staleTime: 300_000,
    retry: false,
  });
}
