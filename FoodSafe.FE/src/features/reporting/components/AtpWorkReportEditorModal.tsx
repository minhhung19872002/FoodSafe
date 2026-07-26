import { useEffect } from "react";
import { Modal, Form, InputNumber, Input, Divider, Row, Col } from "antd";
import {
  useUpdateAtpStats,
  useUpdateAtpNarrative,
} from "../api/reportingMutations";
import type { AtpWorkReport } from "../types/reporting.types";

interface Props {
  report: AtpWorkReport | null;
  onClose: () => void;
}

export function AtpWorkReportEditorModal({ report, onClose }: Props) {
  const [form] = Form.useForm();
  const updateStats = useUpdateAtpStats();
  const updateNarrative = useUpdateAtpNarrative();

  useEffect(() => {
    if (report) {
      form.setFieldsValue({
        totalBusinesses: report.totalBusinesses,
        newBusinesses: report.newBusinesses,
        inactiveBusinesses: report.inactiveBusinesses,
        businessesWithCertificate: report.businessesWithCertificate,
        dkcbIssued: report.dkcbIssued,
        selfDeclarationsReceived: report.selfDeclarationsReceived,
        adRegistrationsIssued: report.adRegistrationsIssued,
        eligibilityCertificatesIssued: report.eligibilityCertificatesIssued,
        cfsIssued: report.cfsIssued,
        exportCertificatesIssued: report.exportCertificatesIssued,
        totalInspectionPlans: report.totalInspectionPlans,
        businessesInspected: report.businessesInspected,
        violationsFound: report.violationsFound,
        finesIssued: report.finesIssued,
        fineTotalAmount: report.fineTotalAmount,
        poisoningCaseCount: report.poisoningCaseCount,
        poisoningIncidentCount: report.poisoningIncidentCount,
        totalAffected: report.totalAffected,
        totalDeaths: report.totalDeaths,
        trainingSessions: report.trainingSessions,
        trainingParticipants: report.trainingParticipants,
        mediaAppearances: report.mediaAppearances,
        documentsIssued: report.documentsIssued,
        overview: report.overview,
        achievements: report.achievements,
        limitations: report.limitations,
        solutions: report.solutions,
        nextPeriodPlan: report.nextPeriodPlan,
        notes: report.notes,
      });
    }
  }, [report, form]);

  const handleSave = async () => {
    if (!report) return;
    const v = await form.validateFields();

    await updateStats.mutateAsync({
      id: report.id,
      input: {
        totalBusinesses: v.totalBusinesses ?? 0,
        newBusinesses: v.newBusinesses ?? 0,
        inactiveBusinesses: v.inactiveBusinesses ?? 0,
        businessesWithCertificate: v.businessesWithCertificate ?? 0,
        dkcbIssued: v.dkcbIssued ?? 0,
        selfDeclarationsReceived: v.selfDeclarationsReceived ?? 0,
        adRegistrationsIssued: v.adRegistrationsIssued ?? 0,
        eligibilityCertificatesIssued: v.eligibilityCertificatesIssued ?? 0,
        cfsIssued: v.cfsIssued ?? 0,
        exportCertificatesIssued: v.exportCertificatesIssued ?? 0,
        totalInspectionPlans: v.totalInspectionPlans ?? 0,
        businessesInspected: v.businessesInspected ?? 0,
        violationsFound: v.violationsFound ?? 0,
        finesIssued: v.finesIssued ?? 0,
        fineTotalAmount: v.fineTotalAmount ?? 0,
        poisoningCaseCount: v.poisoningCaseCount ?? 0,
        poisoningIncidentCount: v.poisoningIncidentCount ?? 0,
        totalAffected: v.totalAffected ?? 0,
        totalDeaths: v.totalDeaths ?? 0,
        trainingSessions: v.trainingSessions ?? 0,
        trainingParticipants: v.trainingParticipants ?? 0,
        mediaAppearances: v.mediaAppearances ?? 0,
        documentsIssued: v.documentsIssued ?? 0,
      },
    });

    await updateNarrative.mutateAsync({
      id: report.id,
      input: {
        overview: v.overview,
        achievements: v.achievements,
        limitations: v.limitations,
        solutions: v.solutions,
        nextPeriodPlan: v.nextPeriodPlan,
        notes: v.notes,
      },
    });

    onClose();
  };

  return (
    <Modal
      title="Sửa báo cáo Công tác ATTP"
      open={!!report}
      onCancel={onClose}
      onOk={handleSave}
      width={860}
      confirmLoading={updateStats.isPending || updateNarrative.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8 }}
      >
        <Divider orientation="left">Quản lý cơ sở</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="totalBusinesses" label="Tổng cơ sở">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="newBusinesses" label="Mới">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="inactiveBusinesses" label="Ngừng HĐ">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="businessesWithCertificate" label="Có GCN">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Cấp phép & Công bố</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="dkcbIssued" label="ĐKCB đã cấp">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="selfDeclarationsReceived" label="Tự công bố">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="adRegistrationsIssued" label="ĐK quảng cáo">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="eligibilityCertificatesIssued" label="GĐK ATTP">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cfsIssued" label="CFS">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="exportCertificatesIssued" label="GCN XK">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Thanh tra - Kiểm tra</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="totalInspectionPlans" label="Kế hoạch">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="businessesInspected" label="Đã kiểm tra">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="violationsFound" label="Vi phạm">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="finesIssued" label="Xử phạt">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="fineTotalAmount" label="Tổng tiền phạt (VNĐ)">
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(v) =>
                  `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(v) => Number(v?.replace(/\./g, "") ?? 0)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Ngộ độc thực phẩm</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="poisoningCaseCount" label="Số ca">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="poisoningIncidentCount" label="Số vụ">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="totalAffected" label="Mắc">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="totalDeaths" label="Tử vong">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Đào tạo & Truyền thông</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="trainingSessions" label="Buổi tập huấn">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="trainingParticipants" label="Tham dự">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="mediaAppearances" label="Tin bài">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="documentsIssued" label="Văn bản">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Nhận xét & Đánh giá</Divider>
        <Form.Item name="overview" label="Tổng quan">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="achievements" label="Kết quả đạt được">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="limitations" label="Hạn chế">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="solutions" label="Giải pháp">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="nextPeriodPlan" label="Kế hoạch kỳ tới">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
