import { useState } from "react";
import { Input, Modal, Typography } from "antd";

interface RevokeModalProps {
  open: boolean;
  title: string;
  confirmLoading?: boolean;
  /** Defaults to the revoke wording; override for other reason-bearing actions. */
  okText?: string;
  description?: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function RevokeModal({
  open,
  title,
  confirmLoading,
  okText = "Thu hồi",
  description = "Hồ sơ đã thu hồi không thể chỉnh sửa lại. Vui lòng ghi rõ lý do.",
  placeholder = "Lý do thu hồi",
  onCancel,
  onConfirm,
}: RevokeModalProps) {
  const [reason, setReason] = useState("");

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  const handleOk = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setReason("");
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      okButtonProps={{ danger: true, disabled: !reason.trim() }}
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
      onOk={handleOk}
      destroyOnHidden
    >
      <Typography.Paragraph>{description}</Typography.Paragraph>
      <Input.TextArea
        rows={4}
        maxLength={2000}
        showCount
        value={reason}
        placeholder={placeholder}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}
