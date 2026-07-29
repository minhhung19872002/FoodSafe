import { useQuery } from "@tanstack/react-query";
import {
  getCommunesByProvince,
  getGeographicItems,
} from "@/lib/geographyApi";

const keys = {
  all: ["geography"] as const,
  provinces: (activeOnly: boolean) =>
    [...keys.all, "provinces", activeOnly] as const,
  communesByProvince: (provinceId: string, activeOnly: boolean) =>
    [...keys.all, "communes-by-province", provinceId, activeOnly] as const,
};

export function useProvinces(activeOnly = true) {
  return useQuery({
    queryKey: keys.provinces(activeOnly),
    queryFn: () => getGeographicItems("provinces", { activeOnly }),
  });
}

export function useCommunesByProvince(provinceId: string, activeOnly = true) {
  return useQuery({
    queryKey: keys.communesByProvince(provinceId, activeOnly),
    queryFn: () => getCommunesByProvince(provinceId, activeOnly),
    enabled: provinceId.length > 0,
  });
}
