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
import { useCommunes, useDistricts, useProvinces } from "@/hooks/useGeography";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  createGeographicItem,
  deleteGeographicItem,
  updateGeographicItem,
  type CommuneItem,
  type DistrictItem,
  type GeographicItem,
  type GeographicUpsert,
} from "@/lib/geographyApi";
import { PageHeader } from "@/components/PageHeader";
import {
  GeographicCatalogModal,
  type GeographicKind,
} from "../components/GeographicCatalogModal";

type CatalogItem = GeographicItem | DistrictItem | CommuneItem;

interface ModalState {
  kind: GeographicKind;
  item?: CatalogItem;
}

const districtTypes: Record<number, string> = {
  1: "Huyện",
  2: "Quận",
  3: "Thị xã",
  4: "Thành phố",
};

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
  const districts = useDistricts(provinceId, false);
  const [districtId, setDistrictId] = useState("");
  const communes = useCommunes(districtId, false);
  const [modal, setModal] = useState<ModalState>();

  useEffect(() => {
    const items = provinces.data?.items ?? [];
    if (!items.some((item) => item.id === provinceId)) {
      setProvinceId(items[0]?.id ?? "");
    }
  }, [provinceId, provinces.data?.items]);

  useEffect(() => {
    const items = districts.data?.items ?? [];
    if (!items.some((item) => item.id === districtId)) {
      setDistrictId(items[0]?.id ?? "");
    }
  }, [districtId, districts.data?.items]);

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
    onError: () => {
      void message.error("Không thể lưu. Vui lòng kiểm tra mã và địa bàn cha.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: GeographicKind; id: string }) =>
      deleteGeographicItem(kind, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["geography"] });
      void message.success("Đã xóa địa bàn hành chính");
    },
    onError: () => {
      void message.error("Không thể xóa địa bàn đang được sử dụng.");
    },
  });

  const parentId =
    modal?.kind === "district"
      ? provinceId
      : modal?.kind === "commune"
        ? districtId
        : undefined;

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
      locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
      columns={[
        { title: "Mã", dataIndex: "code", width: 130 },
        { title: "Tên địa bàn", dataIndex: "name" },
        ...(kind === "province"
          ? []
          : [
              {
                title: "Loại",
                dataIndex: "type",
                width: 140,
                render: (type: number) =>
                  (kind === "district" ? districtTypes : communeTypes)[type] ??
                  type,
              },
            ]),
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
      <PageHeader title="Địa bàn hành chính" subtitle="Quản lý danh mục tỉnh/thành, quận/huyện, xã/phường" />
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
            key: "districts",
            label: "Huyện/Quận",
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
                    onChange={(value) => {
                      setProvinceId(value);
                      setDistrictId("");
                    }}
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
                      onClick={() => setModal({ kind: "district" })}
                    >
                      Thêm huyện/quận
                    </Button>
                  )}
                </Space>
                {table(
                  "district",
                  districts.data?.items ?? [],
                  districts.isLoading,
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
                    onChange={(value) => {
                      setProvinceId(value);
                      setDistrictId("");
                    }}
                    style={{ width: 280 }}
                    options={(provinces.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: `${item.code} — ${item.name}`,
                    }))}
                  />
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn huyện/quận"
                    value={districtId || undefined}
                    disabled={!provinceId}
                    onChange={setDistrictId}
                    style={{ width: 280 }}
                    options={(districts.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: `${item.code} — ${item.name}`,
                    }))}
                  />
                  {canManage && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={!districtId}
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

      {modal && (
        <GeographicCatalogModal
          open
          kind={modal.kind}
          item={modal.item}
          parentId={parentId}
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
