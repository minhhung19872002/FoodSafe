import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RolePermissionsDrawer } from "./RolePermissionsDrawer";

const role = {
  id: "role-id",
  name: "Inspector",
  isActive: true,
  isStatic: false,
  userCount: 0,
  creationTime: "2026-07-25T00:00:00Z",
  concurrencyStamp: "stamp",
};

const groups = [
  {
    name: "FoodSafe",
    displayName: "FoodSafe",
    permissions: [
      {
        name: "FoodSafe.Inspections",
        displayName: "Inspections",
        isGranted: false,
      },
      {
        name: "FoodSafe.Inspections.Create",
        displayName: "Create inspections",
        parentName: "FoodSafe.Inspections",
        isGranted: false,
      },
    ],
  },
];

describe("RolePermissionsDrawer", () => {
  it("automatically grants parents when a child permission is selected", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <RolePermissionsDrawer
        role={role}
        groups={groups}
        loading={false}
        saving={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Create inspections" }),
    );
    expect(screen.getByRole("checkbox", { name: "Inspections" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Lưu phân quyền" }));
    expect(onSave).toHaveBeenCalledWith([
      { name: "FoodSafe.Inspections", isGranted: true },
      { name: "FoodSafe.Inspections.Create", isGranted: true },
    ]);
  });

  it("removes descendants when a parent permission is cleared", async () => {
    const user = userEvent.setup();
    render(
      <RolePermissionsDrawer
        role={role}
        groups={[
          {
            ...groups[0],
            permissions: groups[0].permissions.map((item) => ({
              ...item,
              isGranted: true,
            })),
          },
        ]}
        loading={false}
        saving={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Inspections" }));
    expect(
      screen.getByRole("checkbox", { name: "Create inspections" }),
    ).not.toBeChecked();
  });
});
