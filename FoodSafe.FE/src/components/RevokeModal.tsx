import { useState } from "react";
import { Input, Modal, Typography } from "antd";

interface RevokeModalProps {
  open: boolean;
  title: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function RevokeModal({
  open,
  title,
  confirmLoading,
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
      okText="Thu hồi"
      okButtonProps={{ danger: true, disabled: !reason.trim() }}
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
      onOk={handleOk}
      destroyOnHidden
    >
      <Typography.Paragraph>
        Hồ sơ đã thu hồi không thể chỉnh sửa lại. Vui lòng ghi rõ lý do.
      </Typography.Paragraph>
      <Input.TextArea
        rows={4}
        maxLength={2000}
        showCount
        value={reason}
        placeholder="Lý do thu hồi"
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}
