import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vsattpCommitmentApi } from "./vsattpCommitmentApi";
import { vsattpCommitmentKeys } from "./vsattpCommitmentQueries";
import type {
  CreateVsattpCommitmentInput,
  UpdateVsattpCommitmentInput,
} from "../types/vsattpCommitment.types";

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: vsattpCommitmentKeys.all });
    void qc.invalidateQueries({
      queryKey: ["business-vsattp-commitments"],
      refetchType: "all",
    });
  };
}

export function useCreateVsattpCommitment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateVsattpCommitmentInput) =>
      vsattpCommitmentApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateVsattpCommitment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateVsattpCommitmentInput;
    }) => vsattpCommitmentApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteVsattpCommitment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => vsattpCommitmentApi.delete(id),
    onSuccess: invalidate,
  });
}

export function useConfirmVsattpCommitment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => vsattpCommitmentApi.confirm(id),
    onSuccess: invalidate,
  });
}
