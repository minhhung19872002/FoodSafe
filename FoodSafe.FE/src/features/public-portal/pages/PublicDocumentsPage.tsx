import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicDocuments,
  usePublicDocumentDetail,
  usePublicDocumentTypeOptions,
} from "../api/publicPortalQueries";
import type { PublicDocument } from "../types/publicPortal.types";

function formatDate(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";
}

function DocumentDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicDocumentDetail(id);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/tra-cuu-van-ban")}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        <Alert
          type="error"
          message="Không tìm thấy văn bản hoặc văn bản không công khai."
          showIcon
        />
      </>
    );
  }

  return (
    <>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/tra-cuu-van-ban")}
        style={{ marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {data.title}
      </Typography.Title>

      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Số văn bản">
          {data.documentNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Loại văn bản">
          {data.documentTypeName ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Cơ quan ban hành">
          {data.issuingAuthority ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày ban hành">
          {formatDate(data.issuedDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày hiệu lực">
          {formatDate(data.effectiveDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày hết hiệu lực">
          {formatDate(data.expiryDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Tóm tắt nội dung">
          {data.summary ?? "—"}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
}

function DocumentListView() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>();
  const [submittedTypeId, setSubmittedTypeId] = useState<string>();
  const pagination = useTablePagination(20);

  const { data: documentTypes } = usePublicDocumentTypeOptions();

  const filter = {
    Keyword: submittedKeyword || undefined,
    DocumentTypeId: submittedTypeId,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicDocuments(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
    setSubmittedTypeId(selectedTypeId);
  };

  return (
    <>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Tra cứu văn bản pháp quy
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Tra cứu văn bản pháp luật, quy định về an toàn thực phẩm do cơ quan có
        thẩm quyền ban hành.
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space wrap>
          <Input
            value={keyword}
            placeholder="Số văn bản, tên văn bản..."
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ width: 350 }}
          />
          <Select
            value={selectedTypeId}
            onChange={setSelectedTypeId}
            placeholder="Loại văn bản"
            allowClear
            style={{ minWidth: 220 }}
            options={documentTypes?.map((t) => ({
              label: t.name,
              value: t.id,
            }))}
          />
          <Button type="primary" loading={isFetching} onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </Space>

        {isError && (
          <Alert
            type="error"
            message="Không thể tải dữ liệu. Vui lòng thử lại."
            showIcon
          />
        )}

        <Spin spinning={isFetching}>
          <Table<PublicDocument>
            sticky
            dataSource={data?.items}
            rowKey="id"
            pagination={pagination.buildConfig(data?.totalCount)}
            locale={{ emptyText: <Empty description="Không có văn bản nào" /> }}
            size="middle"
            scroll={{ x: 1100 }}
          >
            <Table.Column
              title="STT"
              render={(_v, _r, i) =>
                (pagination.page - 1) * pagination.pageSize + i + 1
              }
              width={60}
            />
            <Table.Column
              title="Số văn bản"
              dataIndex="documentNumber"
              width={160}
            />
            <Table.Column title="Tên văn bản" dataIndex="title" ellipsis />
            <Table.Column
              title="Loại văn bản"
              dataIndex="documentTypeName"
              width={140}
            />
            <Table.Column
              title="Cơ quan ban hành"
              dataIndex="issuingAuthority"
              width={180}
            />
            <Table.Column
              title="Ngày ban hành"
              dataIndex="issuedDate"
              width={120}
              render={formatDate}
            />
            <Table.Column<PublicDocument>
              title=""
              width={80}
              render={(_, record) => (
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/tra-cuu-van-ban/${record.id}`)}
                >
                  Xem
                </Button>
              )}
            />
          </Table>
        </Spin>
      </Space>
    </>
  );
}

export default function PublicDocumentsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PublicShell>
      {id ? <DocumentDetailView id={id} /> : <DocumentListView />}
    </PublicShell>
  );
}
