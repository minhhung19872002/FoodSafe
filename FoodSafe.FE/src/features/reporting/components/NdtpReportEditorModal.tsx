import { useEffect } from "react";
import { Modal, Form, InputNumber, Input, Divider, Row, Col } from "antd";
import {
  useUpdateNdtpStats,
  useUpdateNdtpNarrative,
} from "../api/reportingMutations";
import type { NdtpReport } from "../types/reporting.types";

interface Props {
  report: NdtpReport | null;
  onClose: () => void;
}

export function NdtpReportEditorModal({ report, onClose }: Props) {
  const [form] = Form.useForm();
  const updateStats = useUpdateNdtpStats();
  const updateNarrative = useUpdateNdtpNarrative();

  useEffect(() => {
    if (report) {
      form.setFieldsValue({
        caseCount: report.caseCount,
        caseAffected: report.caseAffected,
        caseHospitalized: report.caseHospitalized,
        caseDeaths: report.caseDeaths,
        incidentCount: report.incidentCount,
        incidentAffected: report.incidentAffected,
        incidentHospitalized: report.incidentHospitalized,
        incidentDeaths: report.incidentDeaths,
        preventionActivities: report.preventionActivities,
        riskFactors: report.riskFactors,
        recommendations: report.recommendations,
        notes: report.notes,
      });
    }
  }, [report, form]);

  const handleSave = async () => {
    if (!report) return;
    const values = await form.validateFields();

    await updateStats.mutateAsync({
      id: report.id,
      input: {
        caseCount: values.caseCount ?? 0,
        caseAffected: values.caseAffected ?? 0,
        caseHospitalized: values.caseHospitalized ?? 0,
        caseDeaths: values.caseDeaths ?? 0,
        incidentCount: values.incidentCount ?? 0,
        incidentAffected: values.incidentAffected ?? 0,
        incidentHospitalized: values.incidentHospitalized ?? 0,
        incidentDeaths: values.incidentDeaths ?? 0,
      },
    });

    await updateNarrative.mutateAsync({
      id: report.id,
      input: {
        preventionActivities: values.preventionActivities,
        riskFactors: values.riskFactors,
        recommendations: values.recommendations,
        notes: values.notes,
      },
    });

    onClose();
  };

  return (
    <Modal
      title={`Sửa báo cáo NĐTP — Tháng ${report?.periodMonth}/${report?.periodYear}`}
      open={!!report}
      onCancel={onClose}
      onOk={handleSave}
      okText="Lưu"
      cancelText="Hủy"
      width={720}
      confirmLoading={updateStats.isPending || updateNarrative.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Divider titlePlacement="left">Ca ngộ độc nhỏ lẻ</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="caseCount" label="Số ca">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="caseAffected" label="Mắc">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="caseHospitalized" label="Nhập viện">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="caseDeaths" label="Tử vong">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">Vụ ngộ độc</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="incidentCount" label="Số vụ">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="incidentAffected" label="Mắc">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="incidentHospitalized" label="Nhập viện">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="incidentDeaths" label="Tử vong">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">Nội dung báo cáo</Divider>
        <Form.Item name="preventionActivities" label="Hoạt động phòng chống">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="riskFactors" label="Yếu tố nguy cơ">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="recommendations" label="Kiến nghị">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
