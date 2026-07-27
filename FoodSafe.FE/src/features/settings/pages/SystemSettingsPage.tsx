import {
  Card,
  Col,
  Descriptions,
  Row,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";

export default function SystemSettingsPage() {
  return (
    <div>
      <PageHeader title="Cấu hình hệ thống" />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <CloudServerOutlined style={{ marginRight: 8 }} />
                Thông tin hệ thống
              </span>
            }
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phiên bản">
                1.0.0
              </Descriptions.Item>
              <Descriptions.Item label="Framework">
                .NET 9 + ABP Framework 9
              </Descriptions.Item>
              <Descriptions.Item label="Cơ sở dữ liệu">
                PostgreSQL 15
              </Descriptions.Item>
              <Descriptions.Item label="Cache">
                Redis 7
              </Descriptions.Item>
              <Descriptions.Item label="Lưu trữ file">
                MinIO (S3 compatible)
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Hoạt động
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <LockOutlined style={{ marginRight: 8 }} />
                Chính sách mật khẩu
              </span>
            }
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Độ dài tối thiểu">
                8 ký tự
              </Descriptions.Item>
              <Descriptions.Item label="Yêu cầu chữ hoa">
                <Tag color="blue">Bắt buộc</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Yêu cầu chữ thường">
                <Tag color="blue">Bắt buộc</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Yêu cầu chữ số">
                <Tag color="blue">Bắt buộc</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Yêu cầu ký tự đặc biệt">
                <Tag color="blue">Bắt buộc</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời hạn mật khẩu">
                90 ngày
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Phiên đăng nhập
              </span>
            }
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Session timeout">
                30 phút không hoạt động
              </Descriptions.Item>
              <Descriptions.Item label="Token type">
                JWT (HTTP-Only Cookie)
              </Descriptions.Item>
              <Descriptions.Item label="Refresh token">
                <Tag color="green">Bật</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CSRF protection">
                <Tag color="green">Bật</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <SafetyOutlined style={{ marginRight: 8 }} />
                Bảo mật
              </span>
            }
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Cấp độ ATTT">
                <Tag color="blue">Cấp độ 2</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CAPTCHA đăng nhập">
                <Tag color="green">Bật</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rate limiting">
                <Tag color="green">Bật</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Audit logging">
                <Tag color="green">Bật</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="HTTPS">
                <Tag color="green">Bắt buộc (Production)</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="TLS">
                1.2+
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Typography.Text
        type="secondary"
        style={{ display: "block", marginTop: 16, fontSize: 12 }}
      >
        Các cấu hình bảo mật được thiết lập theo Nghị định 85/2016/NĐ-CP.
        Liên hệ quản trị viên hệ thống để thay đổi cấu hình.
      </Typography.Text>
    </div>
  );
}
