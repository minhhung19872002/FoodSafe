import { useState } from "react";
import {
  App,
  Button,
  Form,
  Input,
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
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import { escapeHtml, printHtml } from "@/utils/printHtml";
import {
  ALERT_CATEGORY,
  ALERT_CATEGORY_LABELS,
} from "@/features/alerts-news/types/alertsNews.types";
import { useCatalogOptions } from "@/features/catalogs/api/catalogQueries";
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
  type CreateUpdateRiskAnalysisInput,
  type RiskAnalysis,
  type RiskAnalysisFilter,
  type RiskAnalysisStatus,
  type RiskLevel,
} from "../types/riskAnalysis.types";
import type { AlertCategory } from "@/features/alerts-news/types/alertsNews.types";
import { useTablePagination } from "@/hooks/useTablePagination";

const TITLE_MAX_LENGTH = 500;

export default function RiskAnalysisPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.AlertsAndTesting.RiskAnalyses.Create",
  );
  const canEdit = hasPermission("FoodSafe.AlertsAndTesting.RiskAnalyses.Edit");
  const canPublish = hasPermission(
    "FoodSafe.AlertsAndTesting.RiskAnalyses.Publish",
  );
  const canDelete = hasPermission(
    "FoodSafe.AlertsAndTesting.RiskAnalyses.Delete",
  );

  const productGroupOptions = useCatalogOptions("product-group");

  const [filter, setFilter] = useState<RiskAnalysisFilter>({});
  const pagination = useTablePagination(15);
  const listQuery = useRiskAnalyses({
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

  const applyFilter = (patch: Partial<RiskAnalysisFilter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    pagination.resetToFirstPage();
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      category: ALERT_CATEGORY.FoodSafety,
      riskLevel: RISK_LEVEL.Medium,
      productGroupIds: [],
    });
    setEditorOpen(true);
  };

  const openEdit = (record: RiskAnalysis) => {
    setEditing(record);
    form.setFieldsValue(record);
    setEditorOpen(true);
  };

  const save = (values: CreateUpdateRiskAnalysisInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu phân tích nguy cơ.");
        setEditorOpen(false);
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMut.mutate({ id: editing.id, input: values }, options);
    else createMut.mutate(values, options);
  };

  const printRecord = (record: RiskAnalysis) =>
    printHtml(
      record.title,
      `<h3>CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH</h3>
       <h2>PHÂN TÍCH MỐI NGUY CƠ AN TOÀN THỰC PHẨM</h2>
       <h3>${escapeHtml(record.title)}</h3>
       <p><strong>Chuyên mục:</strong> ${escapeHtml(ALERT_CATEGORY_LABELS[record.category])}</p>
       <p><strong>Mức độ nguy cơ:</strong> ${escapeHtml(RISK_LEVEL_CONFIG[record.riskLevel]?.label)}</p>
       <p><strong>Nhóm sản phẩm:</strong> ${record.productGroupNames.length > 0 ? record.productGroupNames.map(escapeHtml).join(", ") : "—"}</p>
       <p><strong>Sản phẩm liên quan:</strong> ${escapeHtml(record.relatedProducts) || "—"}</p>
       <p><strong>Nội dung phân tích:</strong></p>
       <p>${escapeHtml(record.content)}</p>
       <p><strong>Bằng chứng:</strong> ${escapeHtml(record.evidence) || "—"}</p>
       <p><strong>Khuyến nghị:</strong> ${escapeHtml(record.recommendations) || "—"}</p>
       ${record.publishedAt ? `<p><strong>Ngày công bố:</strong> ${dayjs(record.publishedAt).format("DD/MM/YYYY")}</p>` : ""}`,
    );

  const columns: TableColumnsType<RiskAnalysis> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      width: 160,
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
      width: 120,
      render: (_, record) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "print",
              label: "In",
              ariaLabel: `In ${record.title}`,
              icon: <PrinterOutlined />,
              onClick: () => printRecord(record),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${record.title}`,
              icon: <EditOutlined />,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft && canEdit
              ),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              ariaLabel: `Xuất bản ${record.title}`,
              icon: <SendOutlined />,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft && canPublish
              ),
              confirm: "Xuất bản phân tích này?",
              onClick: () =>
                publishMut.mutate(record.id, {
                  onSuccess: () =>
                    void message.success("Đã xuất bản phân tích nguy cơ."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${record.title}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(
                record.status === RISK_ANALYSIS_STATUS.Draft && canDelete
              ),
              confirm: "Xóa phân tích?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa phân tích nguy cơ."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Phân tích nguy cơ"
        subtitle="Phân tích mối nguy cơ an toàn thực phẩm và công bố kết quả"
        actions={
          <Space>
            <Button
              icon={<ExportOutlined />}
              loading={exportMut.isPending}
              onClick={() =>
                exportMut.mutate(filter, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                })
              }
            >
              Xuất Excel
            </Button>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
              >
                Tạo phân tích
              </Button>
            )}
          </Space>
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              placeholder="Tìm theo tiêu đề"
              allowClear
              style={{ width: 220 }}
              onSearch={(value) =>
                applyFilter({ filter: value.trim() || undefined })
              }
            />
            <Select
              placeholder="Chuyên mục"
              allowClear
              style={{ width: 170 }}
              options={Object.entries(ALERT_CATEGORY_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
              onChange={(value: AlertCategory | undefined) =>
                applyFilter({ category: value })
              }
            />
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 140 }}
              options={Object.entries(RISK_ANALYSIS_STATUS_CONFIG).map(
                ([value, config]) => ({
                  value: Number(value),
                  label: config.label,
                }),
              )}
              onChange={(value: RiskAnalysisStatus | undefined) =>
                applyFilter({ status: value })
              }
            />
            <Select
              placeholder="Mức độ"
              allowClear
              style={{ width: 140 }}
              options={Object.entries(RISK_LEVEL_CONFIG).map(
                ([value, config]) => ({
                  value: Number(value),
                  label: config.label,
                }),
              )}
              onChange={(value: RiskLevel | undefined) =>
                applyFilter({ riskLevel: value })
              }
            />
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={listQuery.data?.items}
          loading={listQuery.isFetching}
          size="middle"
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          pagination={pagination.buildConfig(listQuery.data?.totalCount)}
        />
      </div>

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
        <Form form={form} layout="vertical" preserve={false} onFinish={save}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true }, { max: TITLE_MAX_LENGTH }]}
          >
            <Input maxLength={TITLE_MAX_LENGTH} showCount />
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
                  ([value, label]) => ({ value: Number(value), label }),
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
                options={Object.entries(RISK_LEVEL_CONFIG).map(
                  ([value, config]) => ({
                    value: Number(value),
                    label: config.label,
                  }),
                )}
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
          <Form.Item name="productGroupIds" label="Nhóm sản phẩm">
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn nhóm sản phẩm"
              loading={productGroupOptions.isFetching}
              optionFilterProp="label"
              options={(productGroupOptions.data?.items ?? []).map((pg) => ({
                value: pg.id,
                label: pg.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="relatedProducts"
            label="Sản phẩm liên quan (mô tả tự do)"
          >
            <Input placeholder="Tên sản phẩm cụ thể, lô hàng..." />
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
            label: "Nhóm sản phẩm",
            span: 2,
            render: (r) =>
              r.productGroupNames.length > 0 ? (
                <Space wrap size={4}>
                  {r.productGroupNames.map((name) => (
                    <Tag key={name} color="blue">
                      {name}
                    </Tag>
                  ))}
                </Space>
              ) : null,
          },
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
    </div>
  );
}
