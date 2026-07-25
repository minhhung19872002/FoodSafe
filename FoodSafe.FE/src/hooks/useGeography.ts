import { useQuery } from "@tanstack/react-query";
import {
  getGeographicItems,
  type CommuneItem,
  type DistrictItem,
} from "@/lib/geographyApi";

const keys = {
  all: ["geography"] as const,
  provinces: (activeOnly: boolean) =>
    [...keys.all, "provinces", activeOnly] as const,
  districts: (provinceId: string, activeOnly: boolean) =>
    [...keys.all, "districts", provinceId, activeOnly] as const,
  communes: (districtId: string, activeOnly: boolean) =>
    [...keys.all, "communes", districtId, activeOnly] as const,
};

export function useProvinces(activeOnly = true) {
  return useQuery({
    queryKey: keys.provinces(activeOnly),
    queryFn: () => getGeographicItems("provinces", { activeOnly }),
  });
}

export function useDistricts(provinceId: string, activeOnly = true) {
  return useQuery({
    queryKey: keys.districts(provinceId, activeOnly),
    queryFn: () =>
      getGeographicItems<DistrictItem>("districts", { provinceId, activeOnly }),
    enabled: provinceId.length > 0,
  });
}

export function useCommunes(districtId: string, activeOnly = true) {
  return useQuery({
    queryKey: keys.communes(districtId, activeOnly),
    queryFn: () =>
      getGeographicItems<CommuneItem>("communes", { districtId, activeOnly }),
    enabled: districtId.length > 0,
  });
}
