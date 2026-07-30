import { useMemo, useState } from "react";
import { useTablePagination } from "@/hooks/useTablePagination";
import { App, Tag } from "antd";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { useAuthStore } from "@/features/auth/store/authStore";
import { organizationApi } from "../api/organizationApi";
import {
  useCreateOrganization,
  useDeleteOrganization,
  useUpdateOrganization,
} from "../api/organizationMutations";
import {
  useOrganizationList,
  useOrganizationTree,
} from "../api/organizationQueries";
import { OrganizationCreateModal } from "../components/OrganizationCreateModal";
import { OrganizationListView } from "../components/OrganizationListView";
import { getOrganizationLevelConfig } from "../components/organizationConfig";
import type {
  OrganizationDto,
  OrganizationLevel,
  OrganizationTreeNode,
} from "../types/organization.types";

type OrganizationOption = Pick<
  OrganizationDto,
  "id" | "code" | "name" | "level"
>;

function flattenTree(items: OrganizationTreeNode[]): OrganizationOption[] {
  return items.flatMap((item) => [
    {
      id: item.id,
      code: item.code,
      name: item.name,
      level: item.level,
    },
    ...flattenTree(item.children),
  ]);
}

function descendantIds(
  items: OrganizationTreeNode[],
  organizationId: string,
): Set<string> {
  for (const item of items) {
    if (item.id === organizationId) {
      return new Set(flattenTree(item.children).map((child) => child.id));
    }

    const nested = descendantIds(item.children, organizationId);
    if (nested.size > 0) {
      return nested;
    }
  }

  return new Set();
}

export default function OrganizationListPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState<OrganizationLevel>();
  const [isActive, setIsActive] = useState<boolean>();
  const [parentId, setParentId] = useState<string>();
  const pagination = useTablePagination(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationDto>();
  const [detailOrganization, setDetailOrganization] =
    useState<OrganizationDto | null>(null);

  const queryFilter = useMemo(
    () => ({
      filter: filter || undefined,
      level,
      isActive,
      parentId,
      skipCount: pagination.skipCount,
      maxResultCount: pagination.maxResultCount,
    }),
    [
      filter,
      level,
      isActive,
      parentId,
      pagination.skipCount,
      pagination.maxResultCount,
    ],
  );

  const listQuery = useOrganizationList(queryFilter);
  const treeQuery = useOrganizationTree();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const exportMutation = useMutation({
    mutationFn: () =>
      organizationApi.exportExcel({
        filter: filter || undefined,
        level,
        isActive,
        parentId,
      }),
  });
  const allOrganizationOptions = useMemo(
    () => flattenTree(treeQuery.data?.items ?? []),
    [treeQuery.data?.items],
  );
  const organizationOptions = useMemo(() => {
    if (!editing) return allOrganizationOptions;
    const excluded = descendantIds(treeQuery.data?.items ?? [], editing.id);
    return allOrganizationOptions.filter((item) => !excluded.has(item.id));
  }, [editing, allOrganizationOptions, treeQuery.data?.items]);

  const refresh = () => {
    setFilter("");
    setLevel(undefined);
    setIsActive(undefined);
    setParentId(undefined);
    pagination.resetToFirstPage();
    void listQuery.refetch();
    void treeQuery.refetch();
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Quản lý đơn vị"
        subtitle="Cơ cấu tổ chức và phân cấp đơn vị hành chính"
      />

      <div className="page-card">
        <OrganizationListView
          items={listQuery.data?.items ?? []}
          treeItems={treeQuery.data?.items ?? []}
          loading={listQuery.isLoading || treeQuery.isLoading}
          pagination={pagination.buildConfig(listQuery.data?.totalCount)}
          filter={filter}
          level={level}
          isActive={isActive}
          parentId={parentId}
          parentOptions={allOrganizationOptions}
          canCreate={hasPermission("FoodSafe.Organizations.Create")}
          canEdit={hasPermission("FoodSafe.Organizations.Edit")}
          canDelete={hasPermission("FoodSafe.Organizations.Delete")}
          deletingId={
            deleteMutation.isPending ? deleteMutation.variables : undefined
          }
          exporting={exportMutation.isPending}
          onExport={() =>
            exportMutation.mutate(undefined, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => {
                void message.error("Không thể xuất danh sách đơn vị.");
              },
            })
          }
          onFilterChange={(value) => {
            setFilter(value);
            pagination.resetToFirstPage();
          }}
          onLevelChange={(value) => {
            setLevel(value);
            pagination.resetToFirstPage();
          }}
          onIsActiveChange={(value) => {
            setIsActive(value);
            pagination.resetToFirstPage();
          }}
          onParentIdChange={(value) => {
            setParentId(value);
            pagination.resetToFirstPage();
          }}
          onRefresh={refresh}
          onCreate={() => setCreateOpen(true)}
          onEdit={setEditing}
          onShowDetail={setDetailOrganization}
          onDelete={(organization) => {
            deleteMutation.mutate(organization.id, {
              onSuccess: () => {
                void message.success("Đã xóa đơn vị");
              },
              onError: () => {
                void message.error(
                  "Không thể xóa đơn vị. Đơn vị có thể đang được sử dụng.",
                );
              },
            });
          }}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết đơn vị"
        record={detailOrganization}
        onClose={() => setDetailOrganization(null)}
        fields={[
          { label: "Mã", render: (r) => r.code },
          { label: "Tên đơn vị", render: (r) => r.name },
          {
            label: "Cấp",
            render: (r) => {
              const config = getOrganizationLevelConfig(r.level);
              return <Tag color={config.color}>{config.label}</Tag>;
            },
          },
          {
            label: "Đơn vị cha",
            render: (r) =>
              organizationOptions.find((item) => item.id === r.parentId)?.name,
          },
          { label: "Địa chỉ", render: (r) => r.address, span: 2 },
          { label: "Điện thoại", render: (r) => r.phone },
          { label: "Email", render: (r) => r.email },
          { label: "Người đứng đầu", render: (r) => r.leaderName },
          {
            label: "Trạng thái",
            render: (r) => (
              <Tag color={r.isActive ? "success" : "default"}>
                {r.isActive ? "Hoạt động" : "Ngừng hoạt động"}
              </Tag>
            ),
          },
        ]}
      />

      <OrganizationCreateModal
        open={createOpen || Boolean(editing)}
        organization={editing}
        organizations={organizationOptions}
        submitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={
          (editing ? updateMutation.error : createMutation.error) instanceof
          Error
            ? (editing ? updateMutation.error : createMutation.error)?.message
            : undefined
        }
        onCancel={() => {
          setCreateOpen(false);
          setEditing(undefined);
          createMutation.reset();
          updateMutation.reset();
        }}
        onSubmit={(input) => {
          if (editing) {
            updateMutation.mutate(
              { id: editing.id, input },
              {
                onSuccess: () => {
                  setEditing(undefined);
                  void message.success("Đã cập nhật đơn vị");
                },
              },
            );
            return;
          }

          const { isActive: _, ...createInput } = input;
          createMutation.mutate(createInput, {
            onSuccess: () => {
              setCreateOpen(false);
              void message.success("Đã thêm đơn vị");
            },
          });
        }}
      />
    </div>
  );
}
