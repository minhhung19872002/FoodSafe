import {
  App,
  Button,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { extractApiError } from "@/lib/apiError";
import {
  useMarkViolationRemedied,
  useSetFollowUpResult,
} from "../api/inspectionMutations";
import {
  FOLLOW_UP_RESULT,
  type InspectionResult,
  type InspectionViolation,
} from "../types/inspection.types";

interface Props {
  result?: InspectionResult;
  canEdit: boolean;
  onClose: () => void;
}

export function InspectionFollowUpModal({ result, canEdit, onClose }: Props) {
  const { message } = App.useApp();
  const markRemedied = useMarkViolationRemedied();
  const setFollowUp = useSetFollowUpResult();

  const columns: ColumnsType<InspectionViolation> = [
    { title: "Mô tả vi phạm", dataIndex: "description", ellipsis: true },
    {
      title: "Yêu cầu khắc phục",
      dataIndex: "remedyRequired",
      ellipsis: true,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Hạn",
      dataIndex: "remedyDeadline",
      width: 110,
      render: (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Trạng thái",
      dataIndex: "isRemedied",
      width: 130,
      render: (v: boolean, item) =>
        v ? (
          <Tag color="success">
            Đã khắc phục
            {item.remediedAt
              ? ` ${dayjs(item.remediedAt).format("DD/MM")}`
              : ""}
          </Tag>
        ) : (
          <Tag color="warning">Chưa khắc phục</Tag>
        ),
    },
    ...(canEdit
      ? [
          {
            title: "Thao tác",
            width: 130,
            render: (_: unknown, item: InspectionViolation) =>
              !item.isRemedied && result ? (
                <Popconfirm
                  title="Xác nhận vi phạm đã được khắc phục?"
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() =>
                    markRemedied.mutate(
                      { resultId: result.id, violationId: item.id },
                      {
                        onSuccess: () =>
                          void message.success("Đã ghi nhận khắc phục."),
                        onError: (error) =>
                          void message.error(extractApiError(error)),
                      },
                    )
                  }
                >
                  <Button size="small" icon={<CheckOutlined />}>
                    Đã khắc phục
                  </Button>
                </Popconfirm>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <Modal
      title={`Theo dõi khắc phục — ${result?.businessName ?? ""}`}
      open={Boolean(result)}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnHidden
    >
      {result && (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={result.violations}
            pagination={false}
            locale={{ emptyText: "Không có vi phạm chi tiết" }}
          />
          {result.followUpRequired && (
            <Space>
              <span>Kết quả tái kiểm tra:</span>
              <Select
                style={{ width: 220 }}
                placeholder="Chọn kết quả"
                disabled={!canEdit}
                value={result.followUpResultValue}
                options={[
                  { value: FOLLOW_UP_RESULT.Passed, label: "Đạt" },
                  {
                    value: FOLLOW_UP_RESULT.StillFailed,
                    label: "Vẫn không đạt",
                  },
                ]}
                onChange={(value) =>
                  setFollowUp.mutate(
                    { id: result.id, result: value },
                    {
                      onSuccess: () =>
                        void message.success(
                          "Đã cập nhật kết quả tái kiểm tra.",
                        ),
                      onError: (error) =>
                        void message.error(extractApiError(error)),
                    },
                  )
                }
              />
            </Space>
          )}
        </Space>
      )}
    </Modal>
  );
}
