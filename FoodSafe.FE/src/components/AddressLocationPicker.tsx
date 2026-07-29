import { Col, Form, Row, Select } from "antd";
import { useProvinces, useDistricts, useCommunes } from "@/hooks/useGeography";

export interface AddressLocation {
  provinceId: string;
  districtId: string;
  communeId: string;
}

interface AddressLocationPickerProps {
  value: AddressLocation;
  onChange: (next: AddressLocation) => void;
  readOnly?: boolean;
}

const EMPTY_LOCATION: AddressLocation = {
  provinceId: "",
  districtId: "",
  communeId: "",
};

export function emptyAddressLocation(): AddressLocation {
  return { ...EMPTY_LOCATION };
}

export function AddressLocationPicker({
  value,
  onChange,
  readOnly = false,
}: AddressLocationPickerProps) {
  const provinces = useProvinces(true);
  const districts = useDistricts(value.provinceId, true);
  const communes = useCommunes(value.districtId, true);

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item label="Tỉnh/Thành phố">
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn tỉnh/thành phố"
            value={value.provinceId || undefined}
            disabled={readOnly}
            loading={provinces.isLoading}
            options={provinces.data?.items.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            onChange={(v) => {
              onChange({
                ...value,
                provinceId: v ?? "",
                districtId: "",
                communeId: "",
              });
            }}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Huyện/Quận">
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn huyện/quận"
            value={value.districtId || undefined}
            disabled={readOnly || !value.provinceId}
            loading={districts.isLoading}
            options={districts.data?.items.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
            onChange={(v) => {
              onChange({ ...value, districtId: v ?? "", communeId: "" });
            }}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Xã/Phường">
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn xã/phường"
            value={value.communeId || undefined}
            disabled={readOnly || !value.districtId}
            loading={communes.isLoading}
            options={communes.data?.items.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            onChange={(v) => {
              onChange({ ...value, communeId: v ?? "" });
            }}
            allowClear
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
