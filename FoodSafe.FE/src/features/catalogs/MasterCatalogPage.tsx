import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/features/auth/store/authStore";
import { CatalogEditorModal } from "./CatalogEditorModal";
import {
  deleteCatalog,
  getCatalog,
  saveCatalog,
  type CatalogInput,
  type CatalogItem,
  type CatalogKind,
} from "./catalogApi";

const catalogs: { kind: CatalogKind; label: string }[] = [
  { kind: "country", label: "Quốc gia" },
  { kind: "region", label: "Vùng" },
  { kind: "business-classification", label: "Phân loại cơ sở" },
  { kind: "product-group", label: "Nhóm sản phẩm" },
  { kind: "business-type", label: "Loại hình cơ sở" },
  { kind: "advertisement-type", label: "Loại quảng cáo" },
  { kind: "testing-center", label: "Trung tâm kiểm nghiệm" },
  { kind: "testing-service", label: "Dịch vụ kiểm nghiệm" },
  { kind: "document-type", label: "Loại văn bản" },
];

export default function MasterCatalogPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<CatalogKind>("country");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null | undefined>();
  const canCreate = useAuthStore((s) =>
    s.hasPermission("FoodSafe.Catalogs.Create"),
  );
  const canEdit = useAuthStore((s) =>
    s.hasPermission("FoodSafe.Catalogs.Edit"),
  );
  const canDelete = useAuthStore((s) =>
    s.hasPermission("FoodSafe.Catalogs.Delete"),
  );

  const query = useQuery({
    queryKey: ["master-catalog", kind, filter],
    queryFn: () => getCatalog(kind, { filter, maxResultCount: 100 }),
  });
  const productGroups = useQuery({
    queryKey: ["master-catalog", "product-group", "options"],
    queryFn: () =>
      getCatalog("product-group", { isActive: true, maxResultCount: 100 }),
  });
  const testingCenters = useQuery({
    queryKey: ["master-catalog", "testing-center", "options"],
    queryFn: () =>
      getCatalog("testing-center", { isActive: true, maxResultCount: 100 }),
  });

  const save = useMutation({
    mutationFn: (input: CatalogInput) => saveCatalog(kind, input, editing?.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master-catalog"] });
      setEditing(undefined);
      void message.success("Đã lưu dữ liệu danh mục");
    },
    onError: () =>
      void message.error(
        "Không thể lưu. Vui lòng kiểm tra mã và dữ liệu liên quan.",
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCatalog(kind, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master-catalog"] });
      void message.success("Đã xóa dữ liệu danh mục");
    },
    onError: () =>
      void message.error("Không thể xóa dữ liệu đang được sử dụng."),
  });

  const columns = useMemo(
    () => [
      { title: "Mã", dataIndex: "code", width: 140 },
      { title: "Tên", dataIndex: "name" },
      ...(kind === "business-classification"
        ? [
            {
              title: "Rủi ro",
              dataIndex: "riskLevel",
              width: 120,
              render: (v: number) => ["", "Cao", "Trung bình", "Thấp"][v],
            },
          ]
        : []),
      ...(kind === "product-group"
        ? [{ title: "Cấp", dataIndex: "level", width: 80 }]
        : []),
      ...(kind === "testing-service"
        ? [
            {
              title: "Đơn giá",
              dataIndex: "price",
              width: 140,
              render: (v: number) => v?.toLocaleString("vi-VN"),
            },
          ]
        : []),
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        width: 130,
        render: (active: boolean) => (
          <Tag color={active ? "success" : "default"}>
            {active ? "Hoạt động" : "Ngừng"}
          </Tag>
        ),
      },
      ...(canEdit || canDelete
        ? [
            {
              title: "Thao tác",
              key: "actions",
              width: 120,
              render: (_: unknown, item: CatalogItem) => (
                <Space>
                  {canEdit && (
                    <Button
                      type="text"
                      aria-label={`Sửa ${item.name}`}
                      icon={<EditOutlined />}
                      onClick={() => setEditing(item)}
                    />
                  )}
                  {canDelete && (
                    <Popconfirm
                      title="Xóa dữ liệu này?"
                      okText="Xóa"
                      cancelText="Hủy"
                      onConfirm={() => remove.mutate(item.id)}
                    >
                      <Button
                        type="text"
                        danger
                        aria-label={`Xóa ${item.name}`}
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]
        : []),
    ],
    [canDelete, canEdit, kind, remove],
  );

  return (
    <>
      <Typography.Title level={2}>Danh mục dùng chung</Typography.Title>
      <Typography.Paragraph type="secondary">
        Quản lý dữ liệu chuẩn dùng xuyên suốt các nghiệp vụ an toàn thực phẩm.
      </Typography.Paragraph>
      <Tabs
        activeKey={kind}
        onChange={(key) => {
          setKind(key as CatalogKind);
          setFilter("");
        }}
        items={catalogs.map((x) => ({ key: x.kind, label: x.label }))}
      />
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Tìm theo mã hoặc tên"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{ width: 320 }}
        />
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditing(null)}
          >
            Thêm mới
          </Button>
        )}
      </Space>
      <Table<CatalogItem>
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={columns}
        pagination={{ total: query.data?.totalCount ?? 0, pageSize: 100 }}
      />
      <CatalogEditorModal
        kind={kind}
        item={editing ?? undefined}
        productGroups={productGroups.data?.items ?? []}
        testingCenters={testingCenters.data?.items ?? []}
        open={editing !== undefined}
        saving={save.isPending}
        onCancel={() => setEditing(undefined)}
        onSave={(input) => save.mutate(input)}
      />
    </>
  );
}
