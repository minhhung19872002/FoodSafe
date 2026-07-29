import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Empty,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useCommunesByProvince, useProvinces } from "@/hooks/useGeography";
import { extractApiError } from "@/lib/apiError";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  createGeographicItem,
  deleteGeographicItem,
  updateGeographicItem,
  type CommuneItem,
  type GeographicItem,
  type GeographicUpsert,
} from "@/lib/geographyApi";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import {
  GeographicCatalogModal,
  type GeographicKind,
} from "../components/GeographicCatalogModal";

type CatalogItem = GeographicItem | CommuneItem;

interface ModalState {
  kind: GeographicKind;
  item?: CatalogItem;
}

const communeTypes: Record<number, string> = {
  1: "Xã",
  2: "Phường",
  3: "Thị trấn",
};

export default function GeographicCatalogPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) =>
    state.hasPermission("FoodSafe.GeographicCatalogs.Manage"),
  );
  const provinces = useProvinces(false);
  const [provinceId, setProvinceId] = useState("");
  const communes = useCommunesByProvince(provinceId, false);
  const [modal, setModal] = useState<ModalState>();
  const [detail, setDetail] = useState<{
    kind: GeographicKind;
    item: CatalogItem;
  } | null>(null);

  useEffect(() => {
    const items = provinces.data?.items ?? [];
    if (!items.some((item) => item.id === provinceId)) {
      setProvinceId(items[0]?.id ?? "");
    }
  }, [provinceId, provinces.data?.items]);

  const saveMutation = useMutation({
    mutationFn: (input: GeographicUpsert) => {
      if (!modal) {
        throw new Error("Missing catalog form state.");
      }
      return modal.item
        ? updateGeographicItem(modal.kind, modal.item.id, input)
        : createGeographicItem(modal.kind, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["geography"] });
      setModal(undefined);
      void message.success("Đã lưu địa bàn hành chính");
    },
    onError: (error) => {
      void message.error(extractApiError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: GeographicKind; id: string }) =>
      deleteGeographicItem(kind, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["geography"] });
      void message.success("Đã xóa địa bàn hành chính");
    },
    onError: (error) => {
      void message.error(extractApiError(error));
    },
  });

  const table = (
    kind: GeographicKind,
    items: CatalogItem[],
    loading: boolean,
  ) => (
    <Table<CatalogItem>
      rowKey="id"
      size="middle"
      loading={loading}
      dataSource={items}
      pagination={false}
      onRow={(item) => ({
        onDoubleClick: () => setDetail({ kind, item }),
        style: { cursor: "pointer" },
      })}
      locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
      columns={[
        { title: "Mã", dataIndex: "code", width: 130 },
        { title: "Tên địa bàn", dataIndex: "name" },
        ...(kind === "commune"
          ? [
              {
                title: "Loại",
                dataIndex: "type",
                width: 140,
                render: (type: number) => communeTypes[type] ?? type,
              },
            ]
          : []),
        {
          title: "Trạng thái",
          dataIndex: "isActive",
          width: 140,
          render: (active: boolean) => (
            <Tag color={active ? "success" : "default"}>
              {active ? "Hoạt động" : "Ngừng hoạt động"}
            </Tag>
          ),
        },
        ...(canManage
          ? [
              {
                title: "Thao tác",
                key: "actions",
                width: 130,
                render: (_: unknown, item: CatalogItem) => (
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label={`Sửa ${item.name}`}
                      onClick={() => setModal({ kind, item })}
                    />
                    <Popconfirm
                      title="Xóa địa bàn?"
                      description={`Bạn chắc chắn muốn xóa "${item.name}"?`}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() =>
                        deleteMutation.mutate({ kind, id: item.id })
                      }
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Xóa ${item.name}`}
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables?.id === item.id
                        }
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]
          : []),
      ]}
    />
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Địa bàn hành chính"
        subtitle="Quản lý danh mục tỉnh/thành, xã/phường"
      />
      <div className="page-card">
        <Tabs
          items={[
            {
              key: "provinces",
              label: "Tỉnh/Thành phố",
              children: (
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {canManage && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setModal({ kind: "province" })}
                    >
                      Thêm tỉnh/thành phố
                    </Button>
                  )}
                  {table(
                    "province",
                    provinces.data?.items ?? [],
                    provinces.isLoading,
                  )}
                </Space>
              ),
            },
            {
              key: "communes",
              label: "Xã/Phường",
              children: (
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Space wrap>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn tỉnh/thành phố"
                      value={provinceId || undefined}
                      onChange={setProvinceId}
                      style={{ width: 320 }}
                      options={(provinces.data?.items ?? []).map((item) => ({
                        value: item.id,
                        label: `${item.code} — ${item.name}`,
                      }))}
                    />
                    {canManage && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        disabled={!provinceId}
                        onClick={() => setModal({ kind: "commune" })}
                      >
                        Thêm xã/phường
                      </Button>
                    )}
                  </Space>
                  {table(
                    "commune",
                    communes.data?.items ?? [],
                    communes.isLoading,
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết đơn vị hành chính"
        record={detail?.item ?? null}
        onClose={() => setDetail(null)}
        fields={[
          { label: "Mã", render: (r) => r.code },
          { label: "Tên địa bàn", render: (r) => r.name },
          ...(detail && detail.kind === "commune"
            ? [
                {
                  label: "Loại",
                  render: (r: CatalogItem) =>
                    "type" in r ? (communeTypes[r.type] ?? r.type) : null,
                },
              ]
            : []),
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

      {modal && (
        <GeographicCatalogModal
          open
          kind={modal.kind}
          item={modal.item}
          provinceId={provinceId}
          provinceName={
            provinces.data?.items.find((p) => p.id === provinceId)?.name
          }
          submitting={saveMutation.isPending}
          onCancel={() => {
            saveMutation.reset();
            setModal(undefined);
          }}
          onSubmit={(input) => saveMutation.mutate(input)}
        />
      )}
    </div>
  );
}
