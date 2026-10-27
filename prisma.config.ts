import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',

    // 填充初始数据或测试数据
    // seed: 'tsx prisma/seed.ts-bak',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
