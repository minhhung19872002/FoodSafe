import { useState } from "react";
import { Button, Card, Descriptions, Input, Space, Typography } from "antd";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/utils/format";
import { eligibilityCertificateApi } from "../api/eligibilityCertificateApi";
import type { PublicEligibilityCertificate } from "../types/eligibilityCertificate.types";

export default function PublicEligibilityCertificateLookupPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<PublicEligibilityCertificate>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await eligibilityCertificateApi.publicLookup(number.trim()));
    } catch {
      setError("Không tìm thấy giấy chứng nhận đủ điều kiện ATTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "64px auto", padding: "0 24px" }}>
      <Typography.Title level={2}>
        Tra cứu giấy chứng nhận đủ điều kiện ATTP
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập chính xác số giấy để kiểm tra cơ sở, phạm vi và hiệu lực.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={number}
          placeholder="Số giấy chứng nhận"
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
            <Descriptions.Item label="Số giấy">
              {result.certificateNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusBadge status={result.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Cơ sở SXKD">
              {result.businessName || "(Cơ sở đã ngừng quản lý)"}
            </Descriptions.Item>
            <Descriptions.Item label="Cơ quan cấp">
              {result.certifyingAuthority || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Phạm vi chứng nhận">
              {result.certificationScope || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cấp">
              {formatDate(result.issueDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {result.expiryDate ? formatDate(result.expiryDate) : "Không thời hạn"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </main>
  );
}
