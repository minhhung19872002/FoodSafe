import { useEffect, useState } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import {
  AddressLocationPicker,
  emptyAddressLocation,
  type AddressLocation,
} from "@/components/AddressLocationPicker";

import {
  CAUSE_ASSESSMENT_CONFIG,
  type CauseAssessment,
  type CreateUpdateIncidentInput,
  type FoodPoisoningIncident,
} from "../types/foodPoisoning.types";

interface FormValues {
  occurrenceDate: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
  notes?: string;
  locationDescription: string;
  exposedCount: number;
  affectedCount: number;
  hospitalizedCount: number;
  deathCount: number;
  suspectedFood?: string;
  foodSource?: string;
  foodServiceType?: string;
  causeAssessmentValue?: CauseAssessment;
  causativeAgent?: string;
  pathogen?: string;
  investigationTeam?: string;
  controlMeasures?: string;
  preventionMeasures?: string;
}

interface Props {
  open: boolean;
  item?: FoodPoisoningIncident;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateIncidentInput) => void;
}

export function IncidentEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;

  const [location, setLocation] =
    useState<AddressLocation>(emptyAddressLocation);

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        occurrenceDate: item.occurrenceDate
          ? dayjs(item.occurrenceDate)
          : undefined,
        endDate: item.endDate ? dayjs(item.endDate) : undefined,
        notes: item.notes,
        locationDescription: item.locationDescription,
        exposedCount: item.exposedCount,
        affectedCount: item.affectedCount,
        hospitalizedCount: item.hospitalizedCount,
        deathCount: item.deathCount,
        suspectedFood: item.suspectedFood,
        foodSource: item.foodSource,
        foodServiceType: item.foodServiceType,
        causeAssessmentValue: item.causeAssessmentValue,
        causativeAgent: item.causativeAgent,
        pathogen: item.pathogen,
        investigationTeam: item.investigationTeam,
        controlMeasures: item.controlMeasures,
        preventionMeasures: item.preventionMeasures,
      });
      setLocation({
        provinceId: item.locationProvinceId ?? "",
        communeId: item.locationCommuneId ?? "",
      });
    } else {
      form.setFieldsValue({
        exposedCount: 0,
        affectedCount: 0,
        hospitalizedCount: 0,
        deathCount: 0,
      });
      setLocation(emptyAddressLocation());
    }
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={item ? "Sửa vụ ngộ độc" : "Tạo vụ ngộ độc mới"}
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
        onFinish={(values) => {
          const street = values.locationDescription.trim();
          props.onSubmit({
            occurrenceDate: values.occurrenceDate.toISOString(),
            endDate: values.endDate?.toISOString(),
            notes: values.notes?.trim() || undefined,
            locationDescription: street,
            locationProvinceId: location.provinceId || undefined,
            locationCommuneId: location.communeId || undefined,
            exposedCount: values.exposedCount,
            affectedCount: values.affectedCount,
            hospitalizedCount: values.hospitalizedCount,
            deathCount: values.deathCount,
            suspectedFood: values.suspectedFood?.trim() || undefined,
            foodSource: values.foodSource?.trim() || undefined,
            foodServiceType: values.foodServiceType?.trim() || undefined,
            causeAssessmentValue: values.causeAssessmentValue,
            causativeAgent: values.causativeAgent?.trim() || undefined,
            pathogen: values.pathogen?.trim() || undefined,
            investigationTeam: values.investigationTeam?.trim() || undefined,
            controlMeasures: values.controlMeasures?.trim() || undefined,
            preventionMeasures: values.preventionMeasures?.trim() || undefined,
          });
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item
            name="occurrenceDate"
            label="Thời điểm xảy ra"
            rules={[
              { required: true, message: "Vui lòng chọn thời điểm xảy ra." },
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="endDate" label="Thời điểm kết thúc">
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        <AddressLocationPicker value={location} onChange={setLocation} />

        <Form.Item
          name="locationDescription"
          label="Địa chỉ chi tiết"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Vui lòng nhập địa chỉ chi tiết.",
            },
            { max: 500, message: "Địa chỉ không quá 500 ký tự." },
          ]}
        >
          <Input maxLength={500} placeholder="Số nhà, tên đường, thôn/xóm..." />
        </Form.Item>

        <div
          style={{
            marginBottom: 8,
            fontWeight: 600,
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 4,
          }}
        >
          Thống kê
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="exposedCount" label="Số người phơi nhiễm">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="affectedCount" label="Số người mắc">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="hospitalizedCount" label="Số người nhập viện">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="deathCount" label="Số người tử vong">
            <InputNumber min={0} style={{ width: "100%" }} />
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
          Thông tin thực phẩm
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="suspectedFood" label="Thực phẩm nghi ngờ">
            <Input />
          </Form.Item>
          <Form.Item name="foodSource" label="Nguồn thực phẩm">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="foodServiceType" label="Loại hình dịch vụ">
            <Input maxLength={200} />
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
          Nguyên nhân
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="causeAssessmentValue" label="Đánh giá nguyên nhân">
            <Select
              allowClear
              options={Object.entries(CAUSE_ASSESSMENT_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
          <Form.Item name="causativeAgent" label="Tác nhân gây bệnh">
            <Input />
          </Form.Item>
          <Form.Item name="pathogen" label="Vi sinh vật">
            <Input />
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
          Điều tra & Xử lý
        </div>
        <Form.Item name="investigationTeam" label="Đoàn điều tra">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="controlMeasures" label="Biện pháp khắc phục">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="preventionMeasures" label="Biện pháp phòng ngừa">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
