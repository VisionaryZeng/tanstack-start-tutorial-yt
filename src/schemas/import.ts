import { z } from 'zod'

export const singleImportSchema = z.object({
  url: z.url(),
})

export const bulkImportSchema = z.object({
  url: z.url(),
  search: z.string(),
})

export const extractSchema = z.object({
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
})

// firecrawl 需要将 schema 转换一下：必须是标准 JSON Schema（type: "object" + properties），不能是 Zod 对象本身、.shape、Pydantic 类等
export const firecrawlSchema = z.toJSONSchema(extractSchema)
