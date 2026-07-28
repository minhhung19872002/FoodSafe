import { useState } from "react";
import { Alert, Empty, Input, Space, Spin, Table, Typography } from "antd";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import { usePublicDocuments } from "../api/publicPortalQueries";

function formatDate(iso: string) {
  return iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";
}

export default function PublicDocumentsPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicDocuments(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Tra cứu văn bản pháp quy
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Tra cứu văn bản pháp luật, quy định về an toàn thực phẩm do cơ quan có
        thẩm quyền ban hành.
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
          <Input
            value={keyword}
            placeholder="Số văn bản, tên văn bản..."
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Input.Search
            enterButton="Tìm kiếm"
            loading={isFetching}
            onSearch={handleSearch}
          />
        </Space.Compact>

        {isError && (
          <Alert
            type="error"
            message="Không thể tải dữ liệu. Vui lòng thử lại."
            showIcon
          />
        )}

        <Spin spinning={isFetching}>
          <Table
            dataSource={data?.items}
            rowKey={(row) => row.documentNumber || row.title}
            pagination={pagination.buildConfig(data?.totalCount)}
            locale={{ emptyText: <Empty description="Không có văn bản nào" /> }}
            size="middle"
            scroll={{ x: 1000 }}
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
            <Table.Column title="Tên văn bản" dataIndex="title" />
            <Table.Column
              title="Loại văn bản"
              dataIndex="documentTypeName"
              width={140}
            />
            <Table.Column
              title="Cơ quan ban hành"
              dataIndex="issuingAuthority"
              width={200}
            />
            <Table.Column
              title="Ngày ban hành"
              dataIndex="issuedDate"
              width={120}
              render={formatDate}
            />
            <Table.Column
              title="Ngày hiệu lực"
              dataIndex="effectiveDate"
              width={120}
              render={formatDate}
            />
            <Table.Column
              title="Tóm tắt"
              dataIndex="summary"
              ellipsis={{ showTitle: true }}
            />
          </Table>
        </Spin>
      </Space>
    </PublicShell>
  );
}
