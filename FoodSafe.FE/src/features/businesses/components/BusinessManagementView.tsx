import type { TablePaginationConfig } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Table, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { RowActions } from "@/components/RowActions";
import {
  BUSINESS_STATUS,
  PRODUCT_STATUS,
  type Business,
  type BusinessStatus,
  type Product,
  type ProductStatus,
} from "../types/business.types";

export interface FilterOption {
  value: string;
  label: string;
}

interface BusinessManagementViewProps {
  activeTab: "businesses" | "products";
  businesses: Business[];
  products: Product[];
  businessFilter: string;
  productFilter: string;
  businessStatus?: BusinessStatus;
  productStatus?: ProductStatus;
  businessTypeId?: string;
  businessClassificationId?: string;
  provinceId?: string;
  businessSorting?: string;
  productSorting?: string;
  businessTypeOptions: FilterOption[];
  classificationOptions: FilterOption[];
  provinceOptions: FilterOption[];
  onBusinessTypeChange: (value?: string) => void;
  onClassificationChange: (value?: string) => void;
  onProvinceChange: (value?: string) => void;
  onBusinessSortingChange: (value?: string) => void;
  onProductSortingChange: (value?: string) => void;
  onShowDetail: (business: Business) => void;
  businessPagination: TablePaginationConfig;
  productPagination: TablePaginationConfig;
  loading: boolean;
  canViewBusinesses: boolean;
  canViewProducts: boolean;
  permissions: {
    createBusiness: boolean;
    editBusiness: boolean;
    deleteBusiness: boolean;
    importBusiness: boolean;
    importProduct: boolean;
    createProduct: boolean;
    editProduct: boolean;
    deleteProduct: boolean;
  };
  onTabChange: (tab: "businesses" | "products") => void;
  onBusinessFilterChange: (value: string) => void;
  onProductFilterChange: (value: string) => void;
  onBusinessStatusChange: (value?: BusinessStatus) => void;
  onProductStatusChange: (value?: ProductStatus) => void;
  onCreateBusiness: () => void;
  onImportBusiness: () => void;
  onExportBusiness: () => void;
  onImportProduct: () => void;
  onExportProduct: () => void;
  onEditBusiness: (business: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onShowMap: (business: Business) => void;
  onManageHandlers: (business: Business) => void;
  onCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onManageProductAttachments: (product: Product) => void;
  onShowProductDetail: (product: Product) => void;
  onDownloadProfilePdf: (business: Business) => void;
}

const businessStatusLabels: Record<BusinessStatus, string> = {
  [BUSINESS_STATUS.Active]: "Hoạt động",
  [BUSINESS_STATUS.Inactive]: "Ngừng hoạt động",
  [BUSINESS_STATUS.Suspended]: "Đình chỉ",
};

export function BusinessManagementView(props: BusinessManagementViewProps) {
  // Server-side sorting: reflect the active sort in the column header so the
  // control is controlled/testable, and translate header clicks into the
  // "<field> <asc|desc>" string the backend's ApplySorting whitelist parses.
  const sortOrderFor = (field: string): SortOrder => {
    if (!props.businessSorting) return null;
    const [current, direction] = props.businessSorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleBusinessSort = (
    sorter: SorterResult<Business> | SorterResult<Business>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    // Table onChange also fires for pagination; only react when the sort
    // actually changed so paging never silently resets to page 1.
    if (next !== props.businessSorting) {
      props.onBusinessSortingChange(next);
    }
  };

  const sortOrderForProduct = (field: string): SortOrder => {
    if (!props.productSorting) return null;
    const [current, direction] = props.productSorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleProductSort = (
    sorter: SorterResult<Product> | SorterResult<Product>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== props.productSorting) {
      props.onProductSortingChange(next);
    }
  };

  const businessColumns: ColumnsType<Business> = [
    {
      title: "Mã",
      dataIndex: "code",
      width: 120,
      sorter: true,
      sortOrder: sortOrderFor("code"),
    },
    {
      title: "Tên cơ sở",
      dataIndex: "name",
      ellipsis: true,
      sorter: true,
      sortOrder: sortOrderFor("name"),
      showSorterTooltip: false,
    },
    { title: "Địa chỉ", dataIndex: "addressStreet", ellipsis: true },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      sorter: true,
      sortOrder: sortOrderFor("status"),
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
      width: 120,
      fixed: "right",
      render: (_: unknown, business) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${business.name}`}
          actions={[
            {
              key: "detail",
              label: "Hồ sơ",
              ariaLabel: `Hồ sơ ${business.name}`,
              icon: <FolderOpenOutlined />,
              onClick: () => props.onShowDetail(business),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${business.name}`,
              icon: <EditOutlined />,
              hidden:
                !props.permissions.editBusiness || business.canEdit === false,
              onClick: () => props.onEditBusiness(business),
            },
            {
              key: "handlers",
              label: "Người phụ trách",
              ariaLabel: `Người phụ trách ${business.name}`,
              icon: <TeamOutlined />,
              hidden:
                !props.permissions.editBusiness || business.canEdit === false,
              onClick: () => props.onManageHandlers(business),
            },
            {
              key: "map",
              label: "Bản đồ",
              ariaLabel: `Bản đồ ${business.name}`,
              icon: <EnvironmentOutlined />,
              hidden: business.addressLatitude === undefined,
              onClick: () => props.onShowMap(business),
            },
            {
              key: "profile-pdf",
              label: "Tải hồ sơ PDF",
              ariaLabel: `Tải hồ sơ PDF ${business.name}`,
              icon: <FilePdfOutlined />,
              onClick: () => props.onDownloadProfilePdf(business),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${business.name}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden:
                !props.permissions.deleteBusiness ||
                business.canDelete === false,
              confirm: "Xóa cơ sở này?",
              onClick: () => props.onDeleteBusiness(business.id),
            },
          ]}
        />
      ),
    },
  ];

  const productColumns: ColumnsType<Product> = [
    { title: "Mã", dataIndex: "code", width: 120 },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      ellipsis: true,
      sorter: true,
      sortOrder: sortOrderForProduct("name"),
      showSorterTooltip: false,
    },
    { title: "Thương hiệu", dataIndex: "brandName", ellipsis: true },
    { title: "Nhà sản xuất", dataIndex: "manufacturer", ellipsis: true },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      render: (status: ProductStatus) => (
        <Tag color={status === PRODUCT_STATUS.Active ? "success" : "default"}>
          {status === PRODUCT_STATUS.Active ? "Đang kinh doanh" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: "right",
      render: (_: unknown, product) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${product.name}`}
          actions={[
            {
              key: "attachments",
              label: "Tệp đính kèm",
              ariaLabel: `Tệp đính kèm ${product.name}`,
              icon: <PaperClipOutlined />,
              onClick: () => props.onManageProductAttachments(product),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${product.name}`,
              icon: <EditOutlined />,
              hidden: !props.permissions.editProduct,
              onClick: () => props.onEditProduct(product),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${product.name}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !props.permissions.deleteProduct,
              confirm: "Xóa sản phẩm này?",
              onClick: () => props.onDeleteProduct(product.id),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="page-card">
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
          <div className="filter-toolbar" style={{ marginBottom: 16 }}>
            <Input.Search
              allowClear
              value={props.businessFilter}
              placeholder="Tên, mã, MST hoặc địa chỉ"
              onChange={(event) =>
                props.onBusinessFilterChange(event.target.value)
              }
              style={{ width: 280 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              value={props.businessStatus}
              onChange={props.onBusinessStatusChange}
              style={{ width: 150 }}
              options={Object.entries(businessStatusLabels).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Loại hình"
              value={props.businessTypeId}
              onChange={props.onBusinessTypeChange}
              style={{ width: 170 }}
              options={props.businessTypeOptions}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Phân loại"
              value={props.businessClassificationId}
              onChange={props.onClassificationChange}
              style={{ width: 160 }}
              options={props.classificationOptions}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tỉnh/TP"
              value={props.provinceId}
              onChange={props.onProvinceChange}
              style={{ width: 160 }}
              options={props.provinceOptions}
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
            {props.permissions.importBusiness && (
              <Button
                icon={<ImportOutlined />}
                onClick={props.onImportBusiness}
              >
                Import
              </Button>
            )}
            <Button icon={<ExportOutlined />} onClick={props.onExportBusiness}>
              Xuất Excel
            </Button>
          </div>
          <Table
            rowKey="id"
            size="middle"
            scroll={{ x: 900 }}
            loading={props.loading}
            dataSource={props.businesses}
            onRow={(business) => ({
              onDoubleClick: () => props.onShowDetail(business),
              style: { cursor: "pointer" },
            })}
            columns={businessColumns}
            onChange={(_pagination, _filters, sorter) =>
              handleBusinessSort(sorter)
            }
            pagination={props.businessPagination}
          />
        </>
      ) : (
        <>
          <div className="filter-toolbar" style={{ marginBottom: 16 }}>
            <Input.Search
              allowClear
              value={props.productFilter}
              placeholder="Tên, mã, thương hiệu, nhà sản xuất"
              onChange={(event) =>
                props.onProductFilterChange(event.target.value)
              }
              style={{ width: 280 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              value={props.productStatus}
              onChange={props.onProductStatusChange}
              style={{ width: 160 }}
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
            {props.permissions.importProduct && (
              <Button icon={<ImportOutlined />} onClick={props.onImportProduct}>
                Import
              </Button>
            )}
            <Button icon={<ExportOutlined />} onClick={props.onExportProduct}>
              Xuất Excel
            </Button>
          </div>
          <Table
            rowKey="id"
            size="middle"
            scroll={{ x: 800 }}
            loading={props.loading}
            dataSource={props.products}
            onRow={(product) => ({
              onDoubleClick: () => props.onShowProductDetail(product),
              style: { cursor: "pointer" },
            })}
            columns={productColumns}
            onChange={(_pagination, _filters, sorter) =>
              handleProductSort(sorter)
            }
            pagination={props.productPagination}
          />
        </>
      )}
    </div>
  );
}
