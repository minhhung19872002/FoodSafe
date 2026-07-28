import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  type TableColumnsType,
} from "antd";
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
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

const PAGE_SIZE = 15;
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));
const currentYear = new Date().getFullYear();

function StatusTag({ status }: { status: ReportStatus }) {
  const cfg = REPORT_STATUS_CONFIG[status];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

function NdtpTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<NdtpReportFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useNdtpReports(filter);
  const createMut = useCreateNdtpReport();
  const deleteMut = useDeleteNdtpReport();
  const submitMut = useSubmitNdtpReport();
  const verifyMut = useVerifyNdtpReport();
  const returnMut = useReturnNdtpReport();
  const completeMut = useCompleteNdtpReport();
  const returnToDraftMut = useReturnNdtpToDraft();
  const exportMut = useExportNdtpReports();

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

  const columns: TableColumnsType<NdtpReport> = [
    {
      title: "Kỳ báo cáo",
      key: "period",
      render: (_, r) => `Tháng ${r.periodMonth}/${r.periodYear}`,
      width: 140,
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
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            aria-label="Xem chi tiết"
            onClick={() => setDetailId(record.id)}
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            aria-label="Xem văn bản"
            onClick={() => setDocView({ kind: "ndtp", report: record })}
          />
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Edit") && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditReport(record)}
              >
                Sửa
              </Button>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Submit") && (
              <Popconfirm
                title="Gửi báo cáo này?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() =>
                  submitMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã gửi"),
                  })
                }
              >
                <Button size="small" icon={<SendOutlined />}>
                  Gửi
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Submitted &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Verify") && (
              <Popconfirm
                title="Xác minh báo cáo này?"
                okText="Xác minh"
                cancelText="Hủy"
                onConfirm={() =>
                  verifyMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xác minh"),
                  })
                }
              >
                <Button size="small" icon={<CheckCircleOutlined />}>
                  Xác minh
                </Button>
              </Popconfirm>
            )}
          {(record.status === REPORT_STATUS.Submitted ||
            record.status === REPORT_STATUS.Verified) &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Return") && (
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => setReturnOpen(record.id)}
              >
                Trả lại
              </Button>
            )}
          {record.status === REPORT_STATUS.Verified &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Complete") && (
              <Popconfirm
                title="Hoàn thành báo cáo này?"
                okText="Hoàn thành"
                cancelText="Hủy"
                onConfirm={() =>
                  completeMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã hoàn thành"),
                  })
                }
              >
                <Button size="small" icon={<FileDoneOutlined />}>
                  Hoàn thành
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Returned &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Edit") && (
              <Popconfirm
                title="Chuyển về nháp để sửa?"
                okText="Chuyển"
                cancelText="Hủy"
                onConfirm={() =>
                  returnToDraftMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã chuyển về nháp"),
                  })
                }
              >
                <Button size="small" icon={<EditOutlined />}>
                  Về nháp
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.NdtpReports.Delete") && (
              <Popconfirm
                title="Xóa báo cáo?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() =>
                  deleteMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xóa"),
                  })
                }
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          {record.status !== REPORT_STATUS.Draft && (
            <Button
              size="small"
              icon={<WarningOutlined />}
              onClick={() => setErrorNotifReport(record)}
            >
              Sai sót
            </Button>
          )}
        </Space>
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
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        <InputNumber<number>
          placeholder="Năm"
          style={{ width: 100 }}
          onChange={(v) =>
            setFilter((f) => ({
              ...f,
              periodYear: v ?? undefined,
              skipCount: 0,
            }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => message.error("Không thể xuất danh sách."),
            })
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
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={{
          total: data?.totalCount,
          pageSize: PAGE_SIZE,
          current: (filter.skipCount ?? 0) / PAGE_SIZE + 1,
          onChange: (page) =>
            setFilter((f) => ({ ...f, skipCount: (page - 1) * PAGE_SIZE })),
          showTotal: (total) => `Tổng: ${total}`,
          showSizeChanger: false,
        }}
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
          <Form.Item name="periodYear" label="Năm" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="periodMonth"
            label="Tháng"
            rules={[{ required: true }]}
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
  const [filter, setFilter] = useState<AtpWorkReportFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useAtpWorkReports(filter);
  const createMut = useCreateAtpWorkReport();
  const deleteMut = useDeleteAtpWorkReport();
  const submitMut = useSubmitAtpWorkReport();
  const verifyMut = useVerifyAtpWorkReport();
  const returnMut = useReturnAtpWorkReport();
  const completeMut = useCompleteAtpWorkReport();
  const returnToDraftMut = useReturnAtpToDraft();
  const exportMut = useExportAtpWorkReports();

  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<AtpWorkReport | null>(null);
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [errorNotifReport, setErrorNotifReport] =
    useState<AtpWorkReport | null>(null);
  const [docView, setDocView] = useState<ReportDocument | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  const columns: TableColumnsType<AtpWorkReport> = [
    {
      title: "Kỳ báo cáo",
      key: "period",
      render: (_, r) => {
        const typeLbl = REPORT_PERIOD_TYPE_CONFIG[r.periodType]?.label ?? "";
        const half = r.periodHalf ? ` (Kỳ ${r.periodHalf})` : "";
        return `${typeLbl} ${r.periodYear}${half}`;
      },
      width: 180,
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
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            aria-label="Xem chi tiết"
            onClick={() => setDetailId(record.id)}
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            aria-label="Xem văn bản"
            onClick={() => setDocView({ kind: "atp", report: record })}
          />
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Edit") && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditReport(record)}
              >
                Sửa
              </Button>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Submit") && (
              <Popconfirm
                title="Gửi báo cáo này?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() =>
                  submitMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã gửi"),
                  })
                }
              >
                <Button size="small" icon={<SendOutlined />}>
                  Gửi
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Submitted &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Verify") && (
              <Popconfirm
                title="Xác minh báo cáo này?"
                okText="Xác minh"
                cancelText="Hủy"
                onConfirm={() =>
                  verifyMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xác minh"),
                  })
                }
              >
                <Button size="small" icon={<CheckCircleOutlined />}>
                  Xác minh
                </Button>
              </Popconfirm>
            )}
          {(record.status === REPORT_STATUS.Submitted ||
            record.status === REPORT_STATUS.Verified) &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Return") && (
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => setReturnOpen(record.id)}
              >
                Trả lại
              </Button>
            )}
          {record.status === REPORT_STATUS.Verified &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Complete") && (
              <Popconfirm
                title="Hoàn thành báo cáo này?"
                okText="Hoàn thành"
                cancelText="Hủy"
                onConfirm={() =>
                  completeMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã hoàn thành"),
                  })
                }
              >
                <Button size="small" icon={<FileDoneOutlined />}>
                  Hoàn thành
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Returned &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Edit") && (
              <Popconfirm
                title="Chuyển về nháp để sửa?"
                okText="Chuyển"
                cancelText="Hủy"
                onConfirm={() =>
                  returnToDraftMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã chuyển về nháp"),
                  })
                }
              >
                <Button size="small" icon={<EditOutlined />}>
                  Về nháp
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.AtpWorkReports.Delete") && (
              <Popconfirm
                title="Xóa báo cáo?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() =>
                  deleteMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xóa"),
                  })
                }
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          {record.status !== REPORT_STATUS.Draft && (
            <Button
              size="small"
              icon={<WarningOutlined />}
              onClick={() => setErrorNotifReport(record)}
            >
              Sai sót
            </Button>
          )}
        </Space>
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
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Loại kỳ"
          allowClear
          style={{ width: 120 }}
          options={Object.entries(REPORT_PERIOD_TYPE_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
            setFilter((f) => ({ ...f, periodType: v, skipCount: 0 }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => message.error("Không thể xuất danh sách."),
            })
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
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={{
          total: data?.totalCount,
          pageSize: PAGE_SIZE,
          current: (filter.skipCount ?? 0) / PAGE_SIZE + 1,
          onChange: (page) =>
            setFilter((f) => ({ ...f, skipCount: (page - 1) * PAGE_SIZE })),
          showTotal: (total) => `Tổng: ${total}`,
          showSizeChanger: false,
        }}
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
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(REPORT_PERIOD_TYPE_CONFIG).map(
                ([k, v]) => ({ value: Number(k), label: v.label }),
              )}
            />
          </Form.Item>
          <Form.Item name="periodYear" label="Năm" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
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
                  rules={[{ required: true }]}
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
  const [filter, setFilter] = useState<ActionMonthReportFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useActionMonthReports(filter);
  const createMut = useCreateActionMonthReport();
  const deleteMut = useDeleteActionMonthReport();
  const submitMut = useSubmitActionMonthReport();
  const verifyMut = useVerifyActionMonthReport();
  const returnMut = useReturnActionMonthReport();
  const completeMut = useCompleteActionMonthReport();
  const returnToDraftMut = useReturnAmrToDraft();
  const exportMut = useExportActionMonthReports();

  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<ActionMonthReport | null>(null);
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [errorNotifReport, setErrorNotifReport] =
    useState<ActionMonthReport | null>(null);
  const [docView, setDocView] = useState<ReportDocument | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  const columns: TableColumnsType<ActionMonthReport> = [
    {
      title: "Năm",
      dataIndex: "periodYear",
      width: 80,
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
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            aria-label="Xem chi tiết"
            onClick={() => setDetailId(record.id)}
          />
          <Button
            size="small"
            icon={<FileTextOutlined />}
            aria-label="Xem văn bản"
            onClick={() => setDocView({ kind: "action-month", report: record })}
          />
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Edit") && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditReport(record)}
              >
                Sửa
              </Button>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Submit") && (
              <Popconfirm
                title="Gửi báo cáo này?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() =>
                  submitMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã gửi"),
                  })
                }
              >
                <Button size="small" icon={<SendOutlined />}>
                  Gửi
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Submitted &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Verify") && (
              <Popconfirm
                title="Xác minh báo cáo này?"
                okText="Xác minh"
                cancelText="Hủy"
                onConfirm={() =>
                  verifyMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xác minh"),
                  })
                }
              >
                <Button size="small" icon={<CheckCircleOutlined />}>
                  Xác minh
                </Button>
              </Popconfirm>
            )}
          {(record.status === REPORT_STATUS.Submitted ||
            record.status === REPORT_STATUS.Verified) &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Return") && (
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => setReturnOpen(record.id)}
              >
                Trả lại
              </Button>
            )}
          {record.status === REPORT_STATUS.Verified &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Complete") && (
              <Popconfirm
                title="Hoàn thành báo cáo này?"
                okText="Hoàn thành"
                cancelText="Hủy"
                onConfirm={() =>
                  completeMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã hoàn thành"),
                  })
                }
              >
                <Button size="small" icon={<FileDoneOutlined />}>
                  Hoàn thành
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Returned &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Edit") && (
              <Popconfirm
                title="Chuyển về nháp để sửa?"
                okText="Chuyển"
                cancelText="Hủy"
                onConfirm={() =>
                  returnToDraftMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã chuyển về nháp"),
                  })
                }
              >
                <Button size="small" icon={<EditOutlined />}>
                  Về nháp
                </Button>
              </Popconfirm>
            )}
          {record.status === REPORT_STATUS.Draft &&
            hasPermission("FoodSafe.Reporting.ActionMonthReports.Delete") && (
              <Popconfirm
                title="Xóa báo cáo?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() =>
                  deleteMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xóa"),
                  })
                }
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          {record.status !== REPORT_STATUS.Draft && (
            <Button
              size="small"
              icon={<WarningOutlined />}
              onClick={() => setErrorNotifReport(record)}
            >
              Sai sót
            </Button>
          )}
        </Space>
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
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        <InputNumber<number>
          placeholder="Năm"
          style={{ width: 100 }}
          onChange={(v) =>
            setFilter((f) => ({
              ...f,
              periodYear: v ?? undefined,
              skipCount: 0,
            }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => message.error("Không thể xuất danh sách."),
            })
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
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={{
          total: data?.totalCount,
          pageSize: PAGE_SIZE,
          current: (filter.skipCount ?? 0) / PAGE_SIZE + 1,
          onChange: (page) =>
            setFilter((f) => ({ ...f, skipCount: (page - 1) * PAGE_SIZE })),
          showTotal: (total) => `Tổng: ${total}`,
          showSizeChanger: false,
        }}
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
          <Form.Item name="periodYear" label="Năm" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
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
