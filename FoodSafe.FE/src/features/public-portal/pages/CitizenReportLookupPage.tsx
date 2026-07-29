import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Input,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { PublicShell } from "../components/PublicShell";
import { useCitizenReportStatus } from "../api/publicPortalQueries";
import {
  CITIZEN_REPORT_STATUS_CONFIG,
  type CitizenReportTrackingStatus,
} from "../types/publicPortal.types";

function StatusCard({
  trackingCode,
  status,
  submittedAt,
  updatedAt,
}: {
  trackingCode: string;
  status: CitizenReportTrackingStatus;
  submittedAt: string;
  updatedAt: string;
}) {
  const cfg = CITIZEN_REPORT_STATUS_CONFIG[status];
  return (
    <Card
      style={{ maxWidth: 560, marginTop: 24 }}
      styles={{ body: { padding: 24 } }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}
      >
        <Typography.Text strong style={{ fontSize: 20, letterSpacing: 1 }}>
          {trackingCode}
        </Typography.Text>
        <Tag color={cfg.color} style={{ fontSize: 14, padding: "2px 10px" }}>
          {cfg.label}
        </Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0" }}>
        <Typography.Text type="secondary">Ngày gửi</Typography.Text>
        <Typography.Text>
          {dayjs(submittedAt).format("DD/MM/YYYY HH:mm")}
        </Typography.Text>
        <Typography.Text type="secondary">Cập nhật lần cuối</Typography.Text>
        <Typography.Text>
          {dayjs(updatedAt).format("DD/MM/YYYY HH:mm")}
        </Typography.Text>
      </div>

      {status === "Submitted" && (
        <Alert
          type="info"
          showIcon
          message="Phản ánh của bạn đã được tiếp nhận và đang chờ xem xét."
          style={{ marginTop: 16 }}
        />
      )}
      {status === "UnderReview" && (
        <Alert
          type="warning"
          showIcon
          message="Phản ánh đang được cán bộ phụ trách xem xét và xác minh."
          style={{ marginTop: 16 }}
        />
      )}
      {status === "Resolved" && (
        <Alert
          type="success"
          showIcon
          message="Phản ánh đã được xử lý. Cảm ơn bạn đã đóng góp thông tin."
          style={{ marginTop: 16 }}
        />
      )}
      {status === "Rejected" && (
        <Alert
          type="error"
          showIcon
          message="Phản ánh không được chấp nhận sau khi xem xét. Nếu bạn có bằng chứng mới, vui lòng gửi phản ánh khác."
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
}

export default function CitizenReportLookupPage() {
  const [searchParams] = useSearchParams();
  const initialCode = (searchParams.get("code") ?? "").trim().toUpperCase();

  const [inputValue, setInputValue] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);

  const { data, isFetching, isError, error } = useCitizenReportStatus(submittedCode);

  // When the URL ?code= param changes (e.g. user navigated here from success page),
  // pre-fill and trigger a lookup automatically.
  useEffect(() => {
    if (initialCode) {
      setInputValue(initialCode);
      setSubmittedCode(initialCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;
    setSubmittedCode(trimmed);
  };

  const notFound =
    !isFetching && submittedCode.length > 0 && data === null && !isError;

  return (
    <PublicShell>
      <div style={{ maxWidth: 600 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Tra cứu trạng thái phản ánh
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Nhập mã theo dõi (ví dụ: FD-A3X7K2) mà bạn nhận được khi gửi phản
          ánh để kiểm tra trạng thái xử lý.
        </Typography.Paragraph>

        <Input.Search
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          onSearch={handleSearch}
          onPressEnter={handleSearch}
          placeholder="Nhập mã theo dõi, ví dụ: FD-A3X7K2"
          enterButton={
            <Button type="primary" loading={isFetching}>
              Kiểm tra
            </Button>
          }
          size="large"
          maxLength={12}
          style={{ maxWidth: 420 }}
          allowClear
        />

        {isFetching && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Spin size="large" />
          </div>
        )}

        {!isFetching && isError && (
          <Alert
            type="error"
            showIcon
            message="Đã xảy ra lỗi khi tra cứu. Vui lòng thử lại sau."
            style={{ marginTop: 24, maxWidth: 420 }}
          />
        )}

        {notFound && (
          <Alert
            type="warning"
            showIcon
            message={`Không tìm thấy phản ánh với mã "${submittedCode}". Vui lòng kiểm tra lại mã theo dõi.`}
            style={{ marginTop: 24, maxWidth: 420 }}
          />
        )}

        {!isFetching && data && (
          <StatusCard
            trackingCode={data.trackingCode}
            status={data.status}
            submittedAt={data.submittedAt}
            updatedAt={data.updatedAt}
          />
        )}

        <div style={{ marginTop: 32 }}>
          <Button
            type="link"
            href="/gui-phan-anh"
            style={{ paddingLeft: 0 }}
          >
            Gửi phản ánh mới
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
