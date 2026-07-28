import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ExportOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { escapeHtml, printHtml } from "@/utils/printHtml";
import {
  ALERT_CATEGORY,
  ALERT_CATEGORY_LABELS,
} from "@/features/alerts-news/types/alertsNews.types";
import { useRiskAnalyses } from "../api/riskAnalysisQueries";
import {
  useCreateRiskAnalysis,
  useUpdateRiskAnalysis,
  useDeleteRiskAnalysis,
  usePublishRiskAnalysis,
  useExportRiskAnalyses,
} from "../api/riskAnalysisMutations";
import {
  RISK_LEVEL,
  RISK_LEVEL_CONFIG,
  RISK_ANALYSIS_STATUS,
  RISK_ANALYSIS_STATUS_CONFIG,
  type RiskAnalysis,
  type RiskAnalysisFilter,
  type RiskAnalysisStatus,
  type RiskLevel,
} from "../types/riskAnalysis.types";
import type { AlertCategory } from "@/features/alerts-news/types/alertsNews.types";
import { useTablePagination } from "@/hooks/useTablePagination";
import { RowActions } from "@/components/RowActions";

export default function RiskAnalysisPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<RiskAnalysisFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useRiskAnalyses({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateRiskAnalysis();
  const updateMut = useUpdateRiskAnalysis();
  const deleteMut = useDeleteRiskAnalysis();
  const publishMut = usePublishRiskAnalysis();
  const exportMut = useExportRiskAnalyses();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RiskAnalysis | null>(null);
  const [detailRecord, setDetailRecord] = useState<RiskAnalysis | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      category: ALERT_CATEGORY.FoodSafety,
      riskLevel: RISK_LEVEL.Medium,
    });
    setEditorOpen(true);
  };

  const openEdit = (record: RiskAnalysis) => {
    setEditing(record);
    form.setFieldsValue(record);
    setEditorOpen(true);
  };

  const columns: TableColumnsType<RiskAnalysis> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      width: 130,
      render: (c: AlertCategory) => ALERT_CATEGORY_LABELS[c],
    },
    {
      title: "Mức độ",
      dataIndex: "riskLevel",
      width: 120,
      render: (rl: RiskLevel) => {
        const cfg = RISK_LEVEL_CONFIG[rl];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: RiskAnalysisStatus) => {
        const cfg = RISK_ANALYSIS_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 110,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "print",
              label: "In",
              ariaLabel: `In ${record.title}`,
              icon: <PrinterOutlined />,
              onClick: () =>
                printHtml(
                  record.title,
                  `<h3>CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH</h3>
                 <h2>PHÂN TÍCH MỐI NGUY CƠ AN TOÀN THỰC PHẨM</h2>
                 <h3>${escapeHtml(record.title)}</h3>
                 <p><strong>Danh mục:</strong> ${escapeHtml(ALERT_CATEGORY_LABELS[record.category])}</p>
                 <p><strong>Mức độ nguy cơ:</strong> ${escapeHtml(RISK_LEVEL_CONFIG[record.riskLevel]?.label)}</p>
                 <p><strong>Sản phẩm liên quan:</strong> ${escapeHtml(record.relatedProducts) || "—"}</p>
                 <p><strong>Nội dung phân tích:</strong></p>
                 <p>${escapeHtml(record.content)}</p>
                 <p><strong>Bằng chứng:</strong> ${escapeHtml(record.evidence) || "—"}</p>
                 <p><strong>Khuyến nghị:</strong> ${escapeHtml(record.recommendations) || "—"}</p>
                 ${record.publishedAt ? `<p><strong>Ngày công bố:</strong> ${dayjs(record.publishedAt).format("DD/MM/YYYY")}</p>` : ""}`,
                ),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft &&
                hasPermission("FoodSafe.AlertsAndTesting.RiskAnalyses.Edit")
              ),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              icon: <SendOutlined />,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft &&
                hasPermission("FoodSafe.AlertsAndTesting.RiskAnalyses.Publish")
              ),
              confirm: "Xuất bản phân tích này?",
              onClick: () =>
                publishMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xuất bản"),
                  onError: () => message.error("Xuất bản thất bại"),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft &&
                hasPermission("FoodSafe.AlertsAndTesting.RiskAnalyses.Delete")
              ),
              confirm: "Xóa phân tích?",
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
          placeholder="Tìm kiếm..."
          allowClear
          style={{ width: 220 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(RISK_ANALYSIS_STATUS_CONFIG).map(
            ([k, v]) => ({ value: Number(k), label: v.label }),
          )}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Mức độ"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(RISK_LEVEL_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, riskLevel: v }));
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
        {hasPermission("FoodSafe.AlertsAndTesting.RiskAnalyses.Create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo phân tích
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
          onDoubleClick: () => setDetailRecord(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />
      <Modal
        title={editing ? "Sửa phân tích nguy cơ" : "Tạo phân tích nguy cơ"}
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
            if (editing) {
              updateMut.mutate(
                { id: editing.id, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã cập nhật");
                    setEditorOpen(false);
                  },
                  onError: () => message.error("Cập nhật thất bại"),
                },
              );
            } else {
              createMut.mutate(values, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
                onError: () => message.error("Tạo thất bại"),
              });
            }
          }}
        >
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="category"
              label="Chuyên mục"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 180 }}
                options={Object.entries(ALERT_CATEGORY_LABELS).map(
                  ([k, v]) => ({ value: Number(k), label: v }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="riskLevel"
              label="Mức độ"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 180 }}
                options={Object.entries(RISK_LEVEL_CONFIG).map(([k, v]) => ({
                  value: Number(k),
                  label: v.label,
                }))}
              />
            </Form.Item>
          </Space>
          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="relatedProducts" label="Sản phẩm liên quan">
            <Input />
          </Form.Item>
          <Form.Item name="evidence" label="Bằng chứng">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <RecordDetailDrawer
        title="Chi tiết phân tích nguy cơ"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Tiêu đề", span: 2, render: (r) => r.title },
          {
            label: "Chuyên mục",
            render: (r) => ALERT_CATEGORY_LABELS[r.category],
          },
          {
            label: "Mức độ",
            render: (r) => {
              const cfg = RISK_LEVEL_CONFIG[r.riskLevel];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = RISK_ANALYSIS_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Công khai",
            render: (r) => (r.isPublic ? "Có" : "Không"),
          },
          { label: "Nội dung", span: 2, render: (r) => r.content },
          {
            label: "Sản phẩm liên quan",
            span: 2,
            render: (r) => r.relatedProducts,
          },
          { label: "Bằng chứng", span: 2, render: (r) => r.evidence },
          { label: "Khuyến nghị", span: 2, render: (r) => r.recommendations },
          {
            label: "Ngày tạo",
            render: (r) => dayjs(r.creationTime).format("DD/MM/YYYY"),
          },
          {
            label: "Ngày công bố",
            render: (r) =>
              r.publishedAt ? dayjs(r.publishedAt).format("DD/MM/YYYY") : null,
          },
        ]}
      />
    </Card>
  );
}
