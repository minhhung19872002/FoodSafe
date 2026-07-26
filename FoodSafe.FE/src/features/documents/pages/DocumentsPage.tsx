import { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useDocuments } from "../api/documentQueries";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "../api/documentMutations";
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_CONFIG,
  type AdministrativeDocument,
  type DocumentFilter,
  type DocumentStatus,
} from "../types/document.types";

const PAGE_SIZE = 15;

export default function DocumentsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<DocumentFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useDocuments(filter);
  const createMut = useCreateDocument();
  const updateMut = useUpdateDocument();
  const deleteMut = useDeleteDocument();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdministrativeDocument | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: DOCUMENT_STATUS.Active,
      isPublic: false,
    });
    setEditorOpen(true);
  };

  const openEdit = (record: AdministrativeDocument) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      issuedDate: dayjs(record.issuedDate),
      effectiveDate: record.effectiveDate
        ? dayjs(record.effectiveDate)
        : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    });
    setEditorOpen(true);
  };

  const columns: TableColumnsType<AdministrativeDocument> = [
    {
      title: "Số văn bản",
      dataIndex: "documentNumber",
      width: 140,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Loại VB",
      dataIndex: "documentTypeName",
      width: 130,
      ellipsis: true,
    },
    {
      title: "Cơ quan ban hành",
      dataIndex: "issuingAuthority",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Ngày ban hành",
      dataIndex: "issuedDate",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      render: (s: DocumentStatus) => {
        const cfg = DOCUMENT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("FoodSafe.AlertsAndTesting.Documents.Edit") && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          )}
          {hasPermission("FoodSafe.AlertsAndTesting.Documents.Delete") && (
            <Popconfirm
              title="Xóa văn bản?"
              onConfirm={() =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                })
              }
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Số VB, tiêu đề"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) =>
            setFilter((f) => ({
              ...f,
              filter: v || undefined,
              skipCount: 0,
            }))
          }
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(DOCUMENT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        {hasPermission("FoodSafe.AlertsAndTesting.Documents.Create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm văn bản
          </Button>
        )}
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={{
          total: data?.totalCount,
          pageSize: PAGE_SIZE,
          current: (filter.skipCount ?? 0) / PAGE_SIZE + 1,
          onChange: (page) =>
            setFilter((f) => ({ ...f, skipCount: (page - 1) * PAGE_SIZE })),
          showTotal: (total) => `Tổng: ${total}`,
          showSizeChanger: false,
        }}
      />
      <Modal
        title={editing ? "Sửa văn bản" : "Thêm văn bản"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        destroyOnHidden
        width={640}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            const payload = {
              ...values,
              issuedDate: values.issuedDate?.toISOString(),
              effectiveDate: values.effectiveDate?.toISOString(),
              expiryDate: values.expiryDate?.toISOString(),
            };
            if (editing) {
              updateMut.mutate(
                { id: editing.id, input: payload },
                {
                  onSuccess: () => {
                    message.success("Đã cập nhật");
                    setEditorOpen(false);
                  },
                },
              );
            } else {
              createMut.mutate(payload, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
              });
            }
          }}
        >
          <Form.Item
            name="documentTypeId"
            label="Loại văn bản"
            rules={[{ required: true }]}
          >
            <Input placeholder="ID loại VB" />
          </Form.Item>
          <Form.Item
            name="documentNumber"
            label="Số văn bản"
            rules={[{ required: true }]}
          >
            <Input placeholder="VD: 123/QĐ-BYT" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="issuingAuthority" label="Cơ quan ban hành">
            <Input />
          </Form.Item>
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="issuedDate"
              label="Ngày ban hành"
              rules={[{ required: true }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="effectiveDate" label="Ngày hiệu lực">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="expiryDate" label="Ngày hết hiệu lực">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>
          <Form.Item name="summary" label="Tóm tắt nội dung">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space>
            <Form.Item name="status" label="Trạng thái">
              <Select
                style={{ width: 160 }}
                options={Object.entries(DOCUMENT_STATUS_CONFIG).map(
                  ([k, v]) => ({ value: Number(k), label: v.label }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="isPublic"
              label="Công khai"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
