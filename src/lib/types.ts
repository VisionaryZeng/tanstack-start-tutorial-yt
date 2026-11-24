import type { LucideIcon } from 'lucide-react'
import type { User } from 'better-auth'
import { type itemsSearchSchema } from '@/schemas/item.ts'
import { type z } from 'zod'

export interface NavPrimaryProps {
  items: {
    title: string
    to: string
    icon: LucideIcon
    // 路由匹配模式，exact: true 严格匹配，false 模糊匹配
    activeOptions: { exact: boolean }
  }[]
}

export interface NavUserProps {
  user: User
}

export type ItemsSearch = z.infer<typeof itemsSearchSchema>

export enum ProgressStatus {
  SUCCESS = 'PENDING',
  FAILED = 'FAILED',
}

export interface BulkScrapeProgress {
  completed: number
  total: number
  url: string
  status: ProgressStatus
}
