import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  type TableColumnsType,
} from "antd";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { RowActions } from "@/components/RowActions";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  ExportOutlined,
  EyeOutlined,
  WarningOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import { NdtpReportEditorModal } from "../components/NdtpReportEditorModal";
import { AtpWorkReportEditorModal } from "../components/AtpWorkReportEditorModal";
import { ActionMonthReportEditorModal } from "../components/ActionMonthReportEditorModal";
import ReportErrorNotificationsModal from "../components/ReportErrorNotificationsModal";
import { ReportDetailDrawer } from "../components/ReportDetailDrawer";
import {
  ReportDocumentViewModal,
  type ReportDocument,
} from "../components/ReportDocumentViewModal";
import {
  useNdtpReports,
  useAtpWorkReports,
  useActionMonthReports,
} from "../api/reportingQueries";
import {
  useCreateNdtpReport,
  useDeleteNdtpReport,
  useSubmitNdtpReport,
  useVerifyNdtpReport,
  useReturnNdtpReport,
  useCompleteNdtpReport,
  useReturnNdtpToDraft,
  useCreateAtpWorkReport,
  useDeleteAtpWorkReport,
  useSubmitAtpWorkReport,
  useVerifyAtpWorkReport,
  useReturnAtpWorkReport,
  useCompleteAtpWorkReport,
  useReturnAtpToDraft,
  useCreateActionMonthReport,
  useDeleteActionMonthReport,
  useSubmitActionMonthReport,
  useVerifyActionMonthReport,
  useReturnActionMonthReport,
  useCompleteActionMonthReport,
  useReturnAmrToDraft,
  useExportNdtpReports,
  useExportAtpWorkReports,
  useExportActionMonthReports,
  useDownloadNdtpReportPdf,
  useDownloadAtpWorkReportPdf,
  useDownloadActionMonthReportPdf,
} from "../api/reportingMutations";
import {
  REPORT_STATUS,
  REPORT_STATUS_CONFIG,
  REPORT_PERIOD_TYPE,
  REPORT_PERIOD_TYPE_CONFIG,
  type NdtpReport,
  type AtpWorkReport,
  type ActionMonthReport,
  type NdtpReportFilter,
  type AtpWorkReportFilter,
  type ActionMonthReportFilter,
  type ReportStatus,
} from "../types/reporting.types";
import { useTablePagination } from "@/hooks/useTablePagination";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));
const currentYear = new Date().getFullYear();

function StatusTag({ status }: { status: ReportStatus }) {
  const cfg = REPORT_STATUS_CONFIG[status];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

/** Phân biệt lỗi tải danh sách với trạng thái "không có dữ liệu". */
function ListErrorAlert({
  visible,
  onRetry,
}: {
  visible: boolean;
  onRetry: () => void;
}) {
  if (!visible) return null;
  return (
    <Alert
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
      message="Không thể tải danh sách báo cáo."
      action={
        <Button size="small" onClick={onRetry}>
          Thử lại
        </Button>
      }
    />
  );
}

function NdtpTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<NdtpReportFilter>({});
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const { data, isLoading, isError, refetch } = useNdtpReports({
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateNdtpReport();
  const deleteMut = useDeleteNdtpReport();
  const submitMut = useSubmitNdtpReport();
  const verifyMut = useVerifyNdtpReport();
  const returnMut = useReturnNdtpReport();
  const completeMut = useCompleteNdtpReport();
  const returnToDraftMut = useReturnNdtpToDraft();
  const exportMut = useExportNdtpReports();
  const downloadPdfMut = useDownloadNdtpReportPdf();

  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<NdtpReport | null>(null);
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [errorNotifReport, setErrorNotifReport] = useState<NdtpReport | null>(
    null,
  );
  const [docView, setDocView] = useState<ReportDocument | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<NdtpReport> | SorterResult<NdtpReport>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };

  const columns: TableColumnsType<NdtpReport> = [
    {
      title: "Kỳ báo cáo",
      key: "period",
      dataIndex: "periodYear",
      render: (_, r) => `Tháng ${r.periodMonth}/${r.periodYear}`,
      width: 140,
      sorter: true,
      sortOrder: sortOrderFor("periodYear"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: ReportStatus) => <StatusTag status={s} />,
    },
    {
      title: "Ca NĐ",
      dataIndex: "caseCount",
      width: 80,
      align: "right",
    },
    {
      title: "Vụ NĐ",
      dataIndex: "incidentCount",
      width: 80,
      align: "right",
    },
    {
      title: "Lần gửi",
      dataIndex: "submissionVersion",
      width: 80,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 120,
      sorter: true,
      sortOrder: sortOrderFor("creationTime"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          actions={[
            {
              key: "view",
              label: "Xem chi tiết",
              ariaLabel: "Xem chi tiết",
              icon: <EyeOutlined />,
              onClick: () => setDetailId(record.id),
            },
            {
              key: "doc",
              label: "Xem văn bản",
              ariaLabel: "Xem văn bản",
              icon: <FileTextOutlined />,
              onClick: () => setDocView({ kind: "ndtp", report: record }),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Edit"),
              onClick: () => setEditReport(record),
            },
            {
              key: "submit",
              label: "Gửi",
              icon: <SendOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Submit"),
              confirm: "Gửi báo cáo này?",
              onClick: () =>
                submitMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã gửi"),
                }),
            },
            {
              key: "verify",
              label: "Xác minh",
              icon: <CheckCircleOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Submitted ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Verify"),
              confirm: "Xác minh báo cáo này?",
              onClick: () =>
                verifyMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xác minh"),
                }),
            },
            {
              key: "return",
              label: "Trả lại",
              icon: <RollbackOutlined />,
              hidden:
                (record.status !== REPORT_STATUS.Submitted &&
                  record.status !== REPORT_STATUS.Verified) ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Return"),
              onClick: () => setReturnOpen(record.id),
            },
            {
              key: "complete",
              label: "Hoàn thành",
              icon: <FileDoneOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Verified ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Complete"),
              confirm: "Hoàn thành báo cáo này?",
              onClick: () =>
                completeMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã hoàn thành"),
                }),
            },
            {
              key: "return-to-draft",
              label: "Về nháp",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Returned ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Edit"),
              confirm: "Chuyển về nháp để sửa?",
              onClick: () =>
                returnToDraftMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã chuyển về nháp"),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.NdtpReports.Delete"),
              confirm: "Xóa báo cáo?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                }),
            },
            {
              key: "error-notif",
              label: "Sai sót",
              icon: <WarningOutlined />,
              hidden: record.status === REPORT_STATUS.Draft,
              onClick: () => setErrorNotifReport(record),
            },
            {
              key: "download-pdf",
              label: "Tải PDF",
              icon: <FilePdfOutlined />,
              hidden:
                record.status === REPORT_STATUS.Draft ||
                record.status === REPORT_STATUS.Returned,
              onClick: () =>
                downloadPdfMut.mutate(record.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
          ]}
          overflowAriaLabel={`Thao tác Tháng ${record.periodMonth}/${record.periodYear}`}
        />
      ),
    },
  ];

  return (
    <>
      <NdtpReportEditorModal
        report={editReport}
        onClose={() => setEditReport(null)}
      />
      <ReportDetailDrawer
        kind="ndtp"
        reportId={detailId}
        onClose={() => setDetailId(null)}
      />
      <ReportErrorNotificationsModal
        kind="ndtp"
        reportId={errorNotifReport?.id ?? null}
        reportStatus={errorNotifReport?.status ?? null}
        open={errorNotifReport !== null}
        onClose={() => setErrorNotifReport(null)}
        canReport={hasPermission("FoodSafe.Reporting.NdtpReports.Submit")}
        canRespond={hasPermission("FoodSafe.Reporting.NdtpReports.Verify")}
      />
      <ReportDocumentViewModal
        document={docView}
        onClose={() => setDocView(null)}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          options={Object.entries(REPORT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <InputNumber<number>
          placeholder="Năm"
          min={2020}
          max={2100}
          style={{ width: 100 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, periodYear: v ?? undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Tháng"
          allowClear
          style={{ width: 110 }}
          options={MONTHS}
          onChange={(v) => {
            setFilter((f) => ({ ...f, periodMonth: v ?? undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(
              { ...filter, sorting },
              {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: (error) => message.error(extractApiError(error)),
              },
            )
          }
        >
          Xuất Excel
        </Button>
        {hasPermission("FoodSafe.Reporting.NdtpReports.Create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                periodYear: currentYear,
                periodMonth: new Date().getMonth() + 1,
              });
              setCreateOpen(true);
            }}
          >
            Tạo báo cáo
          </Button>
        )}
      </Space>
      <ListErrorAlert visible={isError} onRetry={() => void refetch()} />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={pagination.buildConfig(data?.totalCount)}
        onChange={(_, __, sorter) => handleSort(sorter)}
        onRow={(record) => ({
          onDoubleClick: () => setDocView({ kind: "ndtp", report: record }),
          style: { cursor: "pointer" },
        })}
      />
      <Modal
        title="Tạo báo cáo NĐTP"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        destroyOnHidden
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            createMut.mutate(values, {
              onSuccess: () => {
                message.success("Đã tạo");
                setCreateOpen(false);
              },
            });
          }}
        >
          <Form.Item
            name="periodYear"
            label="Năm"
            rules={[{ required: true, message: "Vui lòng nhập năm" }]}
          >
            <InputNumber min={2020} max={2100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="periodMonth"
            label="Tháng"
            rules={[{ required: true, message: "Vui lòng chọn tháng" }]}
          >
            <Select options={MONTHS} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Trả lại báo cáo"
        open={returnOpen !== null}
        onCancel={() => setReturnOpen(null)}
        destroyOnHidden
        onOk={() => returnForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={returnMut.isPending}
      >
        <Form
          form={returnForm}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            if (returnOpen) {
              returnMut.mutate(
                { id: returnOpen, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã trả lại");
                    setReturnOpen(null);
                  },
                },
              );
            }
          }}
        >
          <Form.Item
            name="returnReason"
            label="Lý do trả lại"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function AtpWorkTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<AtpWorkReportFilter>({});
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const { data, isLoading, isError, refetch } = useAtpWorkReports({
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateAtpWorkReport();
  const deleteMut = useDeleteAtpWorkReport();
  const submitMut = useSubmitAtpWorkReport();
  const verifyMut = useVerifyAtpWorkReport();
  const returnMut = useReturnAtpWorkReport();
  const completeMut = useCompleteAtpWorkReport();
  const returnToDraftMut = useReturnAtpToDraft();
  const exportMut = useExportAtpWorkReports();
  const downloadPdfMut = useDownloadAtpWorkReportPdf();

  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<AtpWorkReport | null>(null);
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [errorNotifReport, setErrorNotifReport] =
    useState<AtpWorkReport | null>(null);
  const [docView, setDocView] = useState<ReportDocument | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<AtpWorkReport> | SorterResult<AtpWorkReport>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };

  const columns: TableColumnsType<AtpWorkReport> = [
    {
      title: "Kỳ báo cáo",
      key: "period",
      dataIndex: "periodYear",
      render: (_, r) => {
        const typeLbl = REPORT_PERIOD_TYPE_CONFIG[r.periodType]?.label ?? "";
        const half = r.periodHalf ? ` (Kỳ ${r.periodHalf})` : "";
        return `${typeLbl} ${r.periodYear}${half}`;
      },
      width: 180,
      sorter: true,
      sortOrder: sortOrderFor("periodYear"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: ReportStatus) => <StatusTag status={s} />,
    },
    {
      title: "Cơ sở",
      dataIndex: "totalBusinesses",
      width: 80,
      align: "right",
    },
    {
      title: "Thanh tra",
      dataIndex: "businessesInspected",
      width: 90,
      align: "right",
    },
    {
      title: "Lần gửi",
      dataIndex: "submissionVersion",
      width: 80,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 120,
      sorter: true,
      sortOrder: sortOrderFor("creationTime"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          actions={[
            {
              key: "view",
              label: "Xem chi tiết",
              ariaLabel: "Xem chi tiết",
              icon: <EyeOutlined />,
              onClick: () => setDetailId(record.id),
            },
            {
              key: "doc",
              label: "Xem văn bản",
              ariaLabel: "Xem văn bản",
              icon: <FileTextOutlined />,
              onClick: () => setDocView({ kind: "atp", report: record }),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Edit"),
              onClick: () => setEditReport(record),
            },
            {
              key: "submit",
              label: "Gửi",
              icon: <SendOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Submit"),
              confirm: "Gửi báo cáo này?",
              onClick: () =>
                submitMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã gửi"),
                }),
            },
            {
              key: "verify",
              label: "Xác minh",
              icon: <CheckCircleOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Submitted ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Verify"),
              confirm: "Xác minh báo cáo này?",
              onClick: () =>
                verifyMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xác minh"),
                }),
            },
            {
              key: "return",
              label: "Trả lại",
              icon: <RollbackOutlined />,
              hidden:
                (record.status !== REPORT_STATUS.Submitted &&
                  record.status !== REPORT_STATUS.Verified) ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Return"),
              onClick: () => setReturnOpen(record.id),
            },
            {
              key: "complete",
              label: "Hoàn thành",
              icon: <FileDoneOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Verified ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Complete"),
              confirm: "Hoàn thành báo cáo này?",
              onClick: () =>
                completeMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã hoàn thành"),
                }),
            },
            {
              key: "return-to-draft",
              label: "Về nháp",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Returned ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Edit"),
              confirm: "Chuyển về nháp để sửa?",
              onClick: () =>
                returnToDraftMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã chuyển về nháp"),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.AtpWorkReports.Delete"),
              confirm: "Xóa báo cáo?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                }),
            },
            {
              key: "error-notif",
              label: "Sai sót",
              icon: <WarningOutlined />,
              hidden: record.status === REPORT_STATUS.Draft,
              onClick: () => setErrorNotifReport(record),
            },
            {
              key: "download-pdf",
              label: "Tải PDF",
              icon: <FilePdfOutlined />,
              hidden:
                record.status === REPORT_STATUS.Draft ||
                record.status === REPORT_STATUS.Returned,
              onClick: () =>
                downloadPdfMut.mutate(record.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
          ]}
          overflowAriaLabel={`Thao tác ${REPORT_PERIOD_TYPE_CONFIG[record.periodType]?.label ?? ""} ${record.periodYear}${record.periodHalf ? ` (Kỳ ${record.periodHalf})` : ""}`}
        />
      ),
    },
  ];

  return (
    <>
      <AtpWorkReportEditorModal
        report={editReport}
        onClose={() => setEditReport(null)}
      />
      <ReportDetailDrawer
        kind="atp"
        reportId={detailId}
        onClose={() => setDetailId(null)}
      />
      <ReportErrorNotificationsModal
        kind="atp"
        reportId={errorNotifReport?.id ?? null}
        reportStatus={errorNotifReport?.status ?? null}
        open={errorNotifReport !== null}
        onClose={() => setErrorNotifReport(null)}
        canReport={hasPermission("FoodSafe.Reporting.AtpWorkReports.Submit")}
        canRespond={hasPermission("FoodSafe.Reporting.AtpWorkReports.Verify")}
      />
      <ReportDocumentViewModal
        document={docView}
        onClose={() => setDocView(null)}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          options={Object.entries(REPORT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Loại kỳ"
          allowClear
          style={{ width: 120 }}
          options={Object.entries(REPORT_PERIOD_TYPE_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, periodType: v }));
            pagination.resetToFirstPage();
          }}
        />
        <InputNumber<number>
          placeholder="Năm"
          min={2020}
          max={2100}
          style={{ width: 100 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, periodYear: v ?? undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(
              { ...filter, sorting },
              {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: (error) => message.error(extractApiError(error)),
              },
            )
          }
        >
          Xuất Excel
        </Button>
        {hasPermission("FoodSafe.Reporting.AtpWorkReports.Create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                periodType: REPORT_PERIOD_TYPE.HalfYear,
                periodYear: currentYear,
                periodHalf: 1,
              });
              setCreateOpen(true);
            }}
          >
            Tạo báo cáo
          </Button>
        )}
      </Space>
      <ListErrorAlert visible={isError} onRetry={() => void refetch()} />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={pagination.buildConfig(data?.totalCount)}
        onChange={(_, __, sorter) => handleSort(sorter)}
        onRow={(record) => ({
          onDoubleClick: () => setDocView({ kind: "atp", report: record }),
          style: { cursor: "pointer" },
        })}
      />
      <Modal
        title="Tạo báo cáo công tác ATTP"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        destroyOnHidden
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            createMut.mutate(values, {
              onSuccess: () => {
                message.success("Đã tạo");
                setCreateOpen(false);
              },
            });
          }}
        >
          <Form.Item
            name="periodType"
            label="Loại kỳ"
            rules={[{ required: true, message: "Vui lòng chọn loại kỳ" }]}
          >
            <Select
              options={Object.entries(REPORT_PERIOD_TYPE_CONFIG).map(
                ([k, v]) => ({ value: Number(k), label: v.label }),
              )}
            />
          </Form.Item>
          <Form.Item
            name="periodYear"
            label="Năm"
            rules={[{ required: true, message: "Vui lòng nhập năm" }]}
          >
            <InputNumber min={2020} max={2100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.periodType !== cur.periodType}
          >
            {({ getFieldValue }) =>
              getFieldValue("periodType") === REPORT_PERIOD_TYPE.HalfYear ? (
                <Form.Item
                  name="periodHalf"
                  label="Kỳ"
                  rules={[
                    { required: true, message: "Vui lòng chọn kỳ báo cáo" },
                  ]}
                >
                  <Select
                    options={[
                      { value: 1, label: "6 tháng đầu" },
                      { value: 2, label: "6 tháng cuối" },
                    ]}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Trả lại báo cáo"
        open={returnOpen !== null}
        onCancel={() => setReturnOpen(null)}
        destroyOnHidden
        onOk={() => returnForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={returnMut.isPending}
      >
        <Form
          form={returnForm}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            if (returnOpen) {
              returnMut.mutate(
                { id: returnOpen, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã trả lại");
                    setReturnOpen(null);
                  },
                },
              );
            }
          }}
        >
          <Form.Item
            name="returnReason"
            label="Lý do trả lại"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function ActionMonthTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<ActionMonthReportFilter>({});
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const { data, isLoading, isError, refetch } = useActionMonthReports({
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateActionMonthReport();
  const deleteMut = useDeleteActionMonthReport();
  const submitMut = useSubmitActionMonthReport();
  const verifyMut = useVerifyActionMonthReport();
  const returnMut = useReturnActionMonthReport();
  const completeMut = useCompleteActionMonthReport();
  const returnToDraftMut = useReturnAmrToDraft();
  const exportMut = useExportActionMonthReports();
  const downloadPdfMut = useDownloadActionMonthReportPdf();

  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<ActionMonthReport | null>(null);
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [errorNotifReport, setErrorNotifReport] =
    useState<ActionMonthReport | null>(null);
  const [docView, setDocView] = useState<ReportDocument | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<ActionMonthReport> | SorterResult<ActionMonthReport>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };

  const columns: TableColumnsType<ActionMonthReport> = [
    {
      title: "Năm",
      dataIndex: "periodYear",
      width: 80,
      sorter: true,
      sortOrder: sortOrderFor("periodYear"),
    },
    {
      title: "Chủ đề",
      dataIndex: "actionMonthTheme",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: ReportStatus) => <StatusTag status={s} />,
    },
    {
      title: "Cơ sở TT",
      dataIndex: "businessesInspected",
      width: 90,
      align: "right",
    },
    {
      title: "Vi phạm",
      dataIndex: "violationsFound",
      width: 90,
      align: "right",
    },
    {
      title: "Lần gửi",
      dataIndex: "submissionVersion",
      width: 80,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 120,
      sorter: true,
      sortOrder: sortOrderFor("creationTime"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          actions={[
            {
              key: "view",
              label: "Xem chi tiết",
              ariaLabel: "Xem chi tiết",
              icon: <EyeOutlined />,
              onClick: () => setDetailId(record.id),
            },
            {
              key: "doc",
              label: "Xem văn bản",
              ariaLabel: "Xem văn bản",
              icon: <FileTextOutlined />,
              onClick: () =>
                setDocView({ kind: "action-month", report: record }),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Edit"),
              onClick: () => setEditReport(record),
            },
            {
              key: "submit",
              label: "Gửi",
              icon: <SendOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Submit"),
              confirm: "Gửi báo cáo này?",
              onClick: () =>
                submitMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã gửi"),
                }),
            },
            {
              key: "verify",
              label: "Xác minh",
              icon: <CheckCircleOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Submitted ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Verify"),
              confirm: "Xác minh báo cáo này?",
              onClick: () =>
                verifyMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xác minh"),
                }),
            },
            {
              key: "return",
              label: "Trả lại",
              icon: <RollbackOutlined />,
              hidden:
                (record.status !== REPORT_STATUS.Submitted &&
                  record.status !== REPORT_STATUS.Verified) ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Return"),
              onClick: () => setReturnOpen(record.id),
            },
            {
              key: "complete",
              label: "Hoàn thành",
              icon: <FileDoneOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Verified ||
                !hasPermission(
                  "FoodSafe.Reporting.ActionMonthReports.Complete",
                ),
              confirm: "Hoàn thành báo cáo này?",
              onClick: () =>
                completeMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã hoàn thành"),
                }),
            },
            {
              key: "return-to-draft",
              label: "Về nháp",
              icon: <EditOutlined />,
              hidden:
                record.status !== REPORT_STATUS.Returned ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Edit"),
              confirm: "Chuyển về nháp để sửa?",
              onClick: () =>
                returnToDraftMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã chuyển về nháp"),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                record.status !== REPORT_STATUS.Draft ||
                !hasPermission("FoodSafe.Reporting.ActionMonthReports.Delete"),
              confirm: "Xóa báo cáo?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                }),
            },
            {
              key: "error-notif",
              label: "Sai sót",
              icon: <WarningOutlined />,
              hidden: record.status === REPORT_STATUS.Draft,
              onClick: () => setErrorNotifReport(record),
            },
            {
              key: "download-pdf",
              label: "Tải PDF",
              icon: <FilePdfOutlined />,
              hidden:
                record.status === REPORT_STATUS.Draft ||
                record.status === REPORT_STATUS.Returned,
              onClick: () =>
                downloadPdfMut.mutate(record.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
          ]}
          overflowAriaLabel={`Thao tác ${record.periodYear}`}
        />
      ),
    },
  ];

  return (
    <>
      <ActionMonthReportEditorModal
        report={editReport}
        onClose={() => setEditReport(null)}
      />
      <ReportDetailDrawer
        kind="amr"
        reportId={detailId}
        onClose={() => setDetailId(null)}
      />
      <ReportErrorNotificationsModal
        kind="amr"
        reportId={errorNotifReport?.id ?? null}
        reportStatus={errorNotifReport?.status ?? null}
        open={errorNotifReport !== null}
        onClose={() => setErrorNotifReport(null)}
        canReport={hasPermission(
          "FoodSafe.Reporting.ActionMonthReports.Submit",
        )}
        canRespond={hasPermission(
          "FoodSafe.Reporting.ActionMonthReports.Verify",
        )}
      />
      <ReportDocumentViewModal
        document={docView}
        onClose={() => setDocView(null)}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          options={Object.entries(REPORT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        <InputNumber<number>
          placeholder="Năm"
          min={2020}
          max={2100}
          style={{ width: 100 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, periodYear: v ?? undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(
              { ...filter, sorting },
              {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: (error) => message.error(extractApiError(error)),
              },
            )
          }
        >
          Xuất Excel
        </Button>
        {hasPermission("FoodSafe.Reporting.ActionMonthReports.Create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({ periodYear: currentYear });
              setCreateOpen(true);
            }}
          >
            Tạo báo cáo
          </Button>
        )}
      </Space>
      <ListErrorAlert visible={isError} onRetry={() => void refetch()} />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={pagination.buildConfig(data?.totalCount)}
        onChange={(_, __, sorter) => handleSort(sorter)}
        onRow={(record) => ({
          onDoubleClick: () =>
            setDocView({ kind: "action-month", report: record }),
          style: { cursor: "pointer" },
        })}
      />
      <Modal
        title="Tạo báo cáo Tháng hành động"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        destroyOnHidden
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            createMut.mutate(values, {
              onSuccess: () => {
                message.success("Đã tạo");
                setCreateOpen(false);
              },
            });
          }}
        >
          <Form.Item
            name="periodYear"
            label="Năm"
            rules={[{ required: true, message: "Vui lòng nhập năm" }]}
          >
            <InputNumber min={2020} max={2100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="actionMonthTheme" label="Chủ đề">
            <Input />
          </Form.Item>
          <Form.Item
            name="actionMonthDates"
            label="Thời gian"
            rules={[
              {
                pattern:
                  /^\s*\d{1,2}\/\d{1,2}\/\d{4}\s*[-–]\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/,
                message: "Định dạng dd/MM/yyyy - dd/MM/yyyy",
              },
            ]}
          >
            <Input placeholder="VD: 15/04/2026 - 15/05/2026" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Trả lại báo cáo"
        open={returnOpen !== null}
        onCancel={() => setReturnOpen(null)}
        destroyOnHidden
        onOk={() => returnForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={returnMut.isPending}
      >
        <Form
          form={returnForm}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            if (returnOpen) {
              returnMut.mutate(
                { id: returnOpen, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã trả lại");
                    setReturnOpen(null);
                  },
                },
              );
            }
          }}
        >
          <Form.Item
            name="returnReason"
            label="Lý do trả lại"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function ReportingPage() {
  // Route cho vào khi có quyền xem BẤT KỲ loại báo cáo nào (ROUTE_PERMISSIONS.
  // reporting) — chỉ hiện tab tương ứng quyền, tránh tab mặc định gọi API bị
  // 403 với người chỉ có quyền một loại (UIA-006).
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const tabs = [
    ...(hasPermission("FoodSafe.Reporting.NdtpReports.View")
      ? [{ key: "ndtp", label: "Báo cáo NĐTP", children: <NdtpTab /> }]
      : []),
    ...(hasPermission("FoodSafe.Reporting.AtpWorkReports.View")
      ? [{ key: "atp-work", label: "Công tác ATTP", children: <AtpWorkTab /> }]
      : []),
    ...(hasPermission("FoodSafe.Reporting.ActionMonthReports.View")
      ? [
          {
            key: "action-month",
            label: "Tháng hành động",
            children: <ActionMonthTab />,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <Tabs items={tabs} />
    </Card>
  );
}
