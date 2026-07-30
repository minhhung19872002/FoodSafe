import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { advertisementRegistrationApi as service } from "./advertisementRegistrationApi";
import type { AdvertisementRegistrationFilter } from "../types/advertisementRegistration.types";

export const advertisementRegistrationKeys = {
  all: ["advertisement-registrations"] as const,
  list: (filter: AdvertisementRegistrationFilter) =>
    [...advertisementRegistrationKeys.all, "list", filter] as const,
  businesses: () =>
    [...advertisementRegistrationKeys.all, "businesses"] as const,
  products: (id?: string) =>
    [...advertisementRegistrationKeys.all, "products", id] as const,
  types: () => [...advertisementRegistrationKeys.all, "types"] as const,
  attachments: (id?: string) =>
    [...advertisementRegistrationKeys.all, "attachments", id] as const,
};

export const useAdvertisementRegistrations = (
  filter: AdvertisementRegistrationFilter,
) =>
  useQuery({
    queryKey: advertisementRegistrationKeys.list(filter),
    queryFn: () => service.list(filter),
    placeholderData: keepPreviousData,
  });
export const useAdvertisementBusinesses = () =>
  useQuery({
    queryKey: advertisementRegistrationKeys.businesses(),
    queryFn: service.businessOptions,
  });
export const useAdvertisementProducts = (id?: string) =>
  useQuery({
    queryKey: advertisementRegistrationKeys.products(id),
    queryFn: () => service.productOptions(id!),
    enabled: Boolean(id),
    staleTime: 0,
  });
export const useAdvertisementTypes = () =>
  useQuery({
    queryKey: advertisementRegistrationKeys.types(),
    queryFn: service.advertisementTypes,
  });
export const useAdvertisementAttachments = (id?: string) =>
  useQuery({
    queryKey: advertisementRegistrationKeys.attachments(id),
    queryFn: () => service.attachments(id!),
    enabled: Boolean(id),
  });
