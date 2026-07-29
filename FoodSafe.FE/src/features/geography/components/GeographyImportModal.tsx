import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from "antd";
import { FileExcelOutlined, UploadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload/interface";
import type { GeographicItem } from "@/lib/geographyApi";
import type { ImportGeographyErrorDto, ImportGeographyResultDto } from "@/lib/geographyApi";

interface Props {
  open: boolean;
  importing: boolean;
  provinces: GeographicItem[];
  result?: ImportGeographyResultDto;
  onCancel: () => void;
  onImport: (provinceId: string, file: File) => void;
}

const errorColumns: ColumnsType<ImportGeographyErrorDto> = [
  { title: "Dòng", dataIndex: "rowNumber", width: 80 },
  { title: "Trường", dataIndex: "field", width: 150 },
  { title: "Lỗi", dataIndex: "message" },
];

export function GeographyImportModal({
  open,
  importing,
  provinces,
  result,
  onCancel,
  onImport,
}: Props) {
  const [provinceId, setProvinceId] = useState<string>("");
  const [file, setFile] = useState<RcFile>();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setProvinceId("");
      setFile(undefined);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!provinceId || !file) return;
    onImport(provinceId, file);
  };

  const canSubmit = !!provinceId && !!file && !importing;

  return (
    <Modal
      open={open}
      title="Nhập địa danh từ Excel (DVHCVN)"
      width={700}
      footer={null}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="Định dạng file Excel chuẩn DVHCVN"
          description={
            <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
              <li>Hàng 1 là tiêu đề, dữ liệu bắt đầu từ hàng 2</li>
              <li>Cột A: Mã huyện — Cột B: Tên huyện</li>
              <li>Cột C: Mã xã — Cột D: Tên xã</li>
              <li>Cột E: Loại (Huyện/Quận/Thị xã/Thành phố/Phường/Xã/Thị trấn)</li>
              <li>Chỉ hỗ trợ định dạng .xlsx, tối đa 10 MB</li>
            </ul>
          }
        />

        <div>
          <Typography.Text strong>
            Tỉnh/Thành phố <span style={{ color: "#ff4d4f" }}>*</span>
          </Typography.Text>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn tỉnh/thành phố để nhập địa danh"
            value={provinceId || undefined}
            onChange={setProvinceId}
            style={{ width: "100%", marginTop: 8 }}
            options={provinces.map((p) => ({
              value: p.id,
              label: `${p.code} — ${p.name}`,
            }))}
          />
        </div>

        <Upload.Dragger
          accept=".xlsx"
          maxCount={1}
          disabled={!provinceId}
          fileList={
            file
              ? [
                  {
                    uid: file.name,
                    name: file.name,
                    status: "done",
                    originFileObj: file,
                  },
                ]
              : []
          }
          beforeUpload={(selected) => {
            setFile(selected);
            return false;
          }}
          onRemove={() => {
            setFile(undefined);
            return true;
          }}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined />
          </p>
          <p className="ant-upload-text">
            {provinceId
              ? "Chọn hoặc kéo file Excel vào đây"
              : "Vui lòng chọn tỉnh/thành phố trước"}
          </p>
        </Upload.Dragger>

        <Button
          type="primary"
          icon={<UploadOutlined />}
          disabled={!canSubmit}
          loading={importing}
          onClick={handleSubmit}
        >
          Bắt đầu nhập
        </Button>

        {result && (
          <>
            {result.errors.length === 0 ? (
              <Alert
                type="success"
                showIcon
                message="Nhập địa danh thành công"
                description={
                  <span>
                    Đã xử lý{" "}
                    <strong>{result.importedDistricts}</strong> huyện/quận,{" "}
                    <strong>{result.importedCommunes}</strong> xã/phường
                    {result.skippedRows > 0
                      ? `, bỏ qua ${result.skippedRows} dòng lỗi`
                      : ""}
                    .
                  </span>
                }
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message={`Hoàn thành với ${result.errors.length} lỗi`}
                description={
                  <span>
                    Đã xử lý{" "}
                    <strong>{result.importedDistricts}</strong> huyện/quận,{" "}
                    <strong>{result.importedCommunes}</strong> xã/phường.
                    Bỏ qua <strong>{result.skippedRows}</strong> dòng.
                  </span>
                }
              />
            )}

            {result.errors.length > 0 && (
              <Table<ImportGeographyErrorDto>
                rowKey={(r) => `${r.rowNumber}-${r.field}`}
                size="small"
                pagination={{ pageSize: 10 }}
                columns={errorColumns}
                dataSource={result.errors}
                title={() => (
                  <Typography.Text type="danger">
                    Chi tiết lỗi ({result.errors.length} dòng)
                  </Typography.Text>
                )}
              />
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}
