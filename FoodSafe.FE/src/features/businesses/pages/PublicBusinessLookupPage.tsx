import { useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import { publicBusinessApi } from "../api/businessApi";
import {
  BUSINESS_STATUS_CONFIG,
  type PublicBusiness,
  type BusinessStatus,
} from "../types/business.types";

export default function PublicBusinessLookupPage() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<PublicBusiness>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await publicBusinessApi.lookup(keyword.trim()));
    } catch {
      setError("Không tìm thấy cơ sở sản xuất kinh doanh.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "64px auto", padding: "0 24px" }}>
      <Typography.Title level={2}>
        Tra cứu cơ sở sản xuất, kinh doanh thực phẩm
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập mã cơ sở hoặc mã số thuế để kiểm tra thông tin.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={keyword}
          placeholder="Tên cơ sở hoặc mã số"
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => void lookup()}
        />
        <Button
          type="primary"
          loading={loading}
          disabled={!keyword.trim()}
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
            <Descriptions.Item label="Tên cơ sở">
              {result.name}
            </Descriptions.Item>
            <Descriptions.Item label="Mã cơ sở">
              {result.code || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">
              {result.taxCode || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {(() => {
                const cfg =
                  BUSINESS_STATUS_CONFIG[result.status as BusinessStatus];
                return cfg ? (
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                ) : (
                  <Tag>{result.status}</Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Người đại diện">
              {result.representativeName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Điện thoại">
              {result.contactPhone || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {result.addressStreet || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Giấy ĐĐK ATTP">
              {result.hasEligibilityCertificate ? (
                <Tag color="green">Có</Tag>
              ) : (
                <Tag color="default">Chưa có</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Cam kết VSATTP">
              {result.hasVsattpCommitment ? (
                <Tag color="green">Có</Tag>
              ) : (
                <Tag color="default">Chưa có</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </main>
  );
}
