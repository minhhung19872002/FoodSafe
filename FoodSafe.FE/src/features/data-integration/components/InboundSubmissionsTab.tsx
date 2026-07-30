import { useState } from "react";
import {
  App,
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import {
  useInboundSubmissionDetail,
  useInboundSubmissions,
} from "../api/dataIntegrationQueries";
import {
  useProcessInboundSubmission,
  useRejectInboundSubmission,
} from "../api/dataIntegrationMutations";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  INBOUND_SUBMISSION_STATUS,
  INBOUND_SUBMISSION_STATUS_CONFIG,
  SHARED_DATA_TYPE,
  SHARED_DATA_TYPE_LABELS,
  type InboundSubmission,
  type InboundSubmissionFilter,
  type InboundSubmissionStatus,
  type SharedDataType,
} from "../types/dataIntegration.types";

interface RejectFormValues {
  reason: string;
}

/**
 * Data partners pushed in through the inbound API (INT-03, STT 51-57 "nhận"),
 * plus the officer disposition flow: Đã nhận → Đã xử lý / Từ chối (kèm lý do).
 */
export function InboundSubmissionsTab() {
  const { message } = App.useApp();
  const [filter, setFilter] = useState<InboundSubmissionFilter>({});
  const [filterResetKey, setFilterResetKey] = useState(0);
  const pagination = useTablePagination(15);
  const { data, isLoading, refetch } = useInboundSubmissions({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const [detailId, setDetailId] = useState<string>();
  const detail = useInboundSubmissionDetail(detailId);

  const canModerate = useAuthStore((s) => s.hasPermission)(
    "FoodSafe.DataIntegration.Partners.Moderate",
  );
  const processMutation = useProcessInboundSubmission();
  const rejectMutation = useRejectInboundSubmission();
  const [rejectTarget, setRejectTarget] = useState<InboundSubmission>();
  const [rejectForm] = Form.useForm<RejectFormValues>();

  const handleProcess = async (record: InboundSubmission) => {
    try {
      await processMutation.mutateAsync(record.id);
      message.success("Đã duyệt dữ liệu tiếp nhận.");
    } catch {
      /* the global error interceptor already surfaced the reason */
    }
  };

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({
        submissionId: rejectTarget.id,
        reason: values.reason,
      });
      message.success("Đã từ chối dữ liệu tiếp nhận.");
      setRejectTarget(undefined);
      rejectForm.resetFields();
    } catch {
      /* the global error interceptor already surfaced the reason */
    }
  };

  const columns: TableColumnsType<InboundSubmission> = [
    { title: "Đối tác", dataIndex: "partnerName", ellipsis: true },
    {
      title: "Loại dữ liệu",
      dataIndex: "dataType",
      width: 170,
      render: (v: SharedDataType) => SHARED_DATA_TYPE_LABELS[v] ?? "Khác",
    },
    {
      title: "Mã yêu cầu",
      dataIndex: "requestId",
      width: 180,
      ellipsis: true,
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: "Bản ghi",
      dataIndex: "recordCount",
      width: 80,
      align: "right",
    },
    {
      title: "Nhận lúc",
      dataIndex: "receivedAt",
      width: 150,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      render: (s: InboundSubmissionStatus) => {
        const cfg = INBOUND_SUBMISSION_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: canModerate ? 130 : 50,
      render: (_, record) => {
        const awaitingDisposition =
          record.status === INBOUND_SUBMISSION_STATUS.Received;
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              aria-label="Xem chi tiết"
              onClick={() => setDetailId(record.id)}
            />
            {canModerate && awaitingDisposition && (
              <>
                <Popconfirm
                  title="Duyệt dữ liệu tiếp nhận này?"
                  okText="Duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleProcess(record)}
                >
                  <Tooltip title="Duyệt">
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<CheckOutlined />}
                      aria-label="Duyệt"
                      loading={processMutation.isPending}
                    />
                  </Tooltip>
                </Popconfirm>
                <Tooltip title="Từ chối">
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    aria-label="Từ chối"
                    onClick={() => {
                      rejectForm.resetFields();
                      setRejectTarget(record);
                    }}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap key={filterResetKey}>
        <Input.Search
          placeholder="Mã yêu cầu, đối tác, correlation, nội dung"
          allowClear
          style={{ width: 320 }}
          onSearch={(value) => {
            setFilter((current) => ({
              ...current,
              filter: value.trim() || undefined,
            }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Loại dữ liệu"
          allowClear
          style={{ width: 200 }}
          options={Object.entries(SHARED_DATA_TYPE_LABELS)
            .filter(([v]) => Number(v) !== SHARED_DATA_TYPE.Other)
            .map(([value, label]) => ({ value: Number(value), label }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, dataType: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(INBOUND_SUBMISSION_STATUS_CONFIG).map(
            ([k, v]) => ({ value: Number(k), label: v.label }),
          )}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <DatePicker.RangePicker
          placeholder={["Từ ngày", "Đến ngày"]}
          format="DD/MM/YYYY"
          onChange={(range) => {
            setFilter((f) => ({
              ...f,
              fromDate: range?.[0]?.format("YYYY-MM-DD"),
              toDate: range?.[1]?.format("YYYY-MM-DD"),
            }));
            pagination.resetToFirstPage();
          }}
        />
        <ClearFiltersButton
          active={Boolean(
            filter.filter?.trim() ||
            filter.dataType !== undefined ||
            filter.status !== undefined ||
            filter.fromDate ||
            filter.toDate,
          )}
          onClick={() => {
            setFilter({});
            setFilterResetKey((key) => key + 1);
            pagination.resetToFirstPage();
          }}
        />
        <RefreshListButton loading={isLoading} onClick={() => void refetch()} />
      </Space>
      <Table
        sticky
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailId(record.id),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />
      <Modal
        title="Chi tiết dữ liệu nhận về"
        open={Boolean(detailId)}
        footer={null}
        onCancel={() => setDetailId(undefined)}
        width={720}
        destroyOnHidden
      >
        {detail.data && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Đối tác" span={2}>
              {detail.data.partnerName}
            </Descriptions.Item>
            <Descriptions.Item label="Loại dữ liệu">
              {SHARED_DATA_TYPE_LABELS[detail.data.dataType]}
            </Descriptions.Item>
            <Descriptions.Item label="Phiên bản schema">
              {detail.data.schemaVersion}
            </Descriptions.Item>
            <Descriptions.Item label="Mã yêu cầu">
              <Typography.Text code>{detail.data.requestId}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Correlation">
              <Typography.Text code>
                {detail.data.correlationId ?? "—"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nhận lúc">
              {dayjs(detail.data.receivedAt).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Số bản ghi">
              {detail.data.recordCount}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  INBOUND_SUBMISSION_STATUS_CONFIG[detail.data.status].color
                }
              >
                {INBOUND_SUBMISSION_STATUS_CONFIG[detail.data.status].label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Xử lý lúc">
              {detail.data.processedAt
                ? dayjs(detail.data.processedAt).format("DD/MM/YYYY HH:mm:ss")
                : "—"}
            </Descriptions.Item>
            {detail.data.rejectReason && (
              <Descriptions.Item label="Lý do từ chối" span={2}>
                <span style={{ color: "#ff4d4f" }}>
                  {detail.data.rejectReason}
                </span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Payload" span={2}>
              <pre
                style={{
                  maxHeight: 240,
                  overflow: "auto",
                  fontSize: 12,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {detail.data.payload}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <Modal
        title="Từ chối dữ liệu tiếp nhận"
        open={Boolean(rejectTarget)}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        onOk={handleReject}
        onCancel={() => setRejectTarget(undefined)}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" requiredMark>
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: "Vui lòng nhập lý do từ chối." },
              { min: 3, message: "Lý do phải có ít nhất 3 ký tự." },
              { max: 500, message: "Lý do tối đa 500 ký tự." },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="Nêu rõ lý do không tiếp nhận dữ liệu này"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
