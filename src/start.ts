import {createMiddleware, createStart} from "@tanstack/react-start";
import {authMiddleware} from "@/middlewares/auth.ts";

const loggingMiddleware = createMiddleware().server(
    ({request, next}) => {
        const url = new URL(request.url);
        console.log(`[${request.method}] ${url.pathname}`);
        return next()
    }
)

// 全局中间件 拦截所有请求
export const startInstance = createStart(() => {
    return {
        requestMiddleware: [loggingMiddleware, authMiddleware]
    }
})
