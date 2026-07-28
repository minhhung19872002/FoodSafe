import { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  PaperClipOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { escapeHtml, printHtml } from "@/utils/printHtml";
import { DocumentAttachmentsModal } from "../components/DocumentAttachmentsModal";
import { useDocuments, useDocumentTypes } from "../api/documentQueries";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useExportDocuments,
} from "../api/documentMutations";
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_CONFIG,
  type AdministrativeDocument,
  type DocumentFilter,
  type DocumentStatus,
} from "../types/document.types";
import { useTablePagination } from "@/hooks/useTablePagination";
import { RowActions } from "@/components/RowActions";

export default function DocumentsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const { data, isLoading } = useDocuments({
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });

  // Server-side sorting: reflect the active sort in the column header and
  // translate AntD SorterResult into the "<field> <asc|desc>" string the
  // backend's ApplySorting whitelist parses.
  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<AdministrativeDocument> | SorterResult<AdministrativeDocument>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };
  const { data: documentTypes, isLoading: docTypesLoading } =
    useDocumentTypes();
  const createMut = useCreateDocument();
  const updateMut = useUpdateDocument();
  const deleteMut = useDeleteDocument();
  const exportMut = useExportDocuments();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdministrativeDocument | null>(null);
  const [attachmentsDoc, setAttachmentsDoc] =
    useState<AdministrativeDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<AdministrativeDocument | null>(
    null,
  );
  const [form] = Form.useForm();

  const printDocument = (record: AdministrativeDocument) =>
    printHtml(
      record.documentNumber,
      `<h3>${escapeHtml(record.issuingAuthority) || "CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH"}</h3>
       <h2>${escapeHtml(record.title)}</h2>
       <p><strong>Số văn bản:</strong> ${escapeHtml(record.documentNumber)}</p>
       <p><strong>Loại văn bản:</strong> ${escapeHtml(record.documentTypeName)}</p>
       <p><strong>Ngày ban hành:</strong> ${dayjs(record.issuedDate).format("DD/MM/YYYY")}</p>
       ${record.effectiveDate ? `<p><strong>Ngày hiệu lực:</strong> ${dayjs(record.effectiveDate).format("DD/MM/YYYY")}</p>` : ""}
       ${record.expiryDate ? `<p><strong>Ngày hết hiệu lực:</strong> ${dayjs(record.expiryDate).format("DD/MM/YYYY")}</p>` : ""}
       <p><strong>Tóm tắt nội dung:</strong></p>
       <p>${escapeHtml(record.summary) || "—"}</p>`,
    );

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
      effectiveDate: record.effectiveDate ? dayjs(record.effectiveDate) : null,
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
      sorter: true,
      sortOrder: sortOrderFor("issuedDate"),
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
      width: 96,
      render: (_, record) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.documentNumber}`}
          actions={[
            {
              key: "print",
              label: "In",
              ariaLabel: `In ${record.documentNumber}`,
              icon: <PrinterOutlined />,
              onClick: () => printDocument(record),
            },
            {
              key: "attachments",
              label: "Tệp",
              ariaLabel: `Tệp ${record.documentNumber}`,
              icon: <PaperClipOutlined />,
              onClick: () => setAttachmentsDoc(record),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: !hasPermission(
                "FoodSafe.AlertsAndTesting.Documents.Edit",
              ),
              onClick: () => openEdit(record),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !hasPermission(
                "FoodSafe.AlertsAndTesting.Documents.Delete",
              ),
              confirm: "Xóa văn bản?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                  onError: () => message.error("Xóa thất bại"),
                }),
            },
          ]}
        />
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
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(DOCUMENT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
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
        onRow={(record) => ({
          onDoubleClick: () => setDetailDoc(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
        onChange={(_, __, sorter) => handleSort(sorter)}
      />
      <Modal
        title={editing ? "Sửa văn bản" : "Thêm văn bản"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        destroyOnHidden
        width={640}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
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
                  onError: () => message.error("Cập nhật thất bại"),
                },
              );
            } else {
              createMut.mutate(payload, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
                onError: () => message.error("Tạo thất bại"),
              });
            }
          }}
        >
          <Form.Item
            name="documentTypeId"
            label="Loại văn bản"
            rules={[{ required: true, message: "Vui lòng chọn loại văn bản" }]}
          >
            <Select
              placeholder="Chọn loại văn bản"
              showSearch
              optionFilterProp="label"
              loading={docTypesLoading}
              options={(documentTypes ?? []).map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="documentNumber"
            label="Số văn bản"
            rules={[{ required: true }]}
          >
            <Input placeholder="VD: 123/QĐ-BYT" />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
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
      <DocumentAttachmentsModal
        documentId={attachmentsDoc?.id}
        title={`Tài liệu đính kèm — ${attachmentsDoc?.documentNumber ?? ""}`}
        canEdit={hasPermission("FoodSafe.AlertsAndTesting.Documents.Edit")}
        onClose={() => setAttachmentsDoc(null)}
      />
      <RecordDetailDrawer
        title="Chi tiết văn bản"
        record={detailDoc}
        onClose={() => setDetailDoc(null)}
        fields={[
          { label: "Số văn bản", render: (r) => r.documentNumber },
          { label: "Loại văn bản", render: (r) => r.documentTypeName },
          { label: "Tiêu đề", span: 2, render: (r) => r.title },
          { label: "Cơ quan ban hành", render: (r) => r.issuingAuthority },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = DOCUMENT_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Ngày ban hành",
            render: (r) => dayjs(r.issuedDate).format("DD/MM/YYYY"),
          },
          {
            label: "Ngày hiệu lực",
            render: (r) =>
              r.effectiveDate
                ? dayjs(r.effectiveDate).format("DD/MM/YYYY")
                : null,
          },
          {
            label: "Ngày hết hiệu lực",
            render: (r) =>
              r.expiryDate ? dayjs(r.expiryDate).format("DD/MM/YYYY") : null,
          },
          {
            label: "Công khai",
            render: (r) => (r.isPublic ? "Có" : "Không"),
          },
          { label: "Tóm tắt nội dung", span: 2, render: (r) => r.summary },
          {
            label: "Ngày tạo",
            render: (r) => dayjs(r.creationTime).format("DD/MM/YYYY"),
          },
        ]}
      />
    </Card>
  );
}
