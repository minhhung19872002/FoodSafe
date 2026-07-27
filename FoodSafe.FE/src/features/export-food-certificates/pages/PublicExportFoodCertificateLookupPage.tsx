import { useState } from "react";
import { Button, Card, Descriptions, Input, Space, Typography } from "antd";
import { StatusBadge } from "@/components/StatusBadge";
import { exportFoodCertificateApi } from "../api/exportFoodCertificateApi";
import type { PublicExportFoodCertificate } from "../types/exportFoodCertificate.types";

export default function PublicExportFoodCertificateLookupPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<PublicExportFoodCertificate>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await exportFoodCertificateApi.publicLookup(number.trim()));
    } catch {
      setError("Không tìm thấy giấy chứng nhận xuất khẩu thực phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const formatQuantity = (quantity?: number, unit?: string): string => {
    if (quantity == null) return "—";
    return unit
      ? `${quantity.toLocaleString("vi-VN")} ${unit}`
      : quantity.toLocaleString("vi-VN");
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
        Tra cứu giấy chứng nhận xuất khẩu thực phẩm
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập chính xác số chứng nhận để kiểm tra thông tin và hiệu lực.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={number}
          placeholder="Số GCN xuất khẩu"
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
        <Card style={{ marginTop: 24 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Số GCN XK">
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
            <Descriptions.Item label="Quốc gia đích">
              {result.destinationCountryName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số lô">
              {result.lotNumber || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {formatQuantity(result.quantity, result.quantityUnit)}
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
