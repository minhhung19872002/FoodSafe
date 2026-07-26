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
import { publicSelfDeclarationApi } from "../api/businessApi";
import type { PublicSelfDeclaration } from "../types/business.types";

export default function PublicSelfDeclarationLookupPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<PublicSelfDeclaration>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      setResult(await publicSelfDeclarationApi.lookup(number.trim()));
    } catch {
      setError("Không tìm thấy hồ sơ tự công bố sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "64px auto", padding: "0 24px" }}>
      <Typography.Title level={2}>
        Tra cứu hồ sơ tự công bố sản phẩm
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Nhập chính xác số hồ sơ tự công bố để kiểm tra thông tin và hiệu lực.
      </Typography.Paragraph>
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={number}
          placeholder="Số hồ sơ tự công bố"
          onChange={(e) => setNumber(e.target.value)}
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
            <Descriptions.Item label="Số hồ sơ">
              {result.declarationNumber}
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
            <Descriptions.Item label="Tiêu chuẩn">
              {result.productStandard || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày công bố">
              {new Date(result.declarationDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </main>
  );
}
