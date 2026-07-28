import { useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useInboundSubmissionDetail,
  useInboundSubmissions,
} from "../api/dataIntegrationQueries";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  INBOUND_SUBMISSION_STATUS_CONFIG,
  SHARED_DATA_TYPE,
  SHARED_DATA_TYPE_LABELS,
  type InboundSubmission,
  type InboundSubmissionFilter,
  type InboundSubmissionStatus,
  type SharedDataType,
} from "../types/dataIntegration.types";

/** Read-only view of the data partners pushed in through the inbound API (INT-03, STT 51-57 "nhận"). */
export function InboundSubmissionsTab() {
  const [filter, setFilter] = useState<InboundSubmissionFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useInboundSubmissions({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const [detailId, setDetailId] = useState<string>();
  const detail = useInboundSubmissionDetail(detailId);

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
      width: 50,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailId(record.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
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
      </Space>
      <Table
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
    </>
  );
}
