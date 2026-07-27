import { useRef } from "react";
import { Button, Modal, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  REPORT_PERIOD_TYPE,
  type ActionMonthReport,
  type AtpWorkReport,
  type NdtpReport,
} from "../types/reporting.types";

export type ReportDocument =
  | { kind: "ndtp"; report: NdtpReport }
  | { kind: "atp"; report: AtpWorkReport }
  | { kind: "action-month"; report: ActionMonthReport };

interface Props {
  document: ReportDocument | null;
  onClose: () => void;
}

function Line({ label, value }: { label: string; value?: string | number }) {
  return (
    <p style={{ margin: "4px 0" }}>
      <strong>{label}:</strong> {value ?? "—"}
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 8 }}>
        {title}
      </Typography.Title>
      {children}
    </div>
  );
}

function documentTitle(doc: ReportDocument): string {
  switch (doc.kind) {
    case "ndtp":
      return `BÁO CÁO TÌNH HÌNH NGỘ ĐỘC THỰC PHẨM THÁNG ${doc.report.periodMonth}/${doc.report.periodYear}`;
    case "atp":
      return doc.report.periodType === REPORT_PERIOD_TYPE.HalfYear
        ? `BÁO CÁO CÔNG TÁC ATTP ${doc.report.periodHalf === 2 ? "6 THÁNG CUỐI" : "6 THÁNG ĐẦU"} NĂM ${doc.report.periodYear}`
        : `BÁO CÁO CÔNG TÁC ATTP NĂM ${doc.report.periodYear}`;
    case "action-month":
      return `BÁO CÁO THÁNG HÀNH ĐỘNG VÌ ATTP NĂM ${doc.report.periodYear}`;
  }
}

export function ReportDocumentViewModal({ document: doc, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!contentRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Báo cáo</title>
      <style>body{font-family:'Times New Roman',serif;padding:32px;line-height:1.5}</style>
      </head><body>${contentRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Modal
      title="Xem báo cáo dạng văn bản"
      open={Boolean(doc)}
      onCancel={onClose}
      width={860}
      footer={[
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          In / Lưu PDF
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      destroyOnHidden
    >
      {doc && (
        <div
          ref={contentRef}
          style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8 }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ margin: 0 }}>
              CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH
            </p>
            <Typography.Title level={4} style={{ marginTop: 12 }}>
              {documentTitle(doc)}
            </Typography.Title>
            <p style={{ fontStyle: "italic" }}>
              Ngày lập: {dayjs(doc.report.creationTime).format("DD/MM/YYYY")}
            </p>
          </div>

          {doc.kind === "ndtp" && (
            <>
              <Section title="I. Ca ngộ độc nhỏ lẻ">
                <Line label="Số ca" value={doc.report.caseCount} />
                <Line label="Số người mắc" value={doc.report.caseAffected} />
                <Line
                  label="Số nhập viện"
                  value={doc.report.caseHospitalized}
                />
                <Line label="Số tử vong" value={doc.report.caseDeaths} />
              </Section>
              <Section title="II. Vụ ngộ độc">
                <Line label="Số vụ" value={doc.report.incidentCount} />
                <Line
                  label="Số người mắc"
                  value={doc.report.incidentAffected}
                />
                <Line
                  label="Số nhập viện"
                  value={doc.report.incidentHospitalized}
                />
                <Line label="Số tử vong" value={doc.report.incidentDeaths} />
              </Section>
              <Section title="III. Nội dung">
                <Line
                  label="Hoạt động phòng chống"
                  value={doc.report.preventionActivities ?? undefined}
                />
                <Line
                  label="Yếu tố nguy cơ"
                  value={doc.report.riskFactors ?? undefined}
                />
                <Line
                  label="Kiến nghị"
                  value={doc.report.recommendations ?? undefined}
                />
              </Section>
            </>
          )}

          {doc.kind === "atp" && (
            <>
              <Section title="I. Cơ sở sản xuất kinh doanh">
                <Line
                  label="Tổng số cơ sở"
                  value={doc.report.totalBusinesses}
                />
                <Line label="Cơ sở mới" value={doc.report.newBusinesses} />
                <Line
                  label="Ngừng hoạt động"
                  value={doc.report.inactiveBusinesses}
                />
                <Line
                  label="Có giấy chứng nhận"
                  value={doc.report.businessesWithCertificate}
                />
              </Section>
              <Section title="II. Cấp phép">
                <Line label="Đăng ký công bố" value={doc.report.dkcbIssued} />
                <Line
                  label="Tự công bố"
                  value={doc.report.selfDeclarationsReceived}
                />
                <Line
                  label="Xác nhận quảng cáo"
                  value={doc.report.adRegistrationsIssued}
                />
                <Line
                  label="Giấy đủ điều kiện"
                  value={doc.report.eligibilityCertificatesIssued}
                />
                <Line label="CFS" value={doc.report.cfsIssued} />
                <Line
                  label="GCN xuất khẩu"
                  value={doc.report.exportCertificatesIssued}
                />
              </Section>
              <Section title="III. Thanh kiểm tra">
                <Line
                  label="Số kế hoạch"
                  value={doc.report.totalInspectionPlans}
                />
                <Line
                  label="Cơ sở được kiểm tra"
                  value={doc.report.businessesInspected}
                />
                <Line label="Vi phạm" value={doc.report.violationsFound} />
                <Line label="Số vụ xử phạt" value={doc.report.finesIssued} />
                <Line
                  label="Tổng tiền phạt (VND)"
                  value={doc.report.fineTotalAmount?.toLocaleString("vi-VN")}
                />
              </Section>
              <Section title="IV. Ngộ độc thực phẩm">
                <Line label="Số ca" value={doc.report.poisoningCaseCount} />
                <Line
                  label="Số vụ"
                  value={doc.report.poisoningIncidentCount}
                />
                <Line label="Số mắc" value={doc.report.totalAffected} />
                <Line label="Tử vong" value={doc.report.totalDeaths} />
              </Section>
              <Section title="V. Truyền thông - Đào tạo">
                <Line
                  label="Lớp tập huấn"
                  value={doc.report.trainingSessions}
                />
                <Line
                  label="Lượt tham dự"
                  value={doc.report.trainingParticipants}
                />
                <Line
                  label="Lượt truyền thông"
                  value={doc.report.mediaAppearances}
                />
                <Line label="Văn bản" value={doc.report.documentsIssued} />
              </Section>
              <Section title="VI. Đánh giá">
                <Line
                  label="Tổng quan"
                  value={doc.report.overview ?? undefined}
                />
                <Line
                  label="Kết quả đạt được"
                  value={doc.report.achievements ?? undefined}
                />
                <Line
                  label="Tồn tại, hạn chế"
                  value={doc.report.limitations ?? undefined}
                />
                <Line
                  label="Giải pháp"
                  value={doc.report.solutions ?? undefined}
                />
                <Line
                  label="Kế hoạch kỳ tới"
                  value={doc.report.nextPeriodPlan ?? undefined}
                />
              </Section>
            </>
          )}

          {doc.kind === "action-month" && (
            <>
              <Section title="I. Thông tin chung">
                <Line
                  label="Chủ đề"
                  value={doc.report.actionMonthTheme ?? undefined}
                />
                <Line
                  label="Thời gian triển khai"
                  value={doc.report.actionMonthDates ?? undefined}
                />
              </Section>
              <Section title="II. Truyền thông">
                <Line label="Bài viết" value={doc.report.mediaArticles} />
                <Line
                  label="Chương trình phát thanh/truyền hình"
                  value={doc.report.broadcastPrograms}
                />
                <Line
                  label="Buổi tuyên truyền"
                  value={doc.report.propagandaSessions}
                />
                <Line label="Lượt tham dự" value={doc.report.participants} />
                <Line
                  label="Áp phích phát hành"
                  value={doc.report.postersDistributed}
                />
                <Line
                  label="Tờ rơi phát hành"
                  value={doc.report.leafletsDistributed}
                />
              </Section>
              <Section title="III. Thanh kiểm tra">
                <Line
                  label="Cơ sở được kiểm tra"
                  value={doc.report.businessesInspected}
                />
                <Line label="Vi phạm" value={doc.report.violationsFound} />
                <Line label="Số vụ xử phạt" value={doc.report.finesIssued} />
                <Line
                  label="Tổng tiền phạt (VND)"
                  value={doc.report.fineAmount?.toLocaleString("vi-VN")}
                />
                <Line
                  label="Tự công bố mới"
                  value={doc.report.newSelfDeclarations}
                />
              </Section>
              <Section title="IV. Đánh giá">
                <Line
                  label="Kết quả nổi bật"
                  value={doc.report.achievements ?? undefined}
                />
                <Line
                  label="Tồn tại, hạn chế"
                  value={doc.report.limitations ?? undefined}
                />
                <Line
                  label="Bài học kinh nghiệm"
                  value={doc.report.lessonsLearned ?? undefined}
                />
                <Line
                  label="Kế hoạch tiếp theo"
                  value={doc.report.nextSteps ?? undefined}
                />
              </Section>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
