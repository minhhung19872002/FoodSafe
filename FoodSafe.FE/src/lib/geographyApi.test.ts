import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './axios'
import {
  deleteGeographicItem,
  updateGeographicItem,
} from './geographyApi'

vi.mock('./axios', () => ({
  api: {
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('geographyApi mutation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the ABP id-before-action update route', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'p1' } })

    await updateGeographicItem('province', 'p1', {
      code: 'QN',
      name: 'Quảng Ninh',
      sortOrder: 0,
      isActive: true,
    })

    expect(api.put).toHaveBeenCalledWith(
      '/app/geographic-catalog/p1/province',
      expect.objectContaining({ code: 'QN' }),
    )
  })

  it('uses the ABP id-before-action delete route', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })

    await deleteGeographicItem('commune', 'c1')

    expect(api.delete).toHaveBeenCalledWith(
      '/app/geographic-catalog/c1/commune',
    )
  })
})
