import { useQuery } from "@tanstack/react-query";
import { eligibilityCertificateApi } from "./eligibilityCertificateApi";
import type { EligibilityCertificateFilter } from "../types/eligibilityCertificate.types";

export const eligibilityCertificateKeys = {
  all: ["eligibility-certificates"] as const,
  list: (filter: EligibilityCertificateFilter) =>
    [...eligibilityCertificateKeys.all, "list", filter] as const,
  businesses: () => [...eligibilityCertificateKeys.all, "businesses"] as const,
  attachments: (id?: string) =>
    [...eligibilityCertificateKeys.all, "attachments", id] as const,
};

export function useEligibilityCertificates(
  filter: EligibilityCertificateFilter,
) {
  return useQuery({
    queryKey: eligibilityCertificateKeys.list(filter),
    queryFn: () => eligibilityCertificateApi.list(filter),
  });
}

export function useEligibilityBusinesses() {
  return useQuery({
    queryKey: eligibilityCertificateKeys.businesses(),
    queryFn: eligibilityCertificateApi.businessOptions,
  });
}

export function useEligibilityAttachments(id?: string) {
  return useQuery({
    queryKey: eligibilityCertificateKeys.attachments(id),
    queryFn: () => eligibilityCertificateApi.attachments(id!),
    enabled: Boolean(id),
  });
}
