import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BUSINESS_STATUS,
  PRODUCT_STATUS,
  type Business,
  type BusinessStatus,
  type Product,
  type ProductStatus,
} from "../types/business.types";

interface BusinessManagementViewProps {
  activeTab: "businesses" | "products";
  businesses: Business[];
  products: Product[];
  businessFilter: string;
  productFilter: string;
  businessStatus?: BusinessStatus;
  productStatus?: ProductStatus;
  businessTotal: number;
  productTotal: number;
  businessPage: number;
  productPage: number;
  pageSize: number;
  loading: boolean;
  canViewBusinesses: boolean;
  canViewProducts: boolean;
  permissions: {
    createBusiness: boolean;
    editBusiness: boolean;
    deleteBusiness: boolean;
    createProduct: boolean;
    editProduct: boolean;
    deleteProduct: boolean;
  };
  onTabChange: (tab: "businesses" | "products") => void;
  onBusinessFilterChange: (value: string) => void;
  onProductFilterChange: (value: string) => void;
  onBusinessStatusChange: (value?: BusinessStatus) => void;
  onProductStatusChange: (value?: ProductStatus) => void;
  onBusinessPageChange: (page: number) => void;
  onProductPageChange: (page: number) => void;
  onCreateBusiness: () => void;
  onEditBusiness: (business: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onShowMap: (business: Business) => void;
  onManageHandlers: (business: Business) => void;
  onCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const businessStatusLabels: Record<BusinessStatus, string> = {
  [BUSINESS_STATUS.Active]: "Hoạt động",
  [BUSINESS_STATUS.Inactive]: "Ngừng hoạt động",
  [BUSINESS_STATUS.Suspended]: "Đình chỉ",
};

export function BusinessManagementView(props: BusinessManagementViewProps) {
  const businessColumns: ColumnsType<Business> = [
    { title: "Mã", dataIndex: "code", width: 120 },
    { title: "Tên cơ sở", dataIndex: "name" },
    { title: "Địa chỉ", dataIndex: "addressStreet" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (status: BusinessStatus) => (
        <Tag
          color={
            status === BUSINESS_STATUS.Active
              ? "success"
              : status === BUSINESS_STATUS.Suspended
                ? "error"
                : "default"
          }
        >
          {businessStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Giấy phép",
      dataIndex: "hasEligibilityCertificate",
      width: 130,
      render: (value: boolean) => (
        <Tag color={value ? "blue" : "default"}>
          {value ? "Đang hiệu lực" : "Chưa có"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width: 150,
      render: (_: unknown, business) => (
        <Space>
          <Button
            type="text"
            aria-label={`Người phụ trách ${business.name}`}
            icon={<TeamOutlined />}
            onClick={() => props.onManageHandlers(business)}
          />
          {business.addressLatitude !== undefined && (
            <Button
              type="text"
              aria-label={`Bản đồ ${business.name}`}
              icon={<EnvironmentOutlined />}
              onClick={() => props.onShowMap(business)}
            />
          )}
          {props.permissions.editBusiness && (
            <Button
              type="text"
              aria-label={`Sửa ${business.name}`}
              icon={<EditOutlined />}
              onClick={() => props.onEditBusiness(business)}
            />
          )}
          {props.permissions.deleteBusiness && (
            <Popconfirm
              title="Xóa cơ sở này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => props.onDeleteBusiness(business.id)}
            >
              <Button
                type="text"
                danger
                aria-label={`Xóa ${business.name}`}
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const productColumns: ColumnsType<Product> = [
    { title: "Mã", dataIndex: "code", width: 120 },
    { title: "Tên sản phẩm", dataIndex: "name" },
    { title: "Thương hiệu", dataIndex: "brandName" },
    { title: "Nhà sản xuất", dataIndex: "manufacturer" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (status: ProductStatus) => (
        <Tag color={status === PRODUCT_STATUS.Active ? "success" : "default"}>
          {status === PRODUCT_STATUS.Active ? "Đang kinh doanh" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width: 110,
      render: (_: unknown, product) => (
        <Space>
          {props.permissions.editProduct && (
            <Button
              type="text"
              aria-label={`Sửa ${product.name}`}
              icon={<EditOutlined />}
              onClick={() => props.onEditProduct(product)}
            />
          )}
          {props.permissions.deleteProduct && (
            <Popconfirm
              title="Xóa sản phẩm này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => props.onDeleteProduct(product.id)}
            >
              <Button
                type="text"
                danger
                aria-label={`Xóa ${product.name}`}
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Tabs
        activeKey={props.activeTab}
        onChange={(key) => props.onTabChange(key as "businesses" | "products")}
        items={[
          ...(props.canViewBusinesses
            ? [{ key: "businesses", label: "Cơ sở SXKD" }]
            : []),
          ...(props.canViewProducts
            ? [{ key: "products", label: "Sản phẩm" }]
            : []),
        ]}
      />
      {props.activeTab === "businesses" ? (
        <>
          <Space wrap style={{ marginBottom: 16 }}>
            <Input.Search
              allowClear
              value={props.businessFilter}
              placeholder="Tên, mã, MST hoặc địa chỉ"
              onChange={(event) =>
                props.onBusinessFilterChange(event.target.value)
              }
              style={{ width: 320 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              value={props.businessStatus}
              onChange={props.onBusinessStatusChange}
              style={{ width: 180 }}
              options={Object.entries(businessStatusLabels).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
            {props.permissions.createBusiness && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={props.onCreateBusiness}
              >
                Thêm cơ sở
              </Button>
            )}
          </Space>
          <Table
            rowKey="id"
            loading={props.loading}
            dataSource={props.businesses}
            columns={businessColumns}
            pagination={{
              current: props.businessPage,
              pageSize: props.pageSize,
              total: props.businessTotal,
              onChange: props.onBusinessPageChange,
            }}
          />
        </>
      ) : (
        <>
          <Space wrap style={{ marginBottom: 16 }}>
            <Input.Search
              allowClear
              value={props.productFilter}
              placeholder="Tên, mã, thương hiệu, nhà sản xuất"
              onChange={(event) =>
                props.onProductFilterChange(event.target.value)
              }
              style={{ width: 340 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              value={props.productStatus}
              onChange={props.onProductStatusChange}
              style={{ width: 180 }}
              options={[
                { value: PRODUCT_STATUS.Active, label: "Đang kinh doanh" },
                { value: PRODUCT_STATUS.Inactive, label: "Ngừng kinh doanh" },
              ]}
            />
            {props.permissions.createProduct && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={props.onCreateProduct}
              >
                Thêm sản phẩm
              </Button>
            )}
          </Space>
          <Table
            rowKey="id"
            loading={props.loading}
            dataSource={props.products}
            columns={productColumns}
            pagination={{
              current: props.productPage,
              pageSize: props.pageSize,
              total: props.productTotal,
              onChange: props.onProductPageChange,
            }}
          />
        </>
      )}
    </>
  );
}
