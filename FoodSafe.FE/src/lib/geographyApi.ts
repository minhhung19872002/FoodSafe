import { api } from './axios'

export interface GeographicItem {
  id: string
  code: string
  name: string
}

interface ListResult<T> {
  items: T[]
}

const endpoint = '/app/geographic-catalog'

export async function getGeographicItems(path: string, params?: Record<string, string>) {
  const response = await api.get<ListResult<GeographicItem>>(`${endpoint}/${path}`, { params })
  return response.data
}
