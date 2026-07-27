import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  useCaseErrorReports,
  useIncidentErrorReports,
} from "../api/foodPoisoningQueries";
import {
  useAcknowledgeCaseErrorReport,
  useAcknowledgeIncidentErrorReport,
  useAddCaseErrorReport,
  useAddIncidentErrorReport,
  useRespondCaseErrorReport,
  useRespondIncidentErrorReport,
} from "../api/foodPoisoningMutations";
import {
  ERROR_REPORT_STATUS,
  ERROR_REPORT_STATUS_CONFIG,
  type CreateErrorReportInput,
  type PoisoningErrorReport,
} from "../types/foodPoisoning.types";

interface Props {
  kind: "case" | "incident";
  targetId: string | null;
  targetCode: string;
  onClose: () => void;
  canReport: boolean;
  canRespond: boolean;
}

export function PoisoningErrorReportsModal({
  kind,
  targetId,
  targetCode,
  onClose,
  canReport,
  canRespond,
}: Props) {
  const { message } = App.useApp();
  const [addForm] = Form.useForm<CreateErrorReportInput>();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const caseReports = useCaseErrorReports(kind === "case" ? (targetId ?? "") : "");
  const incidentReports = useIncidentErrorReports(
    kind === "incident" ? (targetId ?? "") : "",
  );
  const { data, isLoading, isError } =
    kind === "case" ? caseReports : incidentReports;

  const addCase = useAddCaseErrorReport();
  const addIncident = useAddIncidentErrorReport();
  const ackCase = useAcknowledgeCaseErrorReport();
  const ackIncident = useAcknowledgeIncidentErrorReport();
  const respondCase = useRespondCaseErrorReport();
  const respondIncident = useRespondIncidentErrorReport();

  const addMutation = kind === "case" ? addCase : addIncident;
  const ackMutation = kind === "case" ? ackCase : ackIncident;
  const respondMutation = kind === "case" ? respondCase : respondIncident;

  const handleAdd = async (values: CreateErrorReportInput) => {
    if (!targetId) return;
    try {
      await addMutation.mutateAsync({ id: targetId, input: values });
      addForm.resetFields();
      message.success("Đã gửi báo cáo sai sót.");
    } catch {
      message.error("Không thể gửi báo cáo sai sót.");
    }
  };

  const handleAcknowledge = async (reportId: string) => {
    if (!targetId) return;
    try {
      await ackMutation.mutateAsync({ id: targetId, reportId });
      message.success("Đã tiếp nhận báo cáo sai sót.");
    } catch {
      message.error("Không thể tiếp nhận báo cáo.");
    }
  };

  const handleRespond = async (reportId: string) => {
    if (!targetId) return;
    if (!responseText.trim()) {
      message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      await respondMutation.mutateAsync({
        id: targetId,
        reportId,
        input: { response: responseText.trim() },
      });
      setRespondingId(null);
      setResponseText("");
      message.success("Đã phản hồi và đánh dấu đã sửa.");
    } catch {
      message.error("Không thể phản hồi báo cáo.");
    }
  };

  return (
    <Modal
      title={`Báo cáo sai sót — ${targetCode}`}
      open={Boolean(targetId)}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
    >
      {isLoading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      )}
      {isError && (
        <Alert
          type="error"
          message="Không thể tải danh sách sai sót."
          showIcon
        />
      )}
      {!isLoading && !isError && (
        <List<PoisoningErrorReport>
          dataSource={data ?? []}
          locale={{
            emptyText: <Empty description="Chưa có báo cáo sai sót nào." />,
          }}
          renderItem={(item) => {
            const statusCfg = ERROR_REPORT_STATUS_CONFIG[item.status];
            return (
              <List.Item key={item.id}>
                <Space direction="vertical" style={{ width: "100%" }} size={4}>
                  <Space>
                    <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
                    <Typography.Text type="secondary">
                      {new Date(item.creationTime).toLocaleString("vi-VN")}
                    </Typography.Text>
                  </Space>
                  <Typography.Text strong>
                    Nội dung sai sót: {item.errorDescription}
                  </Typography.Text>
                  <Typography.Text>{item.correctionRequest}</Typography.Text>
                  {item.response && (
                    <Alert
                      type="info"
                      message={`Phản hồi: ${item.response}`}
                    />
                  )}
                  {canRespond &&
                    item.status === ERROR_REPORT_STATUS.Pending && (
                      <Button
                        size="small"
                        onClick={() => handleAcknowledge(item.id)}
                        loading={ackMutation.isPending}
                      >
                        Tiếp nhận
                      </Button>
                    )}
                  {canRespond &&
                    item.status !== ERROR_REPORT_STATUS.Corrected &&
                    (respondingId === item.id ? (
                      <Space.Compact style={{ width: "100%" }}>
                        <Input
                          placeholder="Nội dung phản hồi / kết quả sửa"
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                        />
                        <Button
                          type="primary"
                          onClick={() => handleRespond(item.id)}
                          loading={respondMutation.isPending}
                        >
                          Gửi phản hồi
                        </Button>
                      </Space.Compact>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => {
                          setRespondingId(item.id);
                          setResponseText("");
                        }}
                      >
                        Phản hồi
                      </Button>
                    ))}
                </Space>
              </List.Item>
            );
          }}
        />
      )}
      {canReport && (
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="errorDescription"
            label="Mô tả sai sót"
            rules={[
              { required: true, message: "Vui lòng nhập mô tả sai sót" },
              { max: 2000 },
            ]}
          >
            <Input placeholder="VD: Sai số người mắc, sai địa điểm" />
          </Form.Item>
          <Form.Item
            name="correctionRequest"
            label="Yêu cầu sửa"
            rules={[
              { required: true, message: "Vui lòng nhập yêu cầu sửa" },
              { max: 4000 },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Nội dung đúng cần cập nhật" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={addMutation.isPending}
          >
            Gửi báo cáo sai sót
          </Button>
        </Form>
      )}
    </Modal>
  );
}
