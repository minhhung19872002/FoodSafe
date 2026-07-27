import { Drawer, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { AdminUser, UserActivity } from "../types/identity.types";

interface Props {
  user?: AdminUser;
  items: UserActivity[];
  loading: boolean;
  onClose: () => void;
}

export function UserActivityDrawer({ user, items, loading, onClose }: Props) {
  return (
    <Drawer
      open={Boolean(user)}
      width={760}
      title={`Hoạt động — ${user?.fullName ?? ""}`}
      onClose={onClose}
    >
      <Typography.Paragraph type="secondary">
        50 yêu cầu gần nhất được ghi nhận trong nhật ký kiểm toán.
      </Typography.Paragraph>
      <Table<UserActivity>
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={items}
        pagination={false}
        columns={[
          {
            title: "Thời gian",
            dataIndex: "executionTime",
            width: 165,
            render: (value: string) =>
              dayjs(value).format("DD/MM/YYYY HH:mm:ss"),
          },
          {
            title: "Yêu cầu",
            render: (_, item) => (
              <>
                <Tag>{item.httpMethod ?? "—"}</Tag>
                <Typography.Text ellipsis={{ tooltip: item.url }}>
                  {item.url ?? "—"}
                </Typography.Text>
              </>
            ),
          },
          {
            title: "Kết quả",
            dataIndex: "httpStatusCode",
            width: 90,
            render: (value: number | undefined, item) => (
              <Tag
                color={
                  item.hasException || (value ?? 0) >= 400 ? "red" : "green"
                }
              >
                {value ?? "—"}
              </Tag>
            ),
          },
          {
            title: "ms",
            dataIndex: "executionDuration",
            width: 70,
          },
        ]}
      />
    </Drawer>
  );
}
