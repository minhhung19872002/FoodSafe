import { useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Spin,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  avatarUrl,
  profileApi,
  type UpdateUserProfileInput,
} from "../api/profileApi";

const profileKeys = { all: ["user-profile"] as const };

export default function ProfilePage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UpdateUserProfileInput>();
  const [avatarVersion, setAvatarVersion] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: profileKeys.all,
    queryFn: () => profileApi.get(),
  });

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });

  const update = useMutation({
    mutationFn: (input: UpdateUserProfileInput) => profileApi.update(input),
    onSuccess: () => {
      refresh();
      void message.success("Đã cập nhật thông tin cá nhân.");
    },
    onError: () => void message.error("Không thể cập nhật thông tin."),
  });
  const uploadAvatar = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => {
      refresh();
      setAvatarVersion((v) => v + 1);
      void message.success("Đã cập nhật ảnh đại diện.");
    },
    onError: () => void message.error("Không thể tải lên ảnh đại diện."),
  });
  const deleteAvatar = useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: () => {
      refresh();
      setAvatarVersion((v) => v + 1);
      void message.success("Đã xóa ảnh đại diện.");
    },
    onError: () => void message.error("Không thể xóa ảnh đại diện."),
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
      });
    }
  }, [data, form]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Thông tin cá nhân"
        subtitle="Cập nhật thông tin tài khoản và ảnh đại diện"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Ảnh đại diện" size="small">
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <Avatar
                size={96}
                icon={<UserOutlined />}
                src={
                  data?.hasAvatar
                    ? `${avatarUrl}?v=${avatarVersion}`
                    : undefined
                }
              />
              <Space>
                <Upload
                  accept="image/png,image/jpeg,image/webp"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (file.size > 2 * 1024 * 1024) {
                      void message.error("Ảnh không được vượt quá 2MB.");
                      return Upload.LIST_IGNORE;
                    }
                    uploadAvatar.mutate(file);
                    return false;
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadAvatar.isPending}
                  >
                    Đổi ảnh
                  </Button>
                </Upload>
                {data?.hasAvatar && (
                  <Popconfirm
                    title="Xóa ảnh đại diện?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => deleteAvatar.mutate()}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteAvatar.isPending}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Space>
          </Card>
          <Card title="Tài khoản" size="small" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên đăng nhập">
                {data?.userName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">{data?.email}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị">
                {data?.organizationName ?? "Toàn hệ thống"}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">
                {data?.position ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {data?.department ?? "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Thông tin cá nhân" size="small">
            <Form<UpdateUserProfileInput>
              form={form}
              layout="vertical"
              onFinish={(values) => update.mutate(values)}
            >
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input maxLength={200} />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Số điện thoại">
                <Input maxLength={32} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={update.isPending}
              >
                Lưu thay đổi
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
