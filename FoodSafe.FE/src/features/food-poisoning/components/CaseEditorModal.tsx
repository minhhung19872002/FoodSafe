import { useEffect } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import {
  TREATMENT_RESULT_CONFIG,
  VICTIM_GENDER_CONFIG,
  type CreateUpdateCaseInput,
  type FoodPoisoningCase,
  type TreatmentResult,
  type VictimGender,
} from "../types/foodPoisoning.types";

interface FormValues {
  reportDate: dayjs.Dayjs;
  occurrenceDate?: dayjs.Dayjs;
  notes?: string;
  locationDescription?: string;
  victimName?: string;
  victimAge?: number;
  victimGender?: VictimGender;
  victimPhone?: string;
  victimAddress?: string;
  suspectedFood?: string;
  foodSource?: string;
  foodPreparationDate?: dayjs.Dayjs;
  symptoms?: string;
  onsetTime?: dayjs.Dayjs;
  medicalFacility?: string;
  treatmentStartDate?: dayjs.Dayjs;
  treatmentResult?: TreatmentResult;
  reporterName?: string;
  reporterPhone?: string;
  reporterOrganization?: string;
  reporterRelation?: string;
}

interface Props {
  open: boolean;
  item?: FoodPoisoningCase;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateCaseInput) => void;
}

export function CaseEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        reportDate: dayjs(item.reportDate),
        occurrenceDate: item.occurrenceDate
          ? dayjs(item.occurrenceDate)
          : undefined,
        notes: item.notes,
        locationDescription: item.locationDescription,
        victimName: item.victimName,
        victimAge: item.victimAge,
        victimGender: item.victimGender,
        victimPhone: item.victimPhone,
        victimAddress: item.victimAddress,
        suspectedFood: item.suspectedFood,
        foodSource: item.foodSource,
        foodPreparationDate: item.foodPreparationDate
          ? dayjs(item.foodPreparationDate)
          : undefined,
        symptoms: item.symptoms,
        onsetTime: item.onsetTime ? dayjs(item.onsetTime) : undefined,
        medicalFacility: item.medicalFacility,
        treatmentStartDate: item.treatmentStartDate
          ? dayjs(item.treatmentStartDate)
          : undefined,
        treatmentResult: item.treatmentResult,
        reporterName: item.reporterName,
        reporterPhone: item.reporterPhone,
        reporterOrganization: item.reporterOrganization,
        reporterRelation: item.reporterRelation,
      });
    } else {
      form.setFieldsValue({ reportDate: dayjs() });
    }
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={item ? "Sửa ca ngộ độc" : "Tạo ca ngộ độc mới"}
      width={900}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            reportDate: values.reportDate.format("YYYY-MM-DD"),
            occurrenceDate: values.occurrenceDate?.toISOString(),
            notes: values.notes?.trim() || undefined,
            locationDescription:
              values.locationDescription?.trim() || undefined,
            victimName: values.victimName?.trim() || undefined,
            victimAge: values.victimAge,
            victimGender: values.victimGender,
            victimPhone: values.victimPhone?.trim() || undefined,
            victimAddress: values.victimAddress?.trim() || undefined,
            suspectedFood: values.suspectedFood?.trim() || undefined,
            foodSource: values.foodSource?.trim() || undefined,
            foodPreparationDate: values.foodPreparationDate?.format(
              "YYYY-MM-DD",
            ),
            symptoms: values.symptoms?.trim() || undefined,
            onsetTime: values.onsetTime?.toISOString(),
            medicalFacility: values.medicalFacility?.trim() || undefined,
            treatmentStartDate: values.treatmentStartDate?.format(
              "YYYY-MM-DD",
            ),
            treatmentResult: values.treatmentResult,
            reporterName: values.reporterName?.trim() || undefined,
            reporterPhone: values.reporterPhone?.trim() || undefined,
            reporterOrganization:
              values.reporterOrganization?.trim() || undefined,
            reporterRelation: values.reporterRelation?.trim() || undefined,
          })
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item
            name="reportDate"
            label="Ngày báo cáo"
            rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="occurrenceDate" label="Thời điểm xảy ra">
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <Form.Item name="locationDescription" label="Địa điểm xảy ra">
          <Input />
        </Form.Item>

        <div
          style={{
            marginBottom: 8,
            fontWeight: 600,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 4,
          }}
        >
          Thông tin nạn nhân
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="victimName" label="Họ tên">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="victimAge" label="Tuổi">
            <InputNumber min={0} max={200} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="victimGender" label="Giới tính">
            <Select
              allowClear
              options={Object.entries(VICTIM_GENDER_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
          <Form.Item name="victimPhone" label="SĐT">
            <Input maxLength={50} />
          </Form.Item>
        </div>
        <Form.Item name="victimAddress" label="Địa chỉ nạn nhân">
          <Input />
        </Form.Item>

        <div
          style={{
            marginBottom: 8,
            fontWeight: 600,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 4,
          }}
        >
          Thông tin thực phẩm nghi ngờ
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="suspectedFood" label="Thực phẩm nghi ngờ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="symptoms" label="Triệu chứng">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="foodSource" label="Nguồn thực phẩm">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="foodPreparationDate" label="Ngày chế biến">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="onsetTime" label="Thời gian khởi phát">
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <div
          style={{
            marginBottom: 8,
            fontWeight: 600,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 4,
          }}
        >
          Thông tin y tế
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="medicalFacility" label="Cơ sở y tế">
            <Input maxLength={300} />
          </Form.Item>
          <Form.Item name="treatmentStartDate" label="Ngày điều trị">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="treatmentResult" label="Kết quả điều trị">
            <Select
              allowClear
              options={Object.entries(TREATMENT_RESULT_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
        </div>

        <div
          style={{
            marginBottom: 8,
            fontWeight: 600,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 4,
          }}
        >
          Người báo cáo
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="reporterName" label="Họ tên">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="reporterPhone" label="SĐT">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="reporterOrganization" label="Đơn vị">
            <Input maxLength={300} />
          </Form.Item>
          <Form.Item name="reporterRelation" label="Mối quan hệ">
            <Input maxLength={100} />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
