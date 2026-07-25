import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrganizationListView } from './OrganizationListView'

describe('OrganizationListView', () => {
  it('renders organization data and forwards search changes', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    render(
      <OrganizationListView
        items={[
          {
            id: '1',
            parentId: null,
            code: 'QN',
            name: 'Chi cục ATVSTP Quảng Ninh',
            level: 1,
            address: null,
            phone: null,
            email: null,
            leaderName: null,
            provinceId: null,
            districtId: null,
            communeId: null,
            isActive: true,
          },
        ]}
        treeItems={[]}
        totalCount={1}
        loading={false}
        page={1}
        pageSize={20}
        filter=""
        canCreate
        onFilterChange={onFilterChange}
        onLevelChange={vi.fn()}
        onPageChange={vi.fn()}
        onRefresh={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    expect(screen.getByText('Chi cục ATVSTP Quảng Ninh')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Tìm theo mã hoặc tên đơn vị'), 'QN')
    expect(onFilterChange).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Thêm đơn vị/i })).toBeInTheDocument()
  })
})
