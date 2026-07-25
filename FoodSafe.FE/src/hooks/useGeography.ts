import { useQuery } from '@tanstack/react-query'
import { getGeographicItems } from '@/lib/geographyApi'

const keys = {
  all: ['geography'] as const,
  provinces: () => [...keys.all, 'provinces'] as const,
  districts: (provinceId: string) => [...keys.all, 'districts', provinceId] as const,
  communes: (districtId: string) => [...keys.all, 'communes', districtId] as const,
}

export function useProvinces() {
  return useQuery({
    queryKey: keys.provinces(),
    queryFn: () => getGeographicItems('provinces'),
  })
}

export function useDistricts(provinceId: string) {
  return useQuery({
    queryKey: keys.districts(provinceId),
    queryFn: () => getGeographicItems('districts', { provinceId }),
    enabled: provinceId.length > 0,
  })
}

export function useCommunes(districtId: string) {
  return useQuery({
    queryKey: keys.communes(districtId),
    queryFn: () => getGeographicItems('communes', { districtId }),
    enabled: districtId.length > 0,
  })
}
