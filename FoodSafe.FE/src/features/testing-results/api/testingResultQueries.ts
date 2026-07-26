import { useQuery } from "@tanstack/react-query";
import { testingResultApi } from "./testingResultApi";
import type { TestingResultFilter } from "../types/testingResult.types";

export const trKeys = {
  all: ["testing-results"] as const,
  lists: () => [...trKeys.all, "list"] as const,
  list: (filter: TestingResultFilter) => [...trKeys.lists(), filter] as const,
  detail: (id: string) => [...trKeys.all, "detail", id] as const,
};

export function useTestingResults(filter: TestingResultFilter) {
  return useQuery({
    queryKey: trKeys.list(filter),
    queryFn: () => testingResultApi.list(filter),
  });
}

export function useTestingResult(id: string) {
  return useQuery({
    queryKey: trKeys.detail(id),
    queryFn: () => testingResultApi.get(id),
    enabled: !!id,
  });
}
