import { useEffect, useState } from "react";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Upload,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { testingResultApi } from "../api/testingResultApi";
import {
  TESTING_OUTCOME,
  TESTING_OUTCOME_CONFIG,
  type CreateUpdateTestingResultInput,
  type LookupOption,
  type TestingOutcome,
  type TestingResult,
} from "../types/testingResult.types";

interface FormValues {
  sampleCode: string;
  sampleName: string;
  description?: string;
  testingCenterId: string;
  testingServiceId?: string;
  businessId?: string;
  productId?: string;
  inspectionResultId?: string;
  sampleDate: Dayjs;
  submissionDate?: Dayjs;
  resultDate?: Dayjs;
  outcome: TestingOutcome;
  failedCriteria?: string;
  certificateNumber?: string;
  isPublic: boolean;
}

/** One dropdown's data as handed down by the container. */
export interface OptionSource {
  items: LookupOption[];
  loading: boolean;
}

interface Props {
  open: boolean;
  item: TestingResult | null;
  saving: boolean;
  testingCenters: OptionSource;
  testingServices: OptionSource;
  businesses: OptionSource;
  products: OptionSource;
  /** `null` when the user lacks `Inspection.Results.View` — field is hidden. */
  inspectionResults: OptionSource | null;
  onBusinessChange: (businessId?: string) => void;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateTestingResultInput) => void;
}

const OUTCOME_OPTIONS = Object.entries(TESTING_OUTCOME_CONFIG).map(
  ([value, config]) => ({ value: Number(value), label: config.label }),
);

function trimmed(value?: string): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

export function TestingResultEditorModal(props: Props) {
  const { open, item, businesses, products, inspectionResults } = props;
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const selectedBusinessId = Form.useWatch("businessId", form);

  // PDF storagePath state — kept outside Ant Design form because the value
  // comes from a server upload response, not a standard form control.
  const [storagePath, setStoragePath] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setStoragePath(undefined);
    setUploading(false);
    if (item) {
      setStoragePath(item.storagePath ?? undefined);
      form.setFieldsValue({
        sampleCode: item.sampleCode,
        sampleName: item.sampleName,
        description: item.description ?? undefined,
        testingCenterId: item.testingCenterId,
        testingServiceId: item.testingServiceId ?? undefined,
        businessId: item.businessId ?? undefined,
        productId: item.productId ?? undefined,
        inspectionResultId: item.inspectionResultId ?? undefined,
        sampleDate: dayjs(item.sampleDate),
        submissionDate: item.submissionDate
          ? dayjs(item.submissionDate)
          : undefined,
        resultDate: item.resultDate ? dayjs(item.resultDate) : undefined,
        outcome: item.outcome,
        failedCriteria: item.failedCriteria ?? undefined,
        certificateNumber: item.certificateNumber ?? undefined,
        isPublic: item.isPublic,
      });
    } else {
      form.setFieldsValue({
        outcome: TESTING_OUTCOME.Pass,
        isPublic: false,
      });
    }
  }, [form, open, item]);

  // Changing the facility invalidates anything scoped to the previous one.
  const handleBusinessChange = (businessId?: string) => {
    form.setFieldsValue({
      productId: undefined,
      inspectionResultId: undefined,
    });
    props.onBusinessChange(businessId);
  };

  function handlePdfUpload(file: File) {
    const MAX_PDF_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_PDF_BYTES) {
      void message.error("Phiếu kiểm nghiệm không được vượt quá 10MB.");
      return;
    }
    setUploading(true);
    testingResultApi
      .uploadPdf(file)
      .then((result) => {
        setStoragePath(result.storagePath);
        void message.success("Đã tải lên phiếu kiểm nghiệm.");
      })
      .catch(() => {
        void message.error("Không thể tải lên phiếu kiểm nghiệm.");
      })
      .finally(() => {
        setUploading(false);
      });
  }

  return (
    <Modal
      title={item ? "Sửa kết quả" : "Nhập kết quả kiểm nghiệm"}
      open={open}
      onCancel={props.onCancel}
      destroyOnHidden
      width={640}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      okButtonProps={{ disabled: uploading }}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            sampleCode: values.sampleCode.trim(),
            sampleName: values.sampleName.trim(),
            description: trimmed(values.description),
            testingCenterId: values.testingCenterId,
            testingServiceId: values.testingServiceId || undefined,
            businessId: values.businessId || undefined,
            productId: values.productId || undefined,
            inspectionResultId: values.inspectionResultId || undefined,
            sampleDate: values.sampleDate.toISOString(),
            submissionDate: values.submissionDate?.toISOString(),
            resultDate: values.resultDate?.toISOString(),
            outcome: values.outcome,
            failedCriteria: trimmed(values.failedCriteria),
            certificateNumber: trimmed(values.certificateNumber),
            isPublic: values.isPublic ?? false,
            storagePath: storagePath || undefined,
          })
        }
      >
        <Space style={{ width: "100%" }}>
          <Form.Item
            name="sampleCode"
            label="Mã mẫu"
            rules={[{ required: true, message: "Vui lòng nhập mã mẫu" }]}
          >
            <Input style={{ width: 200 }} />
          </Form.Item>
          <Form.Item
            name="sampleName"
            label="Tên mẫu"
            rules={[{ required: true, message: "Vui lòng nhập tên mẫu" }]}
          >
            <Input style={{ width: 380 }} />
          </Form.Item>
        </Space>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space style={{ width: "100%" }}>
          <Form.Item
            name="businessId"
            label="Cơ sở lấy mẫu"
            extra="Bỏ trống nếu mẫu không gắn với cơ sở cụ thể."
          >
            <Select
              style={{ width: 290 }}
              placeholder="Chọn cơ sở lấy mẫu"
              allowClear
              showSearch
              optionFilterProp="label"
              loading={businesses.loading}
              options={businesses.items}
              onChange={handleBusinessChange}
            />
          </Form.Item>
          <Form.Item
            name="productId"
            label="Sản phẩm"
            extra="Danh sách sản phẩm theo cơ sở đã chọn."
          >
            <Select
              style={{ width: 290 }}
              placeholder={
                selectedBusinessId
                  ? "Chọn sản phẩm"
                  : "Chọn cơ sở lấy mẫu trước"
              }
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!selectedBusinessId}
              loading={products.loading}
              options={products.items}
              notFoundContent="Cơ sở này chưa có sản phẩm"
            />
          </Form.Item>
        </Space>
        {inspectionResults && (
          // Label deliberately avoids the prefix "Kết quả": the outcome field
          // below is targeted by e2e via getByRole("combobox", { name: "Kết
          // quả" }), which matches accessible names by substring.
          <Form.Item
            name="inspectionResultId"
            label="Đợt kiểm tra liên quan"
            extra="Chỉ liệt kê các đợt kiểm tra của cơ sở đã chọn."
          >
            <Select
              style={{ width: 290 }}
              placeholder={
                selectedBusinessId
                  ? "Chọn đợt kiểm tra"
                  : "Chọn cơ sở lấy mẫu trước"
              }
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!selectedBusinessId}
              loading={inspectionResults.loading}
              options={inspectionResults.items}
              notFoundContent="Cơ sở này chưa có kết quả kiểm tra"
            />
          </Form.Item>
        )}
        <Space style={{ width: "100%" }}>
          <Form.Item
            name="testingCenterId"
            label="Cơ sở kiểm nghiệm"
            rules={[{ required: true, message: "Vui lòng chọn cơ sở KN" }]}
          >
            <Select
              style={{ width: 290 }}
              placeholder="Chọn cơ sở kiểm nghiệm"
              showSearch
              optionFilterProp="label"
              loading={props.testingCenters.loading}
              options={props.testingCenters.items}
            />
          </Form.Item>
          <Form.Item name="testingServiceId" label="Dịch vụ KN">
            <Select
              style={{ width: 290 }}
              placeholder="Chọn dịch vụ kiểm nghiệm"
              allowClear
              showSearch
              optionFilterProp="label"
              loading={props.testingServices.loading}
              options={props.testingServices.items}
            />
          </Form.Item>
        </Space>
        <Space style={{ width: "100%" }}>
          <Form.Item
            name="sampleDate"
            label="Ngày lấy mẫu"
            rules={[{ required: true, message: "Vui lòng chọn ngày lấy mẫu" }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="submissionDate" label="Ngày nộp">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="resultDate" label="Ngày kết quả">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
        </Space>
        <Form.Item
          name="outcome"
          label="Kết quả"
          rules={[{ required: true, message: "Vui lòng chọn kết quả" }]}
        >
          <Select style={{ width: 200 }} options={OUTCOME_OPTIONS} />
        </Form.Item>
        <Form.Item name="failedCriteria" label="Chỉ tiêu không đạt">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="certificateNumber" label="Số phiếu kiểm nghiệm">
          <Input />
        </Form.Item>
        <Form.Item
          label="Phiếu kiểm nghiệm (PDF)"
          extra="Chỉ chấp nhận file PDF, tối đa 10MB."
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Upload
              accept="application/pdf"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                handlePdfUpload(file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {storagePath
                  ? "Tải lên phiếu mới"
                  : "Tải lên phiếu kiểm nghiệm"}
              </Button>
            </Upload>
            {storagePath && (
              <Button
                type="link"
                icon={<DownloadOutlined />}
                href={testingResultApi.pdfUrl(storagePath)}
                target="_blank"
                style={{ padding: 0 }}
              >
                Xem phiếu kiểm nghiệm đã tải lên
              </Button>
            )}
          </Space>
        </Form.Item>
        <Form.Item name="isPublic" label="Công khai" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
