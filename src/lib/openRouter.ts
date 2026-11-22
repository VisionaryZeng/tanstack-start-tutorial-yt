import {
  createOpenRouterSummarize,
  createOpenRouterText,
} from '@tanstack/ai-openrouter'

//  as 'deepseek/deepseek-v4.1-flash-1017' 骗过 TypeScript 的类型检查，让环境变量的 string 被当成合法的模型名字面量，因为 tanstack ai 会根据模型进行适配
export const adapter = createOpenRouterText(
  process.env.OPENROUTER_MODEL as 'deepseek/deepseek-v4.1-flash-1017',
  process.env.OPENROUTER_API_KEY!,
)
export const summary_adapter = createOpenRouterSummarize(
  process.env.OPENROUTER_MODEL as 'deepseek/deepseek-v4.1-flash-1017',
  process.env.OPENROUTER_API_KEY!,
)
