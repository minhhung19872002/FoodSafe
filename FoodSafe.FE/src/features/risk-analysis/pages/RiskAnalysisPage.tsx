import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
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

const PAGE_SIZE = 15;

export default function RiskAnalysisPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<RiskAnalysisFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useRiskAnalyses(filter);
  const createMut = useCreateRiskAnalysis();
  const updateMut = useUpdateRiskAnalysis();
  const deleteMut = useDeleteRiskAnalysis();
  const publishMut = usePublishRiskAnalysis();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RiskAnalysis | null>(null);
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
      width: 160,
      render: (_, record) => (
        <Space size="small">
          {record.status === RISK_ANALYSIS_STATUS.Draft && (
            <>
              {hasPermission(
                "FoodSafe.AlertsAndTesting.RiskAnalyses.Edit",
              ) && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(record)}
                />
              )}
              {hasPermission(
                "FoodSafe.AlertsAndTesting.RiskAnalyses.Publish",
              ) && (
                <Popconfirm
                  title="Xuất bản phân tích này?"
                  onConfirm={() =>
                    publishMut.mutate(record.id, {
                      onSuccess: () => message.success("Đã xuất bản"),
                    })
                  }
                >
                  <Button size="small" icon={<SendOutlined />} />
                </Popconfirm>
              )}
              {hasPermission(
                "FoodSafe.AlertsAndTesting.RiskAnalyses.Delete",
              ) && (
                <Popconfirm
                  title="Xóa phân tích?"
                  onConfirm={() =>
                    deleteMut.mutate(record.id, {
                      onSuccess: () => message.success("Đã xóa"),
                    })
                  }
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </>
          )}
        </Space>
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
          onSearch={(v) =>
            setFilter((f) => ({ ...f, filter: v || undefined, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(RISK_ANALYSIS_STATUS_CONFIG).map(
            ([k, v]) => ({ value: Number(k), label: v.label }),
          )}
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Mức độ"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(RISK_LEVEL_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
            setFilter((f) => ({ ...f, riskLevel: v, skipCount: 0 }))
          }
        />
        {hasPermission(
          "FoodSafe.AlertsAndTesting.RiskAnalyses.Create",
        ) && (
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
        title={editing ? "Sửa phân tích nguy cơ" : "Tạo phân tích nguy cơ"}
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
            if (editing) {
              updateMut.mutate(
                { id: editing.id, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã cập nhật");
                    setEditorOpen(false);
                  },
                },
              );
            } else {
              createMut.mutate(values, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
              });
            }
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true }]}
          >
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
              label="Mức độ nguy cơ"
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
    </Card>
  );
}
