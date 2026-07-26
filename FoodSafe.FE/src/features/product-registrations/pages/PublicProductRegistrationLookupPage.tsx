import { useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Input,
  Space,
  Typography,
} from "antd";
import { StatusBadge } from "@/components/StatusBadge";
import { productRegistrationApi } from "../api/productRegistrationApi";
import type { PublicProductRegistration } from "../types/productRegistration.types";

export default function PublicProductRegistrationLookupPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<PublicProductRegistration>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await productRegistrationApi.publicLookup(number.trim()));
    } catch {
      setError("Không tìm thấy đăng ký công bố sản phẩm.");
    } finally {
      setLoading(false);
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
        Tra cứu đăng ký công bố sản phẩm
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập chính xác số đăng ký để kiểm tra thông tin và hiệu lực.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={number}
          placeholder="Số đăng ký"
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
            <Descriptions.Item label="Số đăng ký">
              {result.registrationNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusBadge status={result.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm">
              {result.productName}
            </Descriptions.Item>
            <Descriptions.Item label="Cơ sở SXKD">
              {result.businessName}
            </Descriptions.Item>
            <Descriptions.Item label="Nhà sản xuất">
              {result.manufacturer || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Cơ quan cấp">
              {result.certifyingAuthority || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký">
              {new Date(result.registrationDate).toLocaleDateString("vi-VN")}
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
