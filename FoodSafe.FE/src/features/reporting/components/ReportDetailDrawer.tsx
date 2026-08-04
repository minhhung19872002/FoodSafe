import type { ReactNode } from "react";
import { Alert, Button, Descriptions, Drawer, Empty, Spin, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import {
  useActionMonthReport,
  useAtpWorkReport,
  useNdtpReport,
  type ReportKind,
} from "../api/reportingQueries";
import {
  REPORT_PERIOD_TYPE,
  REPORT_PERIOD_TYPE_CONFIG,
  REPORT_STATUS_CONFIG,
  type ActionMonthReport,
  type AtpWorkReport,
  type NdtpReport,
} from "../types/reporting.types";

interface Props {
  kind: ReportKind;
  reportId: string | null;
  onClose: () => void;
}

interface ReportByKind {
  ndtp: NdtpReport;
  atp: AtpWorkReport;
  amr: ActionMonthReport;
}

/** Union phân biệt theo `kind` để một drawer phục vụ cả ba loại báo cáo. */
type ReportDetail = {
  [K in ReportKind]: { kind: K; report: ReportByKind[K] };
}[ReportKind];

type AnyReport = ReportByKind[ReportKind];

interface DetailRow {
  label: string;
  value: ReactNode;
  span?: number;
}

interface DetailSection {
  title: string;
  rows: DetailRow[];
}

const DASH = "—";

const REPORT_KIND_TITLE: Record<ReportKind, string> = {
  ndtp: "Chi tiết báo cáo NĐTP",
  atp: "Chi tiết báo cáo công tác ATTP",
  amr: "Chi tiết báo cáo Tháng hành động",
};

function short(value: string | null): ReactNode {
  return value?.trim() ? value : DASH;
}

function paragraph(value: string | null): ReactNode {
  return value?.trim() ? (
    <span style={{ whiteSpace: "pre-wrap" }}>{value}</span>
  ) : (
    DASH
  );
}

function dateTime(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : DASH;
}

function amount(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function atpPeriodLabel(report: AtpWorkReport): string {
  const typeLabel = REPORT_PERIOD_TYPE_CONFIG[report.periodType]?.label ?? DASH;
  if (report.periodType !== REPORT_PERIOD_TYPE.HalfYear) {
    return `${typeLabel} ${report.periodYear}`;
  }
  return `${typeLabel} ${report.periodYear} (${report.periodHalf === 2 ? "6 tháng cuối" : "6 tháng đầu"})`;
}

/** Mỗi loại báo cáo tự khai báo phần số liệu riêng; phần quy trình dùng chung. */
const REPORT_DETAIL_STRATEGY: {
  [K in ReportKind]: (report: ReportByKind[K]) => DetailSection[];
} = {
  ndtp: (report) => [
    {
      title: "Thông tin chung",
      rows: [
        {
          label: "Kỳ báo cáo",
          value: `Tháng ${report.periodMonth}/${report.periodYear}`,
        },
        { label: "Năm", value: report.periodYear },
      ],
    },
    {
      title: "Ca ngộ độc nhỏ lẻ",
      rows: [
        { label: "Số ca", value: report.caseCount },
        { label: "Số người mắc", value: report.caseAffected },
        { label: "Số nhập viện", value: report.caseHospitalized },
        { label: "Số tử vong", value: report.caseDeaths },
      ],
    },
    {
      title: "Vụ ngộ độc",
      rows: [
        { label: "Số vụ", value: report.incidentCount },
        { label: "Số người mắc", value: report.incidentAffected },
        { label: "Số nhập viện", value: report.incidentHospitalized },
        { label: "Số tử vong", value: report.incidentDeaths },
        {
          label: "Số vụ lớn (≥30 người mắc)",
          value: report.largeScaleIncidentCount,
        },
      ],
    },
    {
      title: "Nội dung",
      rows: [
        {
          label: "Hoạt động phòng chống",
          value: paragraph(report.preventionActivities),
          span: 2,
        },
        {
          label: "Yếu tố nguy cơ",
          value: paragraph(report.riskFactors),
          span: 2,
        },
        {
          label: "Kiến nghị",
          value: paragraph(report.recommendations),
          span: 2,
        },
      ],
    },
  ],
  atp: (report) => [
    {
      title: "Thông tin chung",
      rows: [
        { label: "Kỳ báo cáo", value: atpPeriodLabel(report) },
        {
          label: "Loại kỳ",
          value: REPORT_PERIOD_TYPE_CONFIG[report.periodType]?.label ?? DASH,
        },
        { label: "Năm", value: report.periodYear },
        { label: "Kỳ", value: report.periodHalf ?? DASH },
      ],
    },
    {
      title: "Cơ sở sản xuất kinh doanh",
      rows: [
        { label: "Tổng số cơ sở", value: report.totalBusinesses },
        { label: "Cơ sở mới", value: report.newBusinesses },
        { label: "Ngừng hoạt động", value: report.inactiveBusinesses },
        {
          label: "Có giấy chứng nhận",
          value: report.businessesWithCertificate,
        },
      ],
    },
    {
      title: "Cấp phép",
      rows: [
        { label: "Đăng ký công bố", value: report.dkcbIssued },
        { label: "Tự công bố", value: report.selfDeclarationsReceived },
        { label: "Xác nhận quảng cáo", value: report.adRegistrationsIssued },
        {
          label: "Giấy đủ điều kiện",
          value: report.eligibilityCertificatesIssued,
        },
        { label: "CFS", value: report.cfsIssued },
        { label: "GCN xuất khẩu", value: report.exportCertificatesIssued },
      ],
    },
    {
      title: "Thanh kiểm tra",
      rows: [
        { label: "Số kế hoạch", value: report.totalInspectionPlans },
        { label: "Cơ sở được kiểm tra", value: report.businessesInspected },
        { label: "Vi phạm", value: report.violationsFound },
        { label: "Số vụ xử phạt", value: report.finesIssued },
        { label: "Tổng tiền phạt", value: amount(report.fineTotalAmount) },
      ],
    },
    {
      title: "Ngộ độc thực phẩm",
      rows: [
        { label: "Số ca", value: report.poisoningCaseCount },
        { label: "Số vụ", value: report.poisoningIncidentCount },
        { label: "Số mắc", value: report.totalAffected },
        { label: "Tử vong", value: report.totalDeaths },
      ],
    },
    {
      title: "Truyền thông - Đào tạo",
      rows: [
        { label: "Lớp tập huấn", value: report.trainingSessions },
        { label: "Lượt tham dự", value: report.trainingParticipants },
        { label: "Lượt truyền thông", value: report.mediaAppearances },
        { label: "Văn bản ban hành", value: report.documentsIssued },
      ],
    },
    {
      title: "Đánh giá",
      rows: [
        { label: "Tổng quan", value: paragraph(report.overview), span: 2 },
        {
          label: "Kết quả đạt được",
          value: paragraph(report.achievements),
          span: 2,
        },
        {
          label: "Tồn tại, hạn chế",
          value: paragraph(report.limitations),
          span: 2,
        },
        { label: "Giải pháp", value: paragraph(report.solutions), span: 2 },
        {
          label: "Kế hoạch kỳ tới",
          value: paragraph(report.nextPeriodPlan),
          span: 2,
        },
      ],
    },
  ],
  amr: (report) => [
    {
      title: "Thông tin chung",
      rows: [
        { label: "Năm", value: report.periodYear },
        { label: "Chủ đề", value: short(report.actionMonthTheme) },
        {
          label: "Thời gian triển khai",
          value: short(report.actionMonthDates),
          span: 2,
        },
      ],
    },
    {
      title: "Truyền thông",
      rows: [
        { label: "Bài viết", value: report.mediaArticles },
        {
          label: "Chương trình phát thanh/truyền hình",
          value: report.broadcastPrograms,
        },
        { label: "Buổi tuyên truyền", value: report.propagandaSessions },
        { label: "Lượt tham dự", value: report.participants },
        { label: "Áp phích phát hành", value: report.postersDistributed },
        { label: "Tờ rơi phát hành", value: report.leafletsDistributed },
      ],
    },
    {
      title: "Thanh kiểm tra",
      rows: [
        { label: "Cơ sở được kiểm tra", value: report.businessesInspected },
        { label: "Vi phạm", value: report.violationsFound },
        { label: "Số vụ xử phạt", value: report.finesIssued },
        { label: "Tổng tiền phạt", value: amount(report.fineAmount) },
        { label: "Tự công bố mới", value: report.newSelfDeclarations },
      ],
    },
    {
      title: "Đánh giá",
      rows: [
        {
          label: "Kết quả nổi bật",
          value: paragraph(report.achievements),
          span: 2,
        },
        {
          label: "Tồn tại, hạn chế",
          value: paragraph(report.limitations),
          span: 2,
        },
        {
          label: "Bài học kinh nghiệm",
          value: paragraph(report.lessonsLearned),
          span: 2,
        },
        {
          label: "Kế hoạch tiếp theo",
          value: paragraph(report.nextSteps),
          span: 2,
        },
      ],
    },
  ],
};

function reportSections(detail: ReportDetail): DetailSection[] {
  switch (detail.kind) {
    case "ndtp":
      return REPORT_DETAIL_STRATEGY.ndtp(detail.report);
    case "atp":
      return REPORT_DETAIL_STRATEGY.atp(detail.report);
    case "amr":
      return REPORT_DETAIL_STRATEGY.amr(detail.report);
  }
}

/** Các trường quy trình/audit chung cho cả ba loại báo cáo. */
function workflowSection(report: AnyReport): DetailSection {
  const statusCfg = REPORT_STATUS_CONFIG[report.status];
  return {
    title: "Quy trình & mốc thời gian",
    rows: [
      {
        label: "Trạng thái",
        value: <Tag color={statusCfg.color}>{statusCfg.label}</Tag>,
      },
      { label: "Lần gửi", value: report.submissionVersion },
      {
        label: "Người gửi",
        value: report.submittedByName ?? short(report.submittedById),
      },
      { label: "Thời điểm gửi", value: dateTime(report.submittedAt) },
      {
        label: "Người xác minh",
        value: report.verifiedByName ?? short(report.verifiedById),
      },
      { label: "Thời điểm xác minh", value: dateTime(report.verifiedAt) },
      {
        label: "Người trả lại",
        value: report.returnedByName ?? short(report.returnedById),
      },
      { label: "Thời điểm trả lại", value: dateTime(report.returnedAt) },
      {
        label: "Lý do trả lại",
        value: paragraph(report.returnReason),
        span: 2,
      },
      {
        label: "Người hoàn thành",
        value: report.completedByName ?? short(report.completedById),
      },
      { label: "Thời điểm hoàn thành", value: dateTime(report.completedAt) },
      { label: "Ngày tạo", value: dateTime(report.creationTime) },
      {
        label: "Đơn vị báo cáo",
        value: report.organizationName ?? report.organizationId,
      },
      { label: "Ghi chú", value: paragraph(report.notes), span: 2 },
      { label: "Mã báo cáo", value: report.id, span: 2 },
      ...(report.submissionHash
        ? [
            {
              label: "SHA-256",
              value: (
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    wordBreak: "break-all" as const,
                    color: "var(--ant-color-text-secondary, #888)",
                  }}
                  title="Hash SHA-256 của nội dung tại thời điểm gửi — bằng chứng bất biến (STT-33)"
                >
                  {report.submissionHash}
                </span>
              ),
              span: 2 as const,
            },
          ]
        : []),
    ],
  };
}

function pickDetail(
  kind: ReportKind,
  ndtp: NdtpReport | undefined,
  atp: AtpWorkReport | undefined,
  amr: ActionMonthReport | undefined,
): ReportDetail | null {
  if (kind === "ndtp") return ndtp ? { kind: "ndtp", report: ndtp } : null;
  if (kind === "atp") return atp ? { kind: "atp", report: atp } : null;
  return amr ? { kind: "amr", report: amr } : null;
}

function ReportDetailView({ detail }: { detail: ReportDetail }) {
  const sections = [...reportSections(detail), workflowSection(detail.report)];
  return (
    <>
      {sections.map((section) => (
        <Descriptions
          key={section.title}
          title={section.title}
          column={2}
          size="small"
          bordered
          style={{ marginBottom: 16 }}
        >
          {section.rows.map((row) => (
            <Descriptions.Item
              key={row.label}
              label={row.label}
              span={row.span}
            >
              {row.value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      ))}
    </>
  );
}

export function ReportDetailDrawer({ kind, reportId, onClose }: Props) {
  const idFor = (target: ReportKind) =>
    kind === target ? (reportId ?? "") : "";
  const ndtp = useNdtpReport(idFor("ndtp"));
  const atp = useAtpWorkReport(idFor("atp"));
  const amr = useActionMonthReport(idFor("amr"));

  const query = kind === "ndtp" ? ndtp : kind === "atp" ? atp : amr;
  const notFound =
    axios.isAxiosError(query.error) && query.error.response?.status === 404;

  const handleRetry = () => {
    if (kind === "ndtp") void ndtp.refetch();
    else if (kind === "atp") void atp.refetch();
    else void amr.refetch();
  };

  const detail = pickDetail(kind, ndtp.data, atp.data, amr.data);

  return (
    <Drawer
      title={REPORT_KIND_TITLE[kind]}
      open={reportId !== null}
      onClose={onClose}
      width={880}
      destroyOnHidden
    >
      {query.isLoading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      )}
      {query.isError && notFound && (
        <Empty description="Không tìm thấy báo cáo. Báo cáo có thể đã bị xóa." />
      )}
      {query.isError && !notFound && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải chi tiết báo cáo."
          description={
            <Button size="small" onClick={handleRetry}>
              Thử lại
            </Button>
          }
        />
      )}
      {!query.isError && detail && <ReportDetailView detail={detail} />}
    </Drawer>
  );
}
