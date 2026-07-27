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
  useReportErrorNotifications,
  type ReportKind,
} from "../api/reportingQueries";
import {
  useAcknowledgeReportErrorNotification,
  useAddReportErrorNotification,
  useRespondReportErrorNotification,
} from "../api/reportingMutations";
import {
  REPORT_ERROR_NOTIFICATION_STATUS,
  REPORT_ERROR_NOTIFICATION_STATUS_CONFIG,
  REPORT_STATUS,
  type ReportErrorNotification,
  type ReportStatus,
} from "../types/reporting.types";

interface Props {
  kind: ReportKind;
  reportId: string | null;
  reportStatus: ReportStatus | null;
  open: boolean;
  onClose: () => void;
  canReport: boolean;
  canRespond: boolean;
}

interface AddFormValues {
  errorFields: string;
  correctionDetails: string;
}

export default function ReportErrorNotificationsModal({
  kind,
  reportId,
  reportStatus,
  open,
  onClose,
  canReport,
  canRespond,
}: Props) {
  const { message } = App.useApp();
  const [addForm] = Form.useForm<AddFormValues>();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data, isLoading, isError } = useReportErrorNotifications(
    kind,
    open ? reportId : null,
  );
  const addMutation = useAddReportErrorNotification(kind, reportId);
  const acknowledgeMutation = useAcknowledgeReportErrorNotification(
    kind,
    reportId,
  );
  const respondMutation = useRespondReportErrorNotification(kind, reportId);

  const canAddNow =
    canReport &&
    (reportStatus === REPORT_STATUS.Submitted ||
      reportStatus === REPORT_STATUS.Verified);

  const handleAdd = async (values: AddFormValues) => {
    try {
      await addMutation.mutateAsync(values);
      addForm.resetFields();
      message.success("Đã gửi báo cáo sai sót lên tuyến trên.");
    } catch {
      message.error("Không thể gửi báo cáo sai sót.");
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await acknowledgeMutation.mutateAsync(notificationId);
      message.success("Đã tiếp nhận thông báo sai sót.");
    } catch {
      message.error("Không thể tiếp nhận thông báo.");
    }
  };

  const handleRespond = async (notificationId: string) => {
    if (!responseText.trim()) {
      message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      await respondMutation.mutateAsync({
        notificationId,
        input: { response: responseText.trim() },
      });
      setRespondingId(null);
      setResponseText("");
      message.success("Đã phản hồi thông báo sai sót.");
    } catch {
      message.error("Không thể phản hồi thông báo.");
    }
  };

  return (
    <Modal
      title="Báo cáo sai sót"
      open={open}
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
        <List<ReportErrorNotification>
          dataSource={data ?? []}
          locale={{
            emptyText: <Empty description="Chưa có báo cáo sai sót nào." />,
          }}
          renderItem={(item) => {
            const statusCfg =
              REPORT_ERROR_NOTIFICATION_STATUS_CONFIG[item.status];
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
                    Trường sai sót: {item.errorFields}
                  </Typography.Text>
                  <Typography.Text>{item.correctionDetails}</Typography.Text>
                  {item.response && (
                    <Alert
                      type="info"
                      message={`Phản hồi tuyến trên: ${item.response}`}
                    />
                  )}
                  {canRespond &&
                    item.status ===
                      REPORT_ERROR_NOTIFICATION_STATUS.Pending && (
                      <Button
                        size="small"
                        onClick={() => handleAcknowledge(item.id)}
                        loading={acknowledgeMutation.isPending}
                      >
                        Tiếp nhận
                      </Button>
                    )}
                  {canRespond &&
                    item.status !==
                      REPORT_ERROR_NOTIFICATION_STATUS.Corrected &&
                    (respondingId === item.id ? (
                      <Space.Compact style={{ width: "100%" }}>
                        <Input
                          placeholder="Nội dung phản hồi"
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
      {canAddNow && (
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="errorFields"
            label="Trường thông tin sai sót"
            rules={[
              { required: true, message: "Vui lòng nhập trường sai sót" },
              { max: 1000 },
            ]}
          >
            <Input placeholder="VD: Số ca mắc, Số vụ ngộ độc" />
          </Form.Item>
          <Form.Item
            name="correctionDetails"
            label="Nội dung cần sửa"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung cần sửa" },
              { max: 4000 },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả sai sót và giá trị đúng"
            />
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
      {!canAddNow && canReport && (
        <Typography.Text type="secondary">
          Chỉ có thể báo sai sót khi báo cáo đã gửi hoặc đã xác minh.
        </Typography.Text>
      )}
    </Modal>
  );
}
