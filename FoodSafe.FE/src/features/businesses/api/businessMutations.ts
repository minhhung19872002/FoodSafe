import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi, productApi } from "./businessApi";
import { businessKeys } from "./businessQueries";
import type {
  BusinessInput,
  BusinessHandlerInput,
  ProductInput,
  UpdateBusinessInput,
  UpdateProductInput,
} from "../types/business.types";

function useInvalidateBusinessManagement() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: businessKeys.all });
}

export function useCreateBusiness() {
  return useMutation({
    mutationFn: businessApi.create,
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useUpdateBusiness() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBusinessInput }) =>
      businessApi.update(id, input),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useDeleteBusiness() {
  return useMutation({
    mutationFn: businessApi.delete,
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useAddBusinessHandler() {
  return useMutation({
    mutationFn: ({
      businessId,
      input,
    }: {
      businessId: string;
      input: BusinessHandlerInput;
    }) => businessApi.addHandler(businessId, input),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useUpdateBusinessHandler() {
  return useMutation({
    mutationFn: ({
      businessId,
      handlerId,
      input,
    }: {
      businessId: string;
      handlerId: string;
      input: BusinessHandlerInput;
    }) => businessApi.updateHandler(businessId, handlerId, input),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useDeleteBusinessHandler() {
  return useMutation({
    mutationFn: ({
      businessId,
      handlerId,
    }: {
      businessId: string;
      handlerId: string;
    }) => businessApi.deleteHandler(businessId, handlerId),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: (input: ProductInput) => productApi.create(input),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productApi.update(id, input),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export type { BusinessInput };
