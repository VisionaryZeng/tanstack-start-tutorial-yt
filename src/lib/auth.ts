import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {prisma} from "@/db.ts";
import {tanstackStartCookies} from "better-auth/tanstack-start";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
        //  开发环境上使用，生产环境需要改成 true
        requireEmailVerification: false,
    },

    // 当您调用需要设置 cookie 的函数时（比如 signInEmail 或 signUpEmail ），您需要处理与 TanStack Start 相关的 cookie 设置问题。
    // Better Auth 提供了一个 tanstackStartCookies 插件，可以自动处理这些事情
    plugins: [tanstackStartCookies()]
})