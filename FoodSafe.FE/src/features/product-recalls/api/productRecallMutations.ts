import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productRecallApi } from "./productRecallApi";
import { productRecallKeys } from "./productRecallQueries";
import type {
  CompleteRecallInput,
  ProductRecallInput,
} from "../types/productRecall.types";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: productRecallKeys.all });
  };
}

export function useCreateProductRecall() {
  return useMutation({
    mutationFn: productRecallApi.create,
    onSuccess: useInvalidate(),
  });
}

export function useUpdateProductRecall() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductRecallInput }) =>
      productRecallApi.update(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useDeleteProductRecall() {
  return useMutation({
    mutationFn: productRecallApi.delete,
    onSuccess: useInvalidate(),
  });
}

export function useStartProductRecall() {
  return useMutation({
    mutationFn: productRecallApi.start,
    onSuccess: useInvalidate(),
  });
}

export function useCompleteProductRecall() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompleteRecallInput }) =>
      productRecallApi.complete(id, input),
    onSuccess: useInvalidate(),
  });
}

export function useCancelProductRecall() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      productRecallApi.cancel(id, reason),
    onSuccess: useInvalidate(),
  });
}
