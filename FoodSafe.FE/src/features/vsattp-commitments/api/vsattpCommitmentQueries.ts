import { useQuery } from "@tanstack/react-query";
import { vsattpCommitmentApi } from "./vsattpCommitmentApi";
import type { VsattpCommitmentFilter } from "../types/vsattpCommitment.types";

export const vsattpCommitmentKeys = {
  all: ["vsattp-commitments"] as const,
  list: (filter: VsattpCommitmentFilter) =>
    [...vsattpCommitmentKeys.all, "list", filter] as const,
};

export function useVsattpCommitments(filter: VsattpCommitmentFilter) {
  return useQuery({
    queryKey: vsattpCommitmentKeys.list(filter),
    queryFn: () => vsattpCommitmentApi.list(filter),
  });
}
