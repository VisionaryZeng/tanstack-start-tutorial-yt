import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth.ts'
import { redirect } from '@tanstack/react-router'

// 服务端函数，只在服务端运行，客户端也可以通过RPC调用
// 定义一个服务端函数，用于获取数据，在组件中使用
export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })

    if (!session) {
      // useNavigate 是客户端函数，redirect 是服务端函数
      throw redirect({ to: '/login' })
    }

    return session
  },
)
