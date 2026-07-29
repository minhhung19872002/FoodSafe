import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "antd";
import { describe, expect, it, vi } from "vitest";
import { OrganizationListView } from "./OrganizationListView";

describe("OrganizationListView", () => {
  it("renders organization data and forwards search changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onEdit = vi.fn();

    render(
      <App>
        <OrganizationListView
          items={[
            {
              id: "1",
              parentId: null,
              code: "QN",
              name: "Chi cục ATVSTP Quảng Ninh",
              level: 1,
              address: null,
              phone: null,
              email: null,
              leaderName: null,
              provinceId: null,
              districtId: null,
              communeId: null,
              isActive: true,
            },
          ]}
          treeItems={[]}
          loading={false}
          pagination={{
            current: 1,
            pageSize: 20,
            total: 1,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: vi.fn(),
          }}
          filter=""
          canCreate
          canEdit
          canDelete={false}
          exporting={false}
          onExport={vi.fn()}
          onFilterChange={onFilterChange}
          onLevelChange={vi.fn()}
          onIsActiveChange={vi.fn()}
          onParentIdChange={vi.fn()}
          parentOptions={[]}
          onRefresh={vi.fn()}
          onCreate={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onShowDetail={vi.fn()}
        />
      </App>,
    );

    expect(screen.getByText("Chi cục ATVSTP Quảng Ninh")).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("Tìm theo mã hoặc tên đơn vị"),
      "QN",
    );
    expect(onFilterChange).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Thêm đơn vị/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Sửa Chi cục ATVSTP Quảng Ninh/i }),
    );
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
  });
});
