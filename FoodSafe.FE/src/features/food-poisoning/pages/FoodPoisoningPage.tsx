import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  type TableColumnsType,
} from "antd";
import { RowActions } from "@/components/RowActions";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  FilePdfOutlined,
  SendOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  EnvironmentOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import {
  usePoisoningCases,
  usePoisoningIncidents,
} from "../api/foodPoisoningQueries";
import {
  useCreateCase,
  useUpdateCase,
  useDeleteCase,
  useSubmitCase,
  useVerifyCase,
  useExportCases,
  useDownloadCasePdf,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useSubmitIncident,
  useVerifyIncident,
  useConcludeIncident,
  useDownloadIncidentPdf,
  useExportIncidents,
} from "../api/foodPoisoningMutations";
import { CaseEditorModal } from "../components/CaseEditorModal";
import { IncidentEditorModal } from "../components/IncidentEditorModal";
import { PoisoningErrorReportsModal } from "../components/PoisoningErrorReportsModal";
import { PoisoningMap } from "../components/PoisoningMap";
import {
  CAUSE_ASSESSMENT_CONFIG,
  POISONING_CASE_STATUS,
  POISONING_CASE_STATUS_CONFIG,
  POISONING_INCIDENT_STATUS,
  POISONING_INCIDENT_STATUS_CONFIG,
  TREATMENT_RESULT_CONFIG,
  VICTIM_GENDER_CONFIG,
  type CaseFilter,
  type CreateUpdateCaseInput,
  type CreateUpdateIncidentInput,
  type FoodPoisoningCase,
  type FoodPoisoningIncident,
  type IncidentFilter,
  type PoisoningCaseStatus,
  type PoisoningIncidentStatus,
  type TreatmentResult,
  type VictimGender,
} from "../types/foodPoisoning.types";
import { useTablePagination } from "@/hooks/useTablePagination";

const formatDate = (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY") : null);
const formatDateTime = (v?: string) =>
  v ? dayjs(v).format("DD/MM/YYYY HH:mm") : null;

function CasesTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<CaseFilter>({});
  const [filterResetKey, setFilterResetKey] = useState(0);
  const pagination = useTablePagination(15);
  const { data, isFetching } = usePoisoningCases({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateCase();
  const updateMut = useUpdateCase();
  const deleteMut = useDeleteCase();
  const submitMut = useSubmitCase();
  const verifyMut = useVerifyCase();
  const exportMut = useExportCases();
  const downloadPdfMut = useDownloadCasePdf();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FoodPoisoningCase | undefined>();
  const [detailCase, setDetailCase] = useState<FoodPoisoningCase | null>(null);
  const [errorReportCase, setErrorReportCase] =
    useState<FoodPoisoningCase | null>(null);

  const canCreate = hasPermission("FoodSafe.FoodPoisoning.Cases.Create");
  const canEdit = hasPermission("FoodSafe.FoodPoisoning.Cases.Edit");
  const canDelete = hasPermission("FoodSafe.FoodPoisoning.Cases.Delete");
  const canVerify = hasPermission("FoodSafe.FoodPoisoning.Cases.Verify");
  const canLinkIncident = hasPermission(
    "FoodSafe.FoodPoisoning.Incidents.View",
  );

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: FoodPoisoningCase) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateCaseInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật ca ngộ độc thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo ca ngộ độc thành công.");
      }
      setEditorOpen(false);
    } catch (error) {
      message.error(extractApiError(error));
    }
  }

  const columns: TableColumnsType<FoodPoisoningCase> = [
    {
      title: "Mã ca",
      dataIndex: "caseCode",
      width: 140,
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "reportDate",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Nạn nhân",
      dataIndex: "victimName",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Giới tính",
      dataIndex: "victimGender",
      width: 80,
      render: (v?: VictimGender) => (v ? VICTIM_GENDER_CONFIG[v]?.label : "—"),
    },
    {
      title: "Tuổi",
      dataIndex: "victimAge",
      width: 60,
      render: (v?: number) => v ?? "—",
    },
    {
      title: "Thực phẩm nghi ngờ",
      dataIndex: "suspectedFood",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Kết quả",
      dataIndex: "treatmentResult",
      width: 120,
      render: (v?: TreatmentResult) => {
        if (!v) return "—";
        const cfg = TREATMENT_RESULT_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: PoisoningCaseStatus) => {
        const cfg = POISONING_CASE_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: FoodPoisoningCase) => (
        <RowActions
          actions={[
            {
              key: "error-report",
              label: "Sai sót",
              ariaLabel: `Sai sót ${record.caseCode}`,
              icon: <WarningOutlined />,
              hidden: record.status === POISONING_CASE_STATUS.Draft,
              onClick: () => setErrorReportCase(record),
            },
            {
              key: "pdf",
              label: "Tải PDF",
              ariaLabel: `Tải PDF ${record.caseCode}`,
              icon: <FilePdfOutlined />,
              onClick: () =>
                downloadPdfMut.mutate(record.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: record.status !== POISONING_CASE_STATUS.Draft || !canEdit,
              onClick: () => openEdit(record),
            },
            {
              key: "submit",
              label: "Gửi",
              icon: <SendOutlined />,
              hidden: record.status !== POISONING_CASE_STATUS.Draft || !canEdit,
              confirm: "Gửi báo cáo ca ngộ độc này?",
              onClick: () =>
                submitMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã gửi báo cáo."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "verify",
              label: "Xác minh",
              icon: <CheckCircleOutlined />,
              hidden:
                record.status !== POISONING_CASE_STATUS.Reported || !canVerify,
              confirm: "Xác minh ca ngộ độc này?",
              onClick: () =>
                verifyMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xác minh."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                record.status !== POISONING_CASE_STATUS.Draft || !canDelete,
              confirm: "Xóa ca ngộ độc này?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
          ]}
          overflowAriaLabel={`Thao tác ${record.caseCode}`}
        />
      ),
    },
  ];

  return (
    <>
      <div
        key={filterResetKey}
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Tìm theo mã ca, tên nạn nhân..."
          style={{ width: 280 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(POISONING_CASE_STATUS_CONFIG).map(
            ([value, cfg]) => ({
              value: Number(value),
              label: cfg.label,
            }),
          )}
        />
        <ClearFiltersButton
          active={Boolean(filter.filter?.trim() || filter.status !== undefined)}
          onClick={() => {
            setFilter({});
            setFilterResetKey((key) => key + 1);
            pagination.resetToFirstPage();
          }}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: (error) => message.error(extractApiError(error)),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo ca ngộ độc
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isFetching}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailCase(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <CaseEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        canLinkIncident={canLinkIncident}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <RecordDetailDrawer
        title="Chi tiết ca ngộ độc"
        record={detailCase}
        onClose={() => setDetailCase(null)}
        fields={[
          { label: "Mã ca", render: (r) => r.caseCode },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = POISONING_CASE_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Ngày báo cáo", render: (r) => formatDate(r.reportDate) },
          {
            label: "Ngày xảy ra",
            render: (r) => formatDateTime(r.occurrenceDate),
          },
          { label: "Nạn nhân", render: (r) => r.victimName },
          {
            label: "Giới tính",
            render: (r) =>
              r.victimGender
                ? VICTIM_GENDER_CONFIG[r.victimGender]?.label
                : null,
          },
          { label: "Tuổi", render: (r) => r.victimAge },
          { label: "SĐT nạn nhân", render: (r) => r.victimPhone },
          {
            label: "Địa chỉ nạn nhân",
            render: (r) => r.victimAddress,
            span: 2,
          },
          { label: "Địa điểm", render: (r) => r.locationDescription, span: 2 },
          { label: "Thực phẩm nghi ngờ", render: (r) => r.suspectedFood },
          { label: "Nguồn thực phẩm", render: (r) => r.foodSource },
          {
            label: "Ngày chế biến",
            render: (r) => formatDate(r.foodPreparationDate),
          },
          {
            label: "Thời gian khởi phát",
            render: (r) => formatDateTime(r.onsetTime),
          },
          { label: "Triệu chứng", render: (r) => r.symptoms, span: 2 },
          { label: "Cơ sở y tế", render: (r) => r.medicalFacility },
          {
            label: "Ngày điều trị",
            render: (r) => formatDate(r.treatmentStartDate),
          },
          {
            label: "Kết quả điều trị",
            render: (r) => {
              if (!r.treatmentResult) return null;
              const cfg = TREATMENT_RESULT_CONFIG[r.treatmentResult];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Người báo cáo", render: (r) => r.reporterName },
          { label: "SĐT người báo", render: (r) => r.reporterPhone },
          { label: "Đơn vị báo cáo", render: (r) => r.reporterOrganization },
          { label: "Quan hệ nạn nhân", render: (r) => r.reporterRelation },
          {
            label: "Ngày gửi báo cáo",
            render: (r) => formatDate(r.reportedAt),
          },
          { label: "Ngày xác minh", render: (r) => formatDate(r.verifiedAt) },
          { label: "Ngày tạo", render: (r) => formatDate(r.creationTime) },
          { label: "Ghi chú", render: (r) => r.notes, span: 2 },
        ]}
      />

      <PoisoningErrorReportsModal
        kind="case"
        targetId={errorReportCase?.id ?? null}
        targetCode={errorReportCase?.caseCode ?? ""}
        onClose={() => setErrorReportCase(null)}
        canReport={canEdit}
        canRespond={canVerify}
      />
    </>
  );
}

function IncidentsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<IncidentFilter>({});
  const [filterResetKey, setFilterResetKey] = useState(0);
  const pagination = useTablePagination(15);
  const { data, isFetching } = usePoisoningIncidents({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateIncident();
  const updateMut = useUpdateIncident();
  const deleteMut = useDeleteIncident();
  const submitMut = useSubmitIncident();
  const verifyMut = useVerifyIncident();
  const concludeMut = useConcludeIncident();
  const exportMut = useExportIncidents();
  const downloadPdfMut = useDownloadIncidentPdf();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FoodPoisoningIncident | undefined>();
  const [concludeOpen, setConcludeOpen] = useState(false);
  const [concludingId, setConcludingId] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] =
    useState<FoodPoisoningIncident | null>(null);
  const [errorReportIncident, setErrorReportIncident] =
    useState<FoodPoisoningIncident | null>(null);

  const canCreate = hasPermission("FoodSafe.FoodPoisoning.Incidents.Create");
  const canEdit = hasPermission("FoodSafe.FoodPoisoning.Incidents.Edit");
  const canDelete = hasPermission("FoodSafe.FoodPoisoning.Incidents.Delete");
  const canVerify = hasPermission("FoodSafe.FoodPoisoning.Incidents.Verify");
  const canConclude = hasPermission(
    "FoodSafe.FoodPoisoning.Incidents.Conclude",
  );

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: FoodPoisoningIncident) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateIncidentInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật vụ ngộ độc thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo vụ ngộ độc thành công.");
      }
      setEditorOpen(false);
    } catch (error) {
      message.error(extractApiError(error));
    }
  }

  const columns: TableColumnsType<FoodPoisoningIncident> = [
    {
      title: "Mã vụ",
      dataIndex: "incidentCode",
      width: 140,
    },
    {
      title: "Ngày xảy ra",
      dataIndex: "occurrenceDate",
      width: 130,
      render: (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Địa điểm",
      dataIndex: "locationDescription",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Mắc",
      dataIndex: "affectedCount",
      width: 70,
      align: "right",
    },
    {
      title: "Nhập viện",
      dataIndex: "hospitalizedCount",
      width: 90,
      align: "right",
    },
    {
      title: "Tử vong",
      dataIndex: "deathCount",
      width: 80,
      align: "right",
      render: (v: number) => (v > 0 ? <Tag color="red">{v}</Tag> : v),
    },
    {
      title: "Số ca",
      dataIndex: "caseCount",
      width: 70,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: PoisoningIncidentStatus) => {
        const cfg = POISONING_INCIDENT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: FoodPoisoningIncident) => (
        <RowActions
          actions={[
            {
              key: "error-report",
              label: "Sai sót",
              ariaLabel: `Sai sót ${record.incidentCode}`,
              icon: <WarningOutlined />,
              hidden: record.status === POISONING_INCIDENT_STATUS.Draft,
              onClick: () => setErrorReportIncident(record),
            },
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden:
                record.status !== POISONING_INCIDENT_STATUS.Draft || !canEdit,
              onClick: () => openEdit(record),
            },
            {
              key: "submit",
              label: "Gửi",
              icon: <SendOutlined />,
              hidden:
                record.status !== POISONING_INCIDENT_STATUS.Draft || !canEdit,
              confirm: "Gửi báo cáo vụ ngộ độc này?",
              onClick: () =>
                submitMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã gửi báo cáo."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "verify",
              label: "Xác minh",
              icon: <CheckCircleOutlined />,
              hidden:
                record.status !== POISONING_INCIDENT_STATUS.Reported ||
                !canVerify,
              confirm: "Xác minh vụ ngộ độc này?",
              onClick: () =>
                verifyMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xác minh."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "conclude",
              label: "Kết luận",
              icon: <SolutionOutlined />,
              hidden:
                record.status !== POISONING_INCIDENT_STATUS.Verified ||
                !canConclude,
              onClick: () => {
                setConcludingId(record.id);
                setConcludeOpen(true);
              },
            },
            {
              key: "pdf",
              label: "Tải phiếu kết thúc",
              icon: <FilePdfOutlined />,
              hidden: record.status !== POISONING_INCIDENT_STATUS.Concluded,
              onClick: () =>
                downloadPdfMut.mutate(record.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                record.status !== POISONING_INCIDENT_STATUS.Draft || !canDelete,
              confirm: "Xóa vụ ngộ độc này?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa."),
                  onError: (error) => message.error(extractApiError(error)),
                }),
            },
          ]}
          overflowAriaLabel={`Thao tác ${record.incidentCode}`}
        />
      ),
    },
  ];

  return (
    <>
      <div
        key={filterResetKey}
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Tìm theo mã vụ, địa điểm..."
          style={{ width: 280 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(POISONING_INCIDENT_STATUS_CONFIG).map(
            ([value, cfg]) => ({
              value: Number(value),
              label: cfg.label,
            }),
          )}
        />
        <ClearFiltersButton
          active={Boolean(filter.filter?.trim() || filter.status !== undefined)}
          onClick={() => {
            setFilter({});
            setFilterResetKey((key) => key + 1);
            pagination.resetToFirstPage();
          }}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: (error) => message.error(extractApiError(error)),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo vụ ngộ độc
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isFetching}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailIncident(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <IncidentEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <RecordDetailDrawer
        title="Chi tiết vụ ngộ độc"
        record={detailIncident}
        onClose={() => setDetailIncident(null)}
        fields={[
          { label: "Mã vụ", render: (r) => r.incidentCode },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = POISONING_INCIDENT_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Ngày xảy ra",
            render: (r) => formatDateTime(r.occurrenceDate),
          },
          { label: "Ngày kết thúc", render: (r) => formatDateTime(r.endDate) },
          { label: "Địa điểm", render: (r) => r.locationDescription, span: 2 },
          { label: "Số phơi nhiễm", render: (r) => r.exposedCount },
          { label: "Số mắc", render: (r) => r.affectedCount },
          { label: "Nhập viện", render: (r) => r.hospitalizedCount },
          {
            label: "Tử vong",
            render: (r) =>
              r.deathCount > 0 ? (
                <Tag color="red">{r.deathCount}</Tag>
              ) : (
                r.deathCount
              ),
          },
          { label: "Số ca liên quan", render: (r) => r.caseCount },
          { label: "Thực phẩm nghi ngờ", render: (r) => r.suspectedFood },
          { label: "Nguồn thực phẩm", render: (r) => r.foodSource },
          { label: "Loại hình dịch vụ", render: (r) => r.foodServiceType },
          {
            label: "Đánh giá nguyên nhân",
            render: (r) =>
              r.causeAssessmentValue
                ? CAUSE_ASSESSMENT_CONFIG[r.causeAssessmentValue]?.label
                : null,
          },
          { label: "Tác nhân gây bệnh", render: (r) => r.causativeAgent },
          { label: "Vi sinh vật", render: (r) => r.pathogen },
          {
            label: "Đoàn điều tra",
            render: (r) => r.investigationTeam,
            span: 2,
          },
          {
            label: "Biện pháp kiểm soát",
            render: (r) => r.controlMeasures,
            span: 2,
          },
          {
            label: "Biện pháp phòng ngừa",
            render: (r) => r.preventionMeasures,
            span: 2,
          },
          { label: "Kết luận", render: (r) => r.conclusion, span: 2 },
          { label: "Ngày báo cáo", render: (r) => formatDate(r.reportedAt) },
          { label: "Ngày xác minh", render: (r) => formatDate(r.verifiedAt) },
          { label: "Ngày kết luận", render: (r) => formatDate(r.concludedAt) },
          { label: "Ngày tạo", render: (r) => formatDate(r.creationTime) },
          { label: "Ghi chú", render: (r) => r.notes, span: 2 },
        ]}
      />

      <PoisoningErrorReportsModal
        kind="incident"
        targetId={errorReportIncident?.id ?? null}
        targetCode={errorReportIncident?.incidentCode ?? ""}
        onClose={() => setErrorReportIncident(null)}
        canReport={canEdit}
        canRespond={canVerify}
      />

      <ConcludeModal
        open={concludeOpen}
        loading={concludeMut.isPending}
        onCancel={() => setConcludeOpen(false)}
        onConfirm={async (conclusion) => {
          if (!concludingId) return false;
          try {
            await concludeMut.mutateAsync({
              id: concludingId,
              input: { conclusion },
            });
            message.success("Đã kết luận vụ ngộ độc.");
            setConcludeOpen(false);
            setConcludingId(null);
            return true;
          } catch (error) {
            message.error(extractApiError(error));
            return false;
          }
        }}
      />
    </>
  );
}

function ConcludeModal(props: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  /** Trả về `true` khi kết luận thành công để modal xóa nội dung đã nhập. */
  onConfirm: (conclusion: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState("");

  return (
    <Modal
      open={props.open}
      title="Kết luận vụ ngộ độc"
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={props.loading}
      onCancel={() => {
        setValue("");
        props.onCancel();
      }}
      onOk={async () => {
        if (!value.trim()) {
          message.warning("Vui lòng nhập nội dung kết luận.");
          return;
        }
        // Giữ nguyên nội dung khi máy chủ từ chối để người dùng sửa và gửi lại.
        if (await props.onConfirm(value.trim())) {
          setValue("");
        }
      }}
      destroyOnHidden
    >
      <Input.TextArea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nhập nội dung kết luận vụ ngộ độc..."
      />
    </Modal>
  );
}

function MapTab({
  showCases,
  showIncidents,
}: {
  showCases: boolean;
  showIncidents: boolean;
}) {
  const { data: casesData } = usePoisoningCases(
    { skipCount: 0, maxResultCount: 500 },
    { enabled: showCases },
  );
  const { data: incidentsData } = usePoisoningIncidents(
    { skipCount: 0, maxResultCount: 500 },
    { enabled: showIncidents },
  );

  return (
    <PoisoningMap
      cases={casesData?.items ?? []}
      incidents={incidentsData?.items ?? []}
    />
  );
}

export default function FoodPoisoningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canViewCases = hasPermission("FoodSafe.FoodPoisoning.Cases.View");
  const canViewIncidents = hasPermission(
    "FoodSafe.FoodPoisoning.Incidents.View",
  );

  const tabs = [
    ...(canViewCases
      ? [{ key: "cases", label: "Ca ngộ độc nhỏ lẻ", children: <CasesTab /> }]
      : []),
    ...(canViewIncidents
      ? [
          {
            key: "incidents",
            label: "Vụ ngộ độc thực phẩm",
            children: <IncidentsTab />,
          },
        ]
      : []),
    {
      key: "map",
      label: (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          Bản đồ
        </span>
      ),
      children: (
        <MapTab showCases={canViewCases} showIncidents={canViewIncidents} />
      ),
    },
  ];

  const requestedTab = searchParams.get("tab");
  const activeKey =
    requestedTab && tabs.some((t) => t.key === requestedTab)
      ? requestedTab
      : tabs[0]?.key;

  return (
    <div className="page-container">
      <h1 className="page-header-title">Ngộ độc thực phẩm</h1>
      <Card>
        <Tabs
          activeKey={activeKey}
          items={tabs}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        />
      </Card>
    </div>
  );
}
