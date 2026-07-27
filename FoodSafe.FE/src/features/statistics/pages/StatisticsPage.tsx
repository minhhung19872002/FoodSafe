import { useRef, useState } from "react";
import { App, Button, Card, Col, Row, Select, Spin } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadChartAsPng } from "@/utils/chartExport";
import type { StatisticsDto } from "../types/statistics.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { PoisoningMap } from "@/features/food-poisoning/components/PoisoningMap";
import {
  usePoisoningCases,
  usePoisoningIncidents,
} from "@/features/food-poisoning/api/foodPoisoningQueries";
import { useStatistics } from "../api/statisticsQueries";
import { ReportStatisticsSection } from "../components/ReportStatisticsSection";

const COLORS = [
  "#00796B",
  "#0958D9",
  "#389E0D",
  "#D48806",
  "#CF1322",
  "#531DAB",
  "#096DD9",
  "#7CB305",
  "#FA8C16",
  "#EB2F96",
];

const STATUS_COLORS: Record<string, string> = {
  "Hoạt động": "#389E0D",
  "Ngừng hoạt động": "#8C8C8C",
  "Tạm dừng": "#D48806",
  "Còn hiệu lực": "#389E0D",
  "Hết hạn": "#CF1322",
  "Thu hồi": "#8C8C8C",
  Đạt: "#389E0D",
  "Không đạt": "#CF1322",
  "Đạt có điều kiện": "#D48806",
};

function currentYear() {
  return new Date().getFullYear();
}

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear() - i;
  return { value: y, label: `Năm ${y}` };
});

function PoisoningMapSection() {
  const { data: casesData } = usePoisoningCases({
    skipCount: 0,
    maxResultCount: 500,
  });
  const { data: incidentsData } = usePoisoningIncidents({
    skipCount: 0,
    maxResultCount: 500,
  });
  return (
    <PoisoningMap
      cases={casesData?.items ?? []}
      incidents={incidentsData?.items ?? []}
    />
  );
}

const EMPTY_STATS: StatisticsDto = {
  businessByStatus: [],
  businessByType: [],
  licenseByCategory: [],
  licenseByStatus: [],
  inspectionsByMonth: [],
  violationsByMonth: [],
  poisoningCasesByMonth: [],
  inspectionOutcome: [],
};

export default function StatisticsPage() {
  const { message } = App.useApp();
  const [year, setYear] = useState(currentYear());
  const { data, isLoading } = useStatistics({ year });
  const stats = data ?? EMPTY_STATS;
  const inspectionChartRef = useRef<HTMLDivElement>(null);
  const poisoningChartRef = useRef<HTMLDivElement>(null);

  const saveChart = (
    ref: React.RefObject<HTMLDivElement | null>,
    fileName: string,
  ) => {
    if (!ref.current) return;
    downloadChartAsPng(ref.current, fileName).catch(() =>
      message.error("Không thể lưu ảnh biểu đồ."),
    );
  };

  const chartDownloadButton = (
    ref: React.RefObject<HTMLDivElement | null>,
    fileName: string,
  ) => (
    <Button
      type="text"
      size="small"
      icon={<DownloadOutlined />}
      aria-label={`Tải ảnh ${fileName}`}
      onClick={() => saveChart(ref, fileName)}
    />
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Thống kê tổng hợp"
        actions={
          <Select
            value={year}
            onChange={setYear}
            options={yearOptions}
            style={{ width: 140 }}
          />
        }
      />

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Cơ sở theo trạng thái" size="small">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.businessByStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.businessByStatus.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Top loại hình cơ sở" size="small">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats.businessByType}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00796B" name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Giấy phép / Chứng nhận theo loại" size="small">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.licenseByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0958D9" name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Trạng thái giấy phép" size="small">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.licenseByStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.licenseByStatus.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title={`Thanh kiểm tra theo tháng — Năm ${year}`}
              size="small"
              extra={chartDownloadButton(
                inspectionChartRef,
                `thanh-kiem-tra-${year}.png`,
              )}
            >
              <div ref={inspectionChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.inspectionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#00796B"
                      name="Tổng kiểm tra"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title={`Vi phạm theo tháng — Năm ${year}`} size="small">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.violationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#CF1322" name="Vi phạm" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Kết quả kiểm tra" size="small">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.inspectionOutcome}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.inspectionOutcome.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title={`Ngộ độc thực phẩm theo tháng — Năm ${year}`}
              size="small"
              extra={chartDownloadButton(
                poisoningChartRef,
                `ngo-doc-thuc-pham-${year}.png`,
              )}
            >
              <div ref={poisoningChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.poisoningCasesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#D48806" name="Số ca" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24}>
            <Card title="Bản đồ tình hình ngộ độc thực phẩm" size="small">
              <PoisoningMapSection />
            </Card>
          </Col>
        </Row>
      )}

      <ReportStatisticsSection year={year} />
    </div>
  );
}
