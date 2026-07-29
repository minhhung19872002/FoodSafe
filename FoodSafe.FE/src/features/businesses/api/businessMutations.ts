import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  businessApi,
  geocodingApi,
  productApi,
  productAttachmentApi,
} from "./businessApi";
import { businessKeys } from "./businessQueries";
import type {
  BusinessInput,
  BusinessFilter,
  BusinessHandlerInput,
  ProductInput,
  ProductFilter,
  UpdateBusinessInput,
  UpdateProductInput,
} from "../types/business.types";

function useInvalidateBusinessManagement() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: businessKeys.all });
}

/**
 * Resolves the address typed into the business form into map coordinates.
 * Deliberately a mutation rather than a query: it runs when the user asks for
 * it, not on every keystroke, which is what keeps the upstream provider inside
 * its rate limit.
 */
export function useGeocodeAddress() {
  return useMutation({ mutationFn: geocodingApi.resolve });
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

export function useDownloadBusinessTemplate() {
  return useMutation({ mutationFn: businessApi.downloadTemplate });
}

export function usePreviewBusinessImport() {
  return useMutation({ mutationFn: businessApi.previewImport });
}

export function useConfirmBusinessImport() {
  return useMutation({
    mutationFn: businessApi.confirmImport,
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useExportBusinesses() {
  return useMutation({
    mutationFn: (filter: BusinessFilter) => businessApi.exportExcel(filter),
  });
}

export function useDownloadBusinessProfilePdf() {
  return useMutation({
    mutationFn: (id: string) => businessApi.downloadProfilePdf(id),
  });
}

export function useDownloadProductTemplate() {
  return useMutation({ mutationFn: productApi.downloadTemplate });
}

export function usePreviewProductImport() {
  return useMutation({ mutationFn: productApi.previewImport });
}

export function useConfirmProductImport() {
  return useMutation({
    mutationFn: productApi.confirmImport,
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useExportProducts() {
  return useMutation({
    mutationFn: (filter: ProductFilter) => productApi.exportExcel(filter),
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

export function useUploadProductAttachment() {
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      productAttachmentApi.upload(productId, file),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export function useDownloadProductAttachment() {
  return useMutation({
    mutationFn: ({
      productId,
      attachmentId,
    }: {
      productId: string;
      attachmentId: string;
    }) => productAttachmentApi.download(productId, attachmentId),
  });
}

export function useDeleteProductAttachment() {
  return useMutation({
    mutationFn: ({
      productId,
      attachmentId,
    }: {
      productId: string;
      attachmentId: string;
    }) => productAttachmentApi.delete(productId, attachmentId),
    onSuccess: useInvalidateBusinessManagement(),
  });
}

export type { BusinessInput };
