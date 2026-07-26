import { useEffect } from "react";
import { Modal, Form, InputNumber, Input, Divider, Row, Col } from "antd";
import {
  useUpdateAmrStats,
  useUpdateAmrNarrative,
} from "../api/reportingMutations";
import type { ActionMonthReport } from "../types/reporting.types";

interface Props {
  report: ActionMonthReport | null;
  onClose: () => void;
}

export function ActionMonthReportEditorModal({ report, onClose }: Props) {
  const [form] = Form.useForm();
  const updateStats = useUpdateAmrStats();
  const updateNarrative = useUpdateAmrNarrative();

  useEffect(() => {
    if (report) {
      form.setFieldsValue({
        mediaArticles: report.mediaArticles,
        broadcastPrograms: report.broadcastPrograms,
        propagandaSessions: report.propagandaSessions,
        participants: report.participants,
        postersDistributed: report.postersDistributed,
        leafletsDistributed: report.leafletsDistributed,
        businessesInspected: report.businessesInspected,
        violationsFound: report.violationsFound,
        finesIssued: report.finesIssued,
        fineAmount: report.fineAmount,
        newSelfDeclarations: report.newSelfDeclarations,
        actionMonthTheme: report.actionMonthTheme,
        actionMonthDates: report.actionMonthDates,
        achievements: report.achievements,
        limitations: report.limitations,
        lessonsLearned: report.lessonsLearned,
        nextSteps: report.nextSteps,
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
        mediaArticles: v.mediaArticles ?? 0,
        broadcastPrograms: v.broadcastPrograms ?? 0,
        propagandaSessions: v.propagandaSessions ?? 0,
        participants: v.participants ?? 0,
        postersDistributed: v.postersDistributed ?? 0,
        leafletsDistributed: v.leafletsDistributed ?? 0,
        businessesInspected: v.businessesInspected ?? 0,
        violationsFound: v.violationsFound ?? 0,
        finesIssued: v.finesIssued ?? 0,
        fineAmount: v.fineAmount ?? 0,
        newSelfDeclarations: v.newSelfDeclarations ?? 0,
      },
    });

    await updateNarrative.mutateAsync({
      id: report.id,
      input: {
        actionMonthTheme: v.actionMonthTheme,
        actionMonthDates: v.actionMonthDates,
        achievements: v.achievements,
        limitations: v.limitations,
        lessonsLearned: v.lessonsLearned,
        nextSteps: v.nextSteps,
        notes: v.notes,
      },
    });

    onClose();
  };

  return (
    <Modal
      title={`Sửa báo cáo Tháng hành động — Năm ${report?.periodYear}`}
      open={!!report}
      onCancel={onClose}
      onOk={handleSave}
      width={780}
      confirmLoading={updateStats.isPending || updateNarrative.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8 }}
      >
        <Divider orientation="left">Truyền thông</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="mediaArticles" label="Bài báo">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="broadcastPrograms" label="Chương trình PT-TH">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="propagandaSessions" label="Buổi tuyên truyền">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="participants" label="Người tham gia">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="postersDistributed" label="Áp phích">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="leafletsDistributed" label="Tờ rơi">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Thanh tra - Kiểm tra</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="businessesInspected" label="Cơ sở TT">
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
          <Col span={6}>
            <Form.Item name="fineAmount" label="Tiền phạt (VNĐ)">
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
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="newSelfDeclarations" label="Tự công bố mới">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Đánh giá</Divider>
        <Form.Item name="actionMonthTheme" label="Chủ đề">
          <Input />
        </Form.Item>
        <Form.Item name="actionMonthDates" label="Thời gian">
          <Input placeholder="VD: 15/4 - 15/5/2026" />
        </Form.Item>
        <Form.Item name="achievements" label="Kết quả đạt được">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="limitations" label="Hạn chế">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="lessonsLearned" label="Bài học kinh nghiệm">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="nextSteps" label="Kế hoạch tiếp theo">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
