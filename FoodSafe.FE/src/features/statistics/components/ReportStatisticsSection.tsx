import { App, Button, Card, Table, Tabs } from "antd";
import { ExportOutlined, PrinterOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMutation } from "@tanstack/react-query";
import { saveDownload } from "@/utils/download";
import { statisticsApi } from "../api/statisticsApi";
import { useReportStatistics } from "../api/statisticsQueries";
import type {
  BusinessBreakdownRow,
  InspectionSummaryRow,
  LicensesByBusinessTypeRow,
  PoisoningByAreaRow,
  ReportExportKind,
} from "../types/statistics.types";

interface Props {
  year: number;
  month?: number;
  quarter?: number;
  organizationId?: string;
}

const licenseColumns: ColumnsType<LicensesByBusinessTypeRow> = [
  { title: "Loại hình cơ sở", dataIndex: "businessTypeName" },
  { title: "Tự công bố", dataIndex: "selfDeclarations", align: "right" },
  {
    title: "Đăng ký công bố",
    dataIndex: "productRegistrations",
    align: "right",
  },
  { title: "Giấy ĐĐK", dataIndex: "eligibilityCertificates", align: "right" },
  { title: "CFS", dataIndex: "cfsCertificates", align: "right" },
  { title: "GCN XK", dataIndex: "exportCertificates", align: "right" },
  { title: "Quảng cáo", dataIndex: "adRegistrations", align: "right" },
  { title: "Tổng", dataIndex: "total", align: "right" },
];

const poisoningColumns: ColumnsType<PoisoningByAreaRow> = [
  { title: "Địa bàn", dataIndex: "areaName" },
  { title: "Số ca", dataIndex: "caseCount", align: "right" },
  { title: "Nhập viện", dataIndex: "hospitalizedCount", align: "right" },
  { title: "Tử vong", dataIndex: "deceasedCount", align: "right" },
];

const inspectionColumns: ColumnsType<InspectionSummaryRow> = [
  { title: "Đơn vị", dataIndex: "organizationName" },
  { title: "Số kế hoạch", dataIndex: "planCount", align: "right" },
  { title: "Số lượt kiểm tra", dataIndex: "inspectionCount", align: "right" },
  { title: "Số vụ vi phạm", dataIndex: "violationCount", align: "right" },
  { title: "Số vụ xử lý", dataIndex: "sanctionCount", align: "right" },
];

const breakdownColumns: ColumnsType<BusinessBreakdownRow> = [
  { title: "Nhóm", dataIndex: "groupName" },
  { title: "Số cơ sở", dataIndex: "count", align: "right" },
];

export function ReportStatisticsSection({
  year,
  month,
  quarter,
  organizationId,
}: Props) {
  const { message } = App.useApp();
  const filter = { year, month, quarter, organizationId };
  const { data, isLoading } = useReportStatistics(filter);
  const exportMut = useMutation({
    mutationFn: (kind: ReportExportKind) =>
      statisticsApi.exportReport(kind, filter),
  });

  const handleExport = (kind: ReportExportKind) =>
    exportMut.mutate(kind, {
      onSuccess: (file) => saveDownload(file.blob, file.fileName),
      onError: () => void message.error("Không thể xuất báo cáo thống kê."),
    });

  const exportButton = (kind: ReportExportKind) => (
    <Button
      icon={<ExportOutlined />}
      loading={exportMut.isPending && exportMut.variables === kind}
      onClick={() => handleExport(kind)}
    >
      Xuất Excel
    </Button>
  );

  return (
    <Card
      title="Báo cáo thống kê"
      size="small"
      style={{ marginTop: 16 }}
      loading={isLoading}
      extra={
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
          In báo cáo
        </Button>
      }
    >
      <Tabs
        items={[
          {
            key: "licenses",
            label: "Giấy phép theo loại hình",
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  {exportButton("licenses-by-business-type")}
                </div>
                <Table
                  sticky
                  rowKey="businessTypeName"
                  columns={licenseColumns}
                  dataSource={data?.licensesByBusinessType}
                  size="small"
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              </>
            ),
          },
          {
            key: "poisoning",
            label: "Ngộ độc theo địa bàn",
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  {exportButton("poisoning-by-area")}
                </div>
                <Table
                  sticky
                  rowKey="areaName"
                  columns={poisoningColumns}
                  dataSource={data?.poisoningByArea}
                  size="small"
                  pagination={false}
                />
              </>
            ),
          },
          {
            key: "inspection",
            label: "Kết quả thanh kiểm tra",
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  {exportButton("inspection-summary")}
                </div>
                <Table
                  sticky
                  rowKey="organizationName"
                  columns={inspectionColumns}
                  dataSource={data?.inspectionByOrganization}
                  size="small"
                  pagination={false}
                />
              </>
            ),
          },
          {
            key: "businesses",
            label: "Cơ sở SXKD",
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  {exportButton("business-breakdown")}
                </div>
                <Tabs
                  size="small"
                  items={[
                    {
                      key: "type",
                      label: "Theo loại hình",
                      children: (
                        <Table
                          sticky
                          rowKey="groupName"
                          columns={breakdownColumns}
                          dataSource={data?.businessesByType}
                          size="small"
                          pagination={false}
                        />
                      ),
                    },
                    {
                      key: "region",
                      label: "Theo vùng",
                      children: (
                        <Table
                          sticky
                          rowKey="groupName"
                          columns={breakdownColumns}
                          dataSource={data?.businessesByRegion}
                          size="small"
                          pagination={false}
                        />
                      ),
                    },
                    {
                      key: "province",
                      label: "Theo tỉnh/TP",
                      children: (
                        <Table
                          sticky
                          rowKey="groupName"
                          columns={breakdownColumns}
                          dataSource={data?.businessesByProvince}
                          size="small"
                          pagination={false}
                        />
                      ),
                    },
                    {
                      key: "organization",
                      label: "Theo đầu mối quản lý",
                      children: (
                        <Table
                          sticky
                          rowKey="groupName"
                          columns={breakdownColumns}
                          dataSource={data?.businessesByOrganization}
                          size="small"
                          pagination={false}
                        />
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
    </Card>
  );
}
