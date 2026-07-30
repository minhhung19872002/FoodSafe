import { useState } from "react";
import { Button, Card, Descriptions, Input, Space, Typography } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { StatusBadge } from "@/components/StatusBadge";
import { cfsCertificateApi } from "../api/cfsCertificateApi";
import type { PublicCfsCertificate } from "../types/cfsCertificate.types";

export default function PublicCfsCertificateLookupPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<PublicCfsCertificate>();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await cfsCertificateApi.publicLookup(number.trim()));
    } catch {
      setError("Không tìm thấy chứng nhận lưu hành tự do (CFS).");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const { blob, fileName } = await cfsCertificateApi.downloadPdf(result.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "64px auto",
        padding: "0 24px",
      }}
    >
      <Typography.Title level={2}>
        Tra cứu chứng nhận lưu hành tự do (CFS)
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập chính xác số chứng nhận để kiểm tra thông tin và hiệu lực.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={number}
          placeholder="Số CFS"
          onChange={(event) => setNumber(event.target.value)}
          onPressEnter={() => void lookup()}
        />
        <Button
          type="primary"
          loading={loading}
          disabled={!number.trim()}
          onClick={() => void lookup()}
        >
          Tra cứu
        </Button>
      </Space.Compact>
      {error && (
        <Typography.Paragraph type="danger" style={{ marginTop: 16 }}>
          {error}
        </Typography.Paragraph>
      )}
      {result && (
        <Card
          style={{ marginTop: 24 }}
          extra={
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              loading={downloading}
              onClick={() => void downloadPdf()}
            >
              Tải giấy chứng nhận (PDF)
            </Button>
          }
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Số CFS">
              {result.certificateNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusBadge status={result.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Cơ sở SXKD">
              {result.businessName}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm">
              {result.productName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Quốc gia nhập khẩu">
              {result.destinationCountryName}
            </Descriptions.Item>
            <Descriptions.Item label="Cơ quan cấp">
              {result.certifyingAuthority || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cấp">
              {new Date(result.issueDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {result.expiryDate
                ? new Date(result.expiryDate).toLocaleDateString("vi-VN")
                : "Không thời hạn"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </main>
  );
}
