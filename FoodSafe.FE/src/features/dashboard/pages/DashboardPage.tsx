import { Typography } from 'antd'
import { useAuthStore } from '@/features/auth/store/authStore'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <Typography.Title level={4}>
        Chào mừng, {user?.name}
      </Typography.Title>
      <Typography.Text type="secondary">
        {user?.organizationName}
      </Typography.Text>
    </div>
  )
}
