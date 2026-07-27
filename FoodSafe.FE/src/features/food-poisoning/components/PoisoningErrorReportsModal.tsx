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
import dayjs from "dayjs";
import {
  useCaseErrorReports,
  useIncidentErrorReports,
} from "../api/foodPoisoningQueries";
import {
  useAddCaseErrorReport,
  useAddIncidentErrorReport,
} from "../api/foodPoisoningMutations";
import {
  ERROR_REPORT_STATUS_CONFIG,
  POISONING_CASE_STATUS,
  POISONING_INCIDENT_STATUS,
  type CreateErrorReportInput,
  type PoisoningCaseStatus,
  type PoisoningErrorReport,
  type PoisoningIncidentStatus,
} from "../types/foodPoisoning.types";

export type PoisoningErrorReportKind = "case" | "incident";

type PoisoningEntityStatus = PoisoningCaseStatus | PoisoningIncidentStatus;

const KIND_CONFIG: Record<
  PoisoningErrorReportKind,
  {
    title: string;
    emptyText: string;
    statusHint: string;
    verifiedStatus: PoisoningEntityStatus;
  }
> = {
  case: {
    title: "Báo cáo sai sót ca ngộ độc",
    emptyText: "Chưa có báo cáo sai sót nào cho ca ngộ độc này.",
    statusHint: "Chỉ có thể báo sai sót khi ca ngộ độc đã được xác minh.",
    verifiedStatus: POISONING_CASE_STATUS.Verified,
  },
  incident: {
    title: "Báo cáo sai sót vụ ngộ độc",
    emptyText: "Chưa có báo cáo sai sót nào cho vụ ngộ độc này.",
    statusHint: "Chỉ có thể báo sai sót khi vụ ngộ độc đã được xác minh.",
    verifiedStatus: POISONING_INCIDENT_STATUS.Verified,
  },
};

function ErrorReportListView(props: {
  reports: PoisoningErrorReport[];
  loading: boolean;
  loadFailed: boolean;
  emptyText: string;
}) {
  if (props.loading) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (props.loadFailed) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải danh sách báo cáo sai sót."
      />
    );
  }

  return (
    <List<PoisoningErrorReport>
      dataSource={props.reports}
      locale={{ emptyText: <Empty description={props.emptyText} /> }}
      renderItem={(item) => {
        const cfg = ERROR_REPORT_STATUS_CONFIG[item.status];
        return (
          <List.Item key={item.id}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Space>
                <Tag color={cfg.color}>{cfg.label}</Tag>
                <Typography.Text type="secondary">
                  {dayjs(item.creationTime).format("DD/MM/YYYY HH:mm")}
                </Typography.Text>
              </Space>
              <Typography.Text strong>
                Nội dung sai sót: {item.errorDescription}
              </Typography.Text>
              <Typography.Text>
                Đề nghị chỉnh sửa: {item.correctionRequest}
              </Typography.Text>
              {item.response && (
                <Alert type="info" message={`Phản hồi: ${item.response}`} />
              )}
            </Space>
          </List.Item>
        );
      }}
    />
  );
}

function ErrorReportFormView(props: {
  submitting: boolean;
  submitFailed: boolean;
  onSubmit: (input: CreateErrorReportInput) => Promise<boolean>;
}) {
  const [form] = Form.useForm<CreateErrorReportInput>();

  async function handleFinish(values: CreateErrorReportInput) {
    const succeeded = await props.onSubmit({
      errorDescription: values.errorDescription.trim(),
      correctionRequest: values.correctionRequest.trim(),
    });
    if (succeeded) form.resetFields();
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ marginTop: 16 }}
    >
      {props.submitFailed && (
        <Alert
          type="error"
          showIcon
          message="Không thể gửi báo cáo sai sót."
          style={{ marginBottom: 12 }}
        />
      )}
      <Form.Item
        name="errorDescription"
        label="Nội dung sai sót"
        rules={[
          { required: true, message: "Vui lòng nhập nội dung sai sót" },
          { max: 1000 },
        ]}
      >
        <Input.TextArea
          rows={2}
          placeholder="VD: Sai số ca mắc, sai địa điểm"
        />
      </Form.Item>
      <Form.Item
        name="correctionRequest"
        label="Đề nghị chỉnh sửa"
        rules={[
          { required: true, message: "Vui lòng nhập đề nghị chỉnh sửa" },
          { max: 4000 },
        ]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Mô tả giá trị đúng cần chỉnh sửa"
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={props.submitting}>
        Gửi báo cáo sai sót
      </Button>
    </Form>
  );
}

interface Props {
  kind: PoisoningErrorReportKind;
  entityId: string | null;
  entityCode?: string;
  entityStatus: PoisoningEntityStatus | null;
  open: boolean;
  canReport: boolean;
  onClose: () => void;
}

export function PoisoningErrorReportsModal(props: Props) {
  const { kind, entityId, entityCode, entityStatus, open, canReport } = props;
  const { message } = App.useApp();
  const cfg = KIND_CONFIG[kind];
  const activeId = open && entityId ? entityId : "";

  const caseQuery = useCaseErrorReports(kind === "case" ? activeId : "");
  const incidentQuery = useIncidentErrorReports(
    kind === "incident" ? activeId : "",
  );
  const query = kind === "case" ? caseQuery : incidentQuery;

  const addCaseMut = useAddCaseErrorReport();
  const addIncidentMut = useAddIncidentErrorReport();
  const addMut = kind === "case" ? addCaseMut : addIncidentMut;

  const canAddNow = canReport && entityStatus === cfg.verifiedStatus;

  async function handleSubmit(input: CreateErrorReportInput) {
    if (!entityId) return false;
    try {
      await addMut.mutateAsync({ id: entityId, input });
      message.success("Đã gửi báo cáo sai sót.");
      return true;
    } catch {
      message.error("Không thể gửi báo cáo sai sót.");
      return false;
    }
  }

  function handleClose() {
    addMut.reset();
    props.onClose();
  }

  return (
    <Modal
      title={entityCode ? `${cfg.title} — ${entityCode}` : cfg.title}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <ErrorReportListView
        reports={query.data ?? []}
        loading={query.isLoading}
        loadFailed={query.isError}
        emptyText={cfg.emptyText}
      />
      {canAddNow && (
        <ErrorReportFormView
          submitting={addMut.isPending}
          submitFailed={addMut.isError}
          onSubmit={handleSubmit}
        />
      )}
      {!canAddNow && canReport && (
        <Typography.Text type="secondary">{cfg.statusHint}</Typography.Text>
      )}
    </Modal>
  );
}
