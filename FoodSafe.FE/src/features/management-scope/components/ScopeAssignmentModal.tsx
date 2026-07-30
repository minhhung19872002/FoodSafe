import { useState } from "react";
import {
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useAdminUsers } from "@/features/identity/api/identityQueries";
import { extractApiError } from "@/lib/apiError";
import { useScopeAssignments } from "../api/managementScopeQueries";
import {
  useCreateScopeAssignment,
  useDeleteScopeAssignment,
} from "../api/managementScopeMutations";
import {
  MANAGEMENT_SCOPE_TYPE,
  type DataScopeAssignment,
  type ManagementScopeType,
} from "../types/managementScope.types";

/** Kiểu dữ liệu được quản lý phạm vi */
export type ScopeDataType = "Business" | "BusinessType" | "ProductGroup";

interface ScopeAssignmentModalProps {
  open: boolean;
  dataType: ScopeDataType;
  onClose: () => void;
}

const DATA_TYPE_LABELS: Record<ScopeDataType, string> = {
  Business: "Cơ sở",
  BusinessType: "Loại hình cơ sở",
  ProductGroup: "Nhóm sản phẩm",
};

const SCOPE_TYPE_MAP: Record<ScopeDataType, ManagementScopeType> = {
  Business: MANAGEMENT_SCOPE_TYPE.Business,
  BusinessType: MANAGEMENT_SCOPE_TYPE.BusinessType,
  ProductGroup: MANAGEMENT_SCOPE_TYPE.ProductGroup,
};

interface AddFormValues {
  granteeUserId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  validFrom?: dayjs.Dayjs;
  validTo?: dayjs.Dayjs;
}

const defaultPerms: Pick<
  AddFormValues,
  "canView" | "canCreate" | "canEdit" | "canDelete"
> = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

export function ScopeAssignmentModal({
  open,
  dataType,
  onClose,
}: ScopeAssignmentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AddFormValues>();
  const [showAddForm, setShowAddForm] = useState(false);

  const scopeType = SCOPE_TYPE_MAP[dataType];
  const targetLabel = DATA_TYPE_LABELS[dataType];

  const assignments = useScopeAssignments(
    { scopeType, maxResultCount: 100 },
    open,
  );

  const users = useAdminUsers({
    isActive: true,
    maxResultCount: 500,
    sorting: "fullName asc",
  });

  const createAssignment = useCreateScopeAssignment();
  const deleteAssignment = useDeleteScopeAssignment();

  const handleAdd = async () => {
    const values = await form.validateFields();
    createAssignment.mutate(
      {
        scopeType,
        granteeUserId: values.granteeUserId,
        canView: values.canView,
        canCreate: values.canCreate,
        canEdit: values.canEdit,
        canDelete: values.canDelete,
        validFrom: values.validFrom?.toISOString(),
        validTo: values.validTo?.toISOString(),
      },
      {
        onSuccess: () => {
          void message.success("Đã thêm phân quyền dữ liệu");
          form.resetFields();
          setShowAddForm(false);
        },
        onError: (error) => void message.error(extractApiError(error)),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteAssignment.mutate(id, {
      onSuccess: () => void message.success("Đã xóa phân quyền"),
      onError: (error) => void message.error(extractApiError(error)),
    });
  };

  const columns: ColumnsType<DataScopeAssignment> = [
    {
      title: "Người dùng",
      dataIndex: "granteeUserName",
      render: (name: string | undefined, record: DataScopeAssignment) =>
        name ?? record.granteeUserId ?? "(Toàn đơn vị)",
      width: 240,
    },
    {
      title: "Quyền",
      render: (_: unknown, record) => (
        <Space size={4} wrap>
          {record.canView && <Tag color="blue">Xem</Tag>}
          {record.canCreate && <Tag color="green">Tạo</Tag>}
          {record.canEdit && <Tag color="orange">Sửa</Tag>}
          {record.canDelete && <Tag color="red">Xóa</Tag>}
        </Space>
      ),
      width: 200,
    },
    {
      title: "Hiệu lực từ",
      dataIndex: "validFrom",
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
      width: 120,
    },
    {
      title: "Hiệu lực đến",
      dataIndex: "validTo",
      render: (v?: string) =>
        v ? dayjs(v).format("DD/MM/YYYY") : "Không giới hạn",
      width: 140,
    },
    {
      title: "",
      key: "actions",
      fixed: "right" as const,
      width: 60,
      render: (_: unknown, record) => (
        <Popconfirm
          title="Xóa phân quyền này?"
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={deleteAssignment.isPending}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={`Phân quyền dữ liệu — ${targetLabel}`}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Table
        rowKey="id"
        dataSource={assignments.data?.items ?? []}
        columns={columns}
        loading={assignments.isLoading}
        size="small"
        pagination={false}
        locale={{ emptyText: "Chưa có phân quyền nào" }}
        scroll={{ x: 640 }}
      />

      <Divider />

      {showAddForm ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultPerms}
          onFinish={handleAdd}
        >
          <Form.Item
            name="granteeUserId"
            label="Người dùng"
            rules={[
              { required: true, message: "Vui lòng chọn người dùng" },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Tìm người dùng..."
              loading={users.isLoading}
              options={(users.data?.items ?? []).map((u) => ({
                value: u.id,
                label: `${u.fullName} (${u.email})`,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col>
              <Form.Item
                name="canView"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Xem</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="canCreate"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Tạo mới</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="canEdit"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Sửa</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="canDelete"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Xóa</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12}>
              <Form.Item name="validFrom" label="Hiệu lực từ ngày">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Hôm nay (mặc định)"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="validTo" label="Hiệu lực đến ngày">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Không giới hạn"
                />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={createAssignment.isPending}
            >
              Lưu phân quyền
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
          </Space>
        </Form>
      ) : (
        <Button
          icon={<PlusOutlined />}
          onClick={() => setShowAddForm(true)}
          type="dashed"
          block
        >
          Thêm phân quyền mới
        </Button>
      )}
    </Modal>
  );
}
