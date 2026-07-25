import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Form, Input, Modal, Select } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ORGANIZATION_LEVEL } from '../types/organization.types'
import {
  useCommunes,
  useDistricts,
  useProvinces,
} from '@/hooks/useGeography'
import type {
  CreateOrganizationInput,
  OrganizationDto,
} from '../types/organization.types'

const optionalUuid = z.union([
  z.literal(''),
  z.uuid('ID phải là UUID hợp lệ'),
])

const schema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã đơn vị').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên đơn vị').max(200),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  parentId: optionalUuid,
  provinceId: optionalUuid,
  districtId: optionalUuid,
  communeId: optionalUuid,
  address: z.string().max(1000),
  phone: z.string().max(50),
  email: z.union([z.literal(''), z.email('Email không hợp lệ')]),
  leaderName: z.string().max(200),
}).superRefine((value, context) => {
  if (!value.provinceId) {
    context.addIssue({
      code: 'custom',
      path: ['provinceId'],
      message: 'Vui lòng chọn tỉnh/thành phố',
    })
  }
  if (value.level >= ORGANIZATION_LEVEL.District && !value.districtId) {
    context.addIssue({
      code: 'custom',
      path: ['districtId'],
      message: 'Vui lòng chọn huyện/quận',
    })
  }
  if (value.level === ORGANIZATION_LEVEL.Commune && !value.communeId) {
    context.addIssue({
      code: 'custom',
      path: ['communeId'],
      message: 'Vui lòng chọn xã/phường',
    })
  }
  if (value.level > ORGANIZATION_LEVEL.Province && !value.parentId) {
    context.addIssue({
      code: 'custom',
      path: ['parentId'],
      message: 'Cấp huyện/xã phải chọn đơn vị cha',
    })
  }
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  organizations: OrganizationDto[]
  submitting: boolean
  errorMessage?: string
  onCancel: () => void
  onSubmit: (input: CreateOrganizationInput) => void
}

const defaultValues: FormValues = {
  code: '',
  name: '',
  level: ORGANIZATION_LEVEL.Province,
  parentId: '',
  provinceId: '',
  districtId: '',
  communeId: '',
  address: '',
  phone: '',
  email: '',
  leaderName: '',
}

export function OrganizationCreateModal({
  open,
  organizations,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: Props) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const level = watch('level')
  const provinceId = watch('provinceId')
  const districtId = watch('districtId')
  const provinces = useProvinces()
  const districts = useDistricts(provinceId)
  const communes = useCommunes(districtId)

  const close = () => {
    reset(defaultValues)
    onCancel()
  }

  const submit = (values: FormValues) => {
    const nullable = (value: string) => value || null
    onSubmit({
      ...values,
      parentId: nullable(values.parentId),
      provinceId: nullable(values.provinceId),
      districtId: nullable(values.districtId),
      communeId: nullable(values.communeId),
      address: nullable(values.address),
      phone: nullable(values.phone),
      email: nullable(values.email),
      leaderName: nullable(values.leaderName),
    })
  }

  return (
    <Modal
      title="Thêm đơn vị"
      open={open}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={close}
      onOk={() => void handleSubmit(submit)()}
      destroyOnHidden
    >
      {errorMessage && <Alert type="error" message={errorMessage} showIcon />}
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <Form.Item label="Mã đơn vị" required validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
              <Input {...field} autoFocus />
            </Form.Item>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Form.Item label="Tên đơn vị" required validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
              <Input {...field} />
            </Form.Item>
          )}
        />
        <Controller
          name="level"
          control={control}
          render={({ field }) => (
            <Form.Item label="Cấp đơn vị" required>
              <Select
                {...field}
                options={[
                  { value: 1, label: 'Tỉnh' },
                  { value: 2, label: 'Huyện/Thành phố' },
                  { value: 3, label: 'Xã/Phường' },
                ]}
              />
            </Form.Item>
          )}
        />
        {level > ORGANIZATION_LEVEL.Province && (
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Đơn vị cha" required validateStatus={errors.parentId ? 'error' : ''} help={errors.parentId?.message}>
                <Select
                  {...field}
                  options={organizations
                    .filter((item) => item.level === level - 1)
                    .map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` }))}
                />
              </Form.Item>
            )}
          />
        )}
        <Controller
          name="provinceId"
          control={control}
          render={({ field }) => (
            <Form.Item label="Tỉnh/Thành phố" required validateStatus={errors.provinceId ? 'error' : ''} help={errors.provinceId?.message}>
              <Select
                {...field}
                showSearch
                loading={provinces.isLoading}
                optionFilterProp="label"
                options={(provinces.data?.items ?? []).map((item) => ({
                  value: item.id,
                  label: `${item.code} — ${item.name}`,
                }))}
                onChange={(value) => {
                  field.onChange(value)
                  setValue('districtId', '')
                  setValue('communeId', '')
                }}
              />
            </Form.Item>
          )}
        />
        {level >= ORGANIZATION_LEVEL.District && (
          <Controller
            name="districtId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Huyện/Quận" required validateStatus={errors.districtId ? 'error' : ''} help={errors.districtId?.message}>
                <Select
                  {...field}
                  showSearch
                  loading={districts.isLoading}
                  disabled={!provinceId}
                  optionFilterProp="label"
                  options={(districts.data?.items ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.code} — ${item.name}`,
                  }))}
                  onChange={(value) => {
                    field.onChange(value)
                    setValue('communeId', '')
                  }}
                />
              </Form.Item>
            )}
          />
        )}
        {level === ORGANIZATION_LEVEL.Commune && (
          <Controller
            name="communeId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Xã/Phường" required validateStatus={errors.communeId ? 'error' : ''} help={errors.communeId?.message}>
                <Select
                  {...field}
                  showSearch
                  loading={communes.isLoading}
                  disabled={!districtId}
                  optionFilterProp="label"
                  options={(communes.data?.items ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.code} — ${item.name}`,
                  }))}
                />
              </Form.Item>
            )}
          />
        )}
      </Form>
    </Modal>
  )
}
