import { useRef, type ReactNode } from "react";
import { App, Button, Card, Empty } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadChartAsPng } from "@/utils/chartExport";

interface ChartCardProps {
  title: string;
  /** File name used when the chart is saved as PNG. */
  fileName: string;
  /** Height of the plotting area, kept in sync with the chart it wraps. */
  height: number;
  /** True when there is nothing to plot — renders the empty state instead. */
  isEmpty: boolean;
  children: ReactNode;
}

export function ChartCard({
  title,
  fileName,
  height,
  isEmpty,
  children,
}: ChartCardProps) {
  const { message } = App.useApp();
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!chartRef.current) return;
    downloadChartAsPng(chartRef.current, fileName).catch(() =>
      message.error("Không thể lưu ảnh biểu đồ."),
    );
  };

  return (
    <Card
      title={title}
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          aria-label={`Tải ảnh ${fileName}`}
          disabled={isEmpty}
          onClick={handleDownload}
        />
      }
    >
      <div ref={chartRef}>
        {isEmpty ? (
          <div
            style={{
              height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có dữ liệu"
            />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
