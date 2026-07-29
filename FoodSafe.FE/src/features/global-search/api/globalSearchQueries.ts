import { useQuery } from "@tanstack/react-query";
import { globalSearchApi } from "./globalSearchApi";

export const globalSearchKeys = {
  all: ["global-search"] as const,
  results: (q: string) => [...globalSearchKeys.all, "results", q] as const,
};

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: globalSearchKeys.results(q),
    queryFn: () => globalSearchApi.search(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}
