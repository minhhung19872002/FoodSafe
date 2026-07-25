import { useMemo, useState } from 'react'
import { App, Typography } from 'antd'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCreateOrganization } from '../api/organizationMutations'
import { useOrganizationList, useOrganizationTree } from '../api/organizationQueries'
import { OrganizationCreateModal } from '../components/OrganizationCreateModal'
import { OrganizationListView } from '../components/OrganizationListView'
import type { OrganizationLevel } from '../types/organization.types'

const pageSizeDefault = 20

export default function OrganizationListPage() {
  const { message } = App.useApp()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [filter, setFilter] = useState('')
  const [level, setLevel] = useState<OrganizationLevel>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeDefault)
  const [createOpen, setCreateOpen] = useState(false)

  const queryFilter = useMemo(() => ({
    filter: filter || undefined,
    level,
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
  }), [filter, level, page, pageSize])

  const listQuery = useOrganizationList(queryFilter)
  const treeQuery = useOrganizationTree()
  const createMutation = useCreateOrganization()

  const refresh = () => {
    void listQuery.refetch()
    void treeQuery.refetch()
  }

  return (
    <>
      <Typography.Title level={2}>Quản lý đơn vị</Typography.Title>
      <Typography.Paragraph type="secondary">
        Cây đơn vị hành chính Tỉnh → Huyện/Thành phố → Xã/Phường.
      </Typography.Paragraph>

      <OrganizationListView
        items={listQuery.data?.items ?? []}
        treeItems={treeQuery.data?.items ?? []}
        totalCount={listQuery.data?.totalCount ?? 0}
        loading={listQuery.isLoading || treeQuery.isLoading}
        page={page}
        pageSize={pageSize}
        filter={filter}
        level={level}
        canCreate={hasPermission('FoodSafe.Organizations.Create')}
        onFilterChange={(value) => {
          setFilter(value)
          setPage(1)
        }}
        onLevelChange={(value) => {
          setLevel(value)
          setPage(1)
        }}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        }}
        onRefresh={refresh}
        onCreate={() => setCreateOpen(true)}
      />

      <OrganizationCreateModal
        open={createOpen}
        organizations={listQuery.data?.items ?? []}
        submitting={createMutation.isPending}
        errorMessage={createMutation.error instanceof Error ? createMutation.error.message : undefined}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(input) => {
          createMutation.mutate(input, {
            onSuccess: () => {
              setCreateOpen(false)
              void message.success('Đã thêm đơn vị')
            },
          })
        }}
      />
    </>
  )
}
