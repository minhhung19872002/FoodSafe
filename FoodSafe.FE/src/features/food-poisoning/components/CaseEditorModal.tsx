import { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  AddressLocationPicker,
  emptyAddressLocation,
  type AddressLocation,
} from "@/components/AddressLocationPicker";
import { usePoisoningIncidents } from "../api/foodPoisoningQueries";
import {
  TREATMENT_RESULT_CONFIG,
  VICTIM_GENDER_CONFIG,
  type CreateUpdateCaseInput,
  type FoodPoisoningCase,
  type TreatmentResult,
  type VictimGender,
} from "../types/foodPoisoning.types";

interface VictimFormValue {
  name: string;
  age?: number;
  gender?: VictimGender;
  phone?: string;
  address?: string;
}

interface FormValues {
  reportDate: dayjs.Dayjs;
  occurrenceDate?: dayjs.Dayjs;
  incidentId?: string;
  notes?: string;
  locationDescription: string;
  victims: VictimFormValue[];
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
  /** Có quyền Incidents.View — điều kiện để tải danh sách vụ cho ô gán vụ. */
  canLinkIncident: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateCaseInput) => void;
}

export function CaseEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item, canLinkIncident } = props;

  const [location, setLocation] =
    useState<AddressLocation>(emptyAddressLocation);

  const { data: incidentsData, isLoading: incidentsLoading } =
    usePoisoningIncidents(
      { skipCount: 0, maxResultCount: 200 },
      { enabled: open && canLinkIncident },
    );
  const incidentOptions = (incidentsData?.items ?? []).map((incident) => ({
    value: incident.id,
    label: incident.locationDescription
      ? `${incident.incidentCode} — ${incident.locationDescription}`
      : incident.incidentCode,
  }));
  if (
    item?.incidentId &&
    !incidentOptions.some((option) => option.value === item.incidentId)
  ) {
    incidentOptions.unshift({ value: item.incidentId, label: item.incidentId });
  }

  useEffect(() => {
    if (!open) return;
    if (item) {
      const victimList: VictimFormValue[] =
        item.victims && item.victims.length > 0
          ? item.victims.map((v) => ({
              name: v.name,
              age: v.age,
              gender: v.gender,
              phone: v.phone,
              address: v.address,
            }))
          : item.victimName
            ? [
                {
                  name: item.victimName,
                  age: item.victimAge,
                  gender: item.victimGender,
                  phone: item.victimPhone,
                  address: item.victimAddress,
                },
              ]
            : [{ name: "" }];

      form.setFieldsValue({
        reportDate: dayjs(item.reportDate),
        occurrenceDate: item.occurrenceDate
          ? dayjs(item.occurrenceDate)
          : undefined,
        incidentId: item.incidentId ?? undefined,
        notes: item.notes,
        locationDescription: item.locationDescription,
        victims: victimList,
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
      setLocation({
        provinceId: item.locationProvinceId ?? "",
        communeId: item.locationCommuneId ?? "",
      });
    } else {
      form.setFieldsValue({
        reportDate: dayjs(),
        victims: [{ name: "" }],
      });
      setLocation(emptyAddressLocation());
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
        onFinish={(values) => {
          const street = values.locationDescription.trim();
          const victims = (values.victims ?? [])
            .filter((v) => v.name?.trim())
            .map((v) => ({
              name: v.name.trim(),
              age: v.age,
              gender: v.gender,
              phone: v.phone?.trim() || undefined,
              address: v.address?.trim() || undefined,
            }));

          props.onSubmit({
            reportDate: values.reportDate.format("YYYY-MM-DD"),
            occurrenceDate: values.occurrenceDate?.toISOString(),
            incidentId: values.incidentId,
            notes: values.notes?.trim() || undefined,
            locationDescription: street,
            locationProvinceId: location.provinceId || undefined,
            locationCommuneId: location.communeId || undefined,
            victims,
            victimName: victims[0]?.name || "",
            victimAge: victims[0]?.age,
            victimGender: victims[0]?.gender,
            victimPhone: victims[0]?.phone,
            victimAddress: victims[0]?.address,
            suspectedFood: values.suspectedFood?.trim() || undefined,
            foodSource: values.foodSource?.trim() || undefined,
            foodPreparationDate:
              values.foodPreparationDate?.format("YYYY-MM-DD"),
            symptoms: values.symptoms?.trim() || undefined,
            onsetTime: values.onsetTime?.toISOString(),
            medicalFacility: values.medicalFacility?.trim() || undefined,
            treatmentStartDate: values.treatmentStartDate?.format("YYYY-MM-DD"),
            treatmentResult: values.treatmentResult,
            reporterName: values.reporterName?.trim() || undefined,
            reporterPhone: values.reporterPhone?.trim() || undefined,
            reporterOrganization:
              values.reporterOrganization?.trim() || undefined,
            reporterRelation: values.reporterRelation?.trim() || undefined,
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

        {canLinkIncident && (
          <Form.Item name="incidentId" label="Thuộc vụ ngộ độc">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              loading={incidentsLoading}
              placeholder="Chọn vụ ngộ độc liên quan (nếu có)"
              options={incidentOptions}
            />
          </Form.Item>
        )}

        <Form.List name="victims" initialValue={[{ name: "" }]}>
          {(fields, { add, remove }) => (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>Thông tin nạn nhân</span>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => add({ name: "" })}
                >
                  Thêm nạn nhân
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.key}
                  style={{
                    backgroundColor: "#fafafa",
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 12,
                    border: "1px solid #f0f0f0",
                  }}
                >
                  {fields.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 13,
                          color: "#595959",
                        }}
                      >
                        Nạn nhân #{index + 1}
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Item
                      name={[field.name, "name"]}
                      label="Họ tên"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Vui lòng nhập họ tên nạn nhân.",
                        },
                      ]}
                    >
                      <Input maxLength={200} />
                    </Form.Item>
                    <Form.Item name={[field.name, "age"]} label="Tuổi">
                      <InputNumber
                        min={0}
                        max={200}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "gender"]} label="Giới tính">
                      <Select
                        allowClear
                        options={Object.entries(VICTIM_GENDER_CONFIG).map(
                          ([value, cfg]) => ({
                            value: Number(value),
                            label: cfg.label,
                          }),
                        )}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "phone"]} label="SĐT">
                      <Input maxLength={50} />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name={[field.name, "address"]}
                    label="Địa chỉ nạn nhân"
                    style={{ marginBottom: 0 }}
                  >
                    <Input />
                  </Form.Item>
                </div>
              ))}
            </div>
          )}
        </Form.List>

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
