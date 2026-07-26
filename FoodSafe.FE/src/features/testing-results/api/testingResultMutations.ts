import { useMutation, useQueryClient } from "@tanstack/react-query";
import { testingResultApi } from "./testingResultApi";
import { trKeys } from "./testingResultQueries";
import type {
  CreateUpdateTestingResultInput,
  TestingResultFilter,
} from "../types/testingResult.types";

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: trKeys.all });
}

export function useCreateTestingResult() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateTestingResultInput) =>
      testingResultApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateTestingResult() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateTestingResultInput;
    }) => testingResultApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteTestingResult() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => testingResultApi.delete(id),
    onSuccess: refresh,
  });
}

export function useExportTestingResults() {
  return useMutation({
    mutationFn: (filter: TestingResultFilter) =>
      testingResultApi.exportExcel(filter),
  });
}
