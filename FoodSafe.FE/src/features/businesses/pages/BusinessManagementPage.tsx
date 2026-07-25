import { useMemo, useState } from "react";
import { App, Modal, Typography } from "antd";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useCatalogOptions } from "@/features/catalogs/api/catalogQueries";
import { useOrganizationTree } from "@/features/organizations/api/organizationQueries";
import type {
  OrganizationDto,
  OrganizationTreeNode,
} from "@/features/organizations/types/organization.types";
import {
  useAddBusinessHandler,
  useCreateBusiness,
  useCreateProduct,
  useDeleteBusiness,
  useDeleteProduct,
  useDeleteBusinessHandler,
  useUpdateBusinessHandler,
  useUpdateBusiness,
  useUpdateProduct,
} from "../api/businessMutations";
import {
  useBusiness,
  useBusinessList,
  useProductBusinessOptions,
  useProductList,
} from "../api/businessQueries";
import { BusinessEditorModal } from "../components/BusinessEditorModal";
import { BusinessHandlersModal } from "../components/BusinessHandlersModal";
import { BusinessManagementView } from "../components/BusinessManagementView";
import { MapPicker } from "../components/MapPicker";
import { ProductEditorModal } from "../components/ProductEditorModal";
import type {
  Business,
  BusinessInput,
  BusinessHandlerInput,
  BusinessStatus,
  Product,
  ProductInput,
  ProductStatus,
  UpdateBusinessInput,
  UpdateProductInput,
} from "../types/business.types";

const pageSize = 20;

function flattenOrganizations(
  nodes: OrganizationTreeNode[],
): OrganizationDto[] {
  return nodes.flatMap((node) => [
    {
      ...node,
      parentId: null,
      address: null,
      phone: null,
      email: null,
      leaderName: null,
      provinceId: null,
      districtId: null,
      communeId: null,
    },
    ...flattenOrganizations(node.children),
  ]);
}

export default function BusinessManagementPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canViewBusinesses = hasPermission(
    "FoodSafe.BusinessManagement.Businesses.View",
  );
  const canViewProducts = hasPermission(
    "FoodSafe.BusinessManagement.Products.View",
  );
  const [activeTab, setActiveTab] = useState<"businesses" | "products">(
    canViewBusinesses ? "businesses" : "products",
  );
  const [businessFilter, setBusinessFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>();
  const [productStatus, setProductStatus] = useState<ProductStatus>();
  const [businessPage, setBusinessPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string>();
  const [editingProduct, setEditingProduct] = useState<Product>();
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [mappedBusiness, setMappedBusiness] = useState<Business>();
  const [managingHandlersBusinessId, setManagingHandlersBusinessId] =
    useState<string>();

  const businessList = useBusinessList(
    {
      filter: businessFilter || undefined,
      status: businessStatus,
      skipCount: (businessPage - 1) * pageSize,
      maxResultCount: pageSize,
    },
    canViewBusinesses,
  );
  const businessOptions = useProductBusinessOptions(canViewProducts);
  const productList = useProductList(
    {
      filter: productFilter || undefined,
      status: productStatus,
      skipCount: (productPage - 1) * pageSize,
      maxResultCount: pageSize,
    },
    canViewProducts,
  );
  const businessDetail = useBusiness(editingBusinessId);
  const handlersBusiness = useBusiness(managingHandlersBusinessId);
  const organizations = useOrganizationTree();
  const businessTypes = useCatalogOptions("business-type");
  const classifications = useCatalogOptions("business-classification");
  const productGroups = useCatalogOptions("product-group");
  const countries = useCatalogOptions("country");
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();
  const addBusinessHandler = useAddBusinessHandler();
  const updateBusinessHandler = useUpdateBusinessHandler();
  const deleteBusinessHandler = useDeleteBusinessHandler();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const organizationOptions = useMemo(
    () => flattenOrganizations(organizations.data?.items ?? []),
    [organizations.data?.items],
  );

  const closeBusinessEditor = () => {
    setCreatingBusiness(false);
    setEditingBusinessId(undefined);
  };

  const saveBusiness = (input: BusinessInput | UpdateBusinessInput) => {
    if (editingBusinessId) {
      updateBusiness.mutate(
        { id: editingBusinessId, input: input as UpdateBusinessInput },
        {
          onSuccess: () => {
            closeBusinessEditor();
            void message.success("Đã cập nhật cơ sở");
          },
          onError: () => void message.error("Không thể cập nhật cơ sở"),
        },
      );
      return;
    }
    createBusiness.mutate(input as BusinessInput, {
      onSuccess: () => {
        closeBusinessEditor();
        void message.success("Đã thêm cơ sở");
      },
      onError: () => void message.error("Không thể thêm cơ sở"),
    });
  };

  const saveProduct = (input: ProductInput | UpdateProductInput) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, input: input as UpdateProductInput },
        {
          onSuccess: () => {
            setEditingProduct(undefined);
            void message.success("Đã cập nhật sản phẩm");
          },
          onError: () => void message.error("Không thể cập nhật sản phẩm"),
        },
      );
      return;
    }
    createProduct.mutate(input as ProductInput, {
      onSuccess: () => {
        setCreatingProduct(false);
        void message.success("Đã thêm sản phẩm");
      },
      onError: () => void message.error("Không thể thêm sản phẩm"),
    });
  };

  return (
    <>
      <Typography.Title level={2}>Cơ sở và sản phẩm</Typography.Title>
      <Typography.Paragraph type="secondary">
        Quản lý cơ sở sản xuất kinh doanh theo phạm vi dữ liệu và sản phẩm trực
        thuộc từng cơ sở.
      </Typography.Paragraph>
      <BusinessManagementView
        activeTab={activeTab}
        businesses={businessList.data?.items ?? []}
        products={productList.data?.items ?? []}
        businessFilter={businessFilter}
        productFilter={productFilter}
        businessStatus={businessStatus}
        productStatus={productStatus}
        businessTotal={businessList.data?.totalCount ?? 0}
        productTotal={productList.data?.totalCount ?? 0}
        businessPage={businessPage}
        productPage={productPage}
        pageSize={pageSize}
        loading={businessList.isLoading || productList.isLoading}
        canViewBusinesses={canViewBusinesses}
        canViewProducts={canViewProducts}
        permissions={{
          createBusiness: hasPermission(
            "FoodSafe.BusinessManagement.Businesses.Create",
          ),
          editBusiness: hasPermission(
            "FoodSafe.BusinessManagement.Businesses.Edit",
          ),
          deleteBusiness: hasPermission(
            "FoodSafe.BusinessManagement.Businesses.Delete",
          ),
          createProduct: hasPermission(
            "FoodSafe.BusinessManagement.Products.Create",
          ),
          editProduct: hasPermission(
            "FoodSafe.BusinessManagement.Products.Edit",
          ),
          deleteProduct: hasPermission(
            "FoodSafe.BusinessManagement.Products.Delete",
          ),
        }}
        onTabChange={setActiveTab}
        onBusinessFilterChange={(value) => {
          setBusinessFilter(value);
          setBusinessPage(1);
        }}
        onProductFilterChange={(value) => {
          setProductFilter(value);
          setProductPage(1);
        }}
        onBusinessStatusChange={(value) => {
          setBusinessStatus(value);
          setBusinessPage(1);
        }}
        onProductStatusChange={(value) => {
          setProductStatus(value);
          setProductPage(1);
        }}
        onBusinessPageChange={setBusinessPage}
        onProductPageChange={setProductPage}
        onCreateBusiness={() => setCreatingBusiness(true)}
        onEditBusiness={(business) => setEditingBusinessId(business.id)}
        onShowMap={setMappedBusiness}
        onManageHandlers={(business) =>
          setManagingHandlersBusinessId(business.id)
        }
        onDeleteBusiness={(id) =>
          deleteBusiness.mutate(id, {
            onSuccess: () => void message.success("Đã xóa cơ sở"),
            onError: () =>
              void message.error("Không thể xóa cơ sở đang được sử dụng"),
          })
        }
        onCreateProduct={() => setCreatingProduct(true)}
        onEditProduct={setEditingProduct}
        onDeleteProduct={(id) =>
          deleteProduct.mutate(id, {
            onSuccess: () => void message.success("Đã xóa sản phẩm"),
            onError: () =>
              void message.error("Không thể xóa sản phẩm đang được sử dụng"),
          })
        }
      />
      {(creatingBusiness || businessDetail.data) && (
        <BusinessEditorModal
          open
          business={businessDetail.data}
          organizations={organizationOptions}
          businessTypes={businessTypes.data?.items ?? []}
          classifications={classifications.data?.items ?? []}
          productGroups={productGroups.data?.items ?? []}
          submitting={createBusiness.isPending || updateBusiness.isPending}
          onCancel={closeBusinessEditor}
          onSubmit={saveBusiness}
        />
      )}
      <ProductEditorModal
        open={creatingProduct || Boolean(editingProduct)}
        product={editingProduct}
        businesses={businessOptions.data ?? []}
        productGroups={productGroups.data?.items ?? []}
        countries={countries.data?.items ?? []}
        submitting={createProduct.isPending || updateProduct.isPending}
        onCancel={() => {
          setCreatingProduct(false);
          setEditingProduct(undefined);
        }}
        onSubmit={saveProduct}
      />
      <BusinessHandlersModal
        open={Boolean(managingHandlersBusinessId)}
        business={handlersBusiness.data}
        editable={hasPermission("FoodSafe.BusinessManagement.Businesses.Edit")}
        submitting={
          addBusinessHandler.isPending || updateBusinessHandler.isPending
        }
        onCancel={() => setManagingHandlersBusinessId(undefined)}
        onSave={(handlerId, input: BusinessHandlerInput) => {
          const businessId = managingHandlersBusinessId;
          if (!businessId) return;
          const options = {
            onSuccess: () => {
              setManagingHandlersBusinessId(undefined);
              void message.success("Đã lưu người phụ trách");
            },
            onError: () => void message.error("Không thể lưu người phụ trách"),
          };
          if (handlerId) {
            updateBusinessHandler.mutate(
              { businessId, handlerId, input },
              options,
            );
          } else {
            addBusinessHandler.mutate({ businessId, input }, options);
          }
        }}
        onDelete={(handlerId) => {
          const businessId = managingHandlersBusinessId;
          if (!businessId) return;
          deleteBusinessHandler.mutate(
            { businessId, handlerId },
            {
              onSuccess: () => void message.success("Đã xóa người phụ trách"),
              onError: () =>
                void message.error("Không thể xóa người phụ trách"),
            },
          );
        }}
      />
      <Modal
        open={Boolean(mappedBusiness)}
        title={mappedBusiness?.name}
        footer={null}
        onCancel={() => setMappedBusiness(undefined)}
        destroyOnHidden
      >
        {mappedBusiness?.addressLatitude !== undefined && (
          <MapPicker
            latitude={mappedBusiness.addressLatitude}
            longitude={mappedBusiness.addressLongitude}
            onChange={() => undefined}
          />
        )}
      </Modal>
    </>
  );
}
