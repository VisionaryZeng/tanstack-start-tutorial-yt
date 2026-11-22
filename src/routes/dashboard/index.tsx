import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  // 在加载此组件前，重定向到其他路由
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/import' })
  },
})
