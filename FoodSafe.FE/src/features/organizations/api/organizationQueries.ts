import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { organizationApi } from "./organizationApi";
import type { OrganizationFilter } from "../types/organization.types";

export const organizationKeys = {
  all: ["organizations"] as const,
  list: (filter: OrganizationFilter) =>
    [...organizationKeys.all, "list", filter] as const,
  tree: () => [...organizationKeys.all, "tree"] as const,
};

export function useOrganizationList(filter: OrganizationFilter) {
  return useQuery({
    queryKey: organizationKeys.list(filter),
    queryFn: () => organizationApi.getList(filter),
    placeholderData: keepPreviousData,
  });
}

export function useOrganizationTree() {
  return useQuery({
    queryKey: organizationKeys.tree(),
    queryFn: organizationApi.getTree,
  });
}
