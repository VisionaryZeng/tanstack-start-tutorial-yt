import { createFileRoute } from '@tanstack/react-router'

//  除了跟路由，其他的所有路由都是用 createFileRoute 创建
// 路由名称由 tanstack 自动写入并管理，当创建一个新的路由时，tanstack 会自动创建路由
export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </div>
  )
}
