import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth.ts'
import { redirect } from '@tanstack/react-router'

// middle type: 默认是 request 拦截网络请求，function 是函数间调用触发，这样设计可以提高中间件拦截的性能
// server 是在服务端运行，一般用法， client 是在客户端中运行，可以用来获取客户端的用户信息
export const authFnMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return next({ context: { session } })
  },
)

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const url = new URL(request.url)
    // 非看板的路由直接放行，如： /login, /signup, /loggout 等
    if (
      !url.pathname.startsWith('/dashboard') &&
      !url.pathname.startsWith('/api/ai')
    ) {
      return next()
    }
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return next({ context: { session } })
  },
)
