import {
  createFileRoute,
  defer,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { getItemsFn } from '@/data/items.ts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Copy, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { copyToClipboard } from '@/lib/clipboard.ts'
import { Badge } from '@/components/ui/badge.tsx'
import { ItemStatus } from '@/generated/prisma/enums.ts'
import { Input } from '@/components/ui/input.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { itemsSearchSchema } from '@/schemas/item.ts'
import { Suspense, use, useEffect, useState } from 'react'
import type { ItemsSearch } from '@/lib/types.ts'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'

function ItemsList({
  data,
  q,
  status,
}: {
  data: ReturnType<typeof getItemsFn>
  q: ItemsSearch['q']
  status: ItemsSearch['status']
}) {
  // use() 在纯同步的 React 组件代码中，优雅地“解包（Unwrap）”一个异步的 Promise，并自动触发 Suspense（悬念）机制
  const items = use(data)

  // 前端过滤
  const filteredItem = items.filter((item) => {
    const matchQuery =
      q === '' ||
      item.title?.toLowerCase().includes(q.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()))

    const matchStatus = status === 'all' || item.status === status
    return matchQuery && matchStatus
  })

  // 数据友好提示
  if (filteredItem.length === 0) {
    return (
      <Empty className={'board rounded-lg h-full'}>
        <EmptyHeader>
          <EmptyMedia variant={'icon'}>
            <Inbox className={'size-12'} />
          </EmptyMedia>
          <EmptyTitle>
            {items.length === 0 ? 'No Items saved yet' : 'No Items Found'}
          </EmptyTitle>
          <EmptyDescription>
            {items.length === 0
              ? 'Import a URL to get started with saving your content.'
              : 'No items match your current search filters.'}
          </EmptyDescription>
        </EmptyHeader>
        {items.length === 0 && (
          <EmptyContent>
            <Link to={'/dashboard/import'}>Import URL</Link>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <div className={'grid gap-6 md:grid-cols-2'}>
      {filteredItem.map((item) => (
        <Card
          key={item.id}
          className={
            'group overflow-hidden transition-all hover:shadow-lg pt-0'
          }
        >
          {/*
                        params：用于动态路由参数
                    */}
          <Link
            to={'/dashboard/items/$itemId'}
            params={{
              itemId: item.id,
            }}
            className={'block'}
          >
            {item.ogImage && (
              <div className={'aspect-video w-full overflow-hidden bg-muted'}>
                <img
                  src={item.ogImage}
                  alt={item.title ?? 'Article Thumbnail'}
                  className="h-full w-full object-cover transition-transfrom group-hover:scale-105"
                />
              </div>
            )}

            <CardHeader className={'space-y-3 pt-4'}>
              <div className={'flex items-center justify-between gap-2'}>
                <Badge
                  variant={
                    item.status === ItemStatus.COMPLETED
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {item.status.toLocaleLowerCase()}
                </Badge>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    await copyToClipboard(item.url)
                  }}
                  variant={'outline'}
                  size={'icon'}
                  className={'size-8'}
                >
                  <Copy className={'size-4'} />
                </Button>
              </div>

              <CardTitle
                className={
                  'line-clamp-1 text-xl leading-snug group-hover:text-primary transition-colors'
                }
              >
                {item.title}
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  )
}

// 骨架屏
function ItemsGridSkeleton() {
  return (
    <div className={'grid gap-6 md:grid-cols-2'}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className={'overflow-hidden pt-0'}>
          <Skeleton className={'aspect-video w-full'} />
          <CardHeader className={'space-y-3'}>
            <div className={'flex items-center justify-between'}>
              <Skeleton className={'h-5 w-20 rounded-full'} />
              <Skeleton className={'size-8 rounded-md'} />
            </div>
            <Skeleton className={'h-6 w-full'} />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,

  head: () => ({
    meta: [
      {
        title: 'Saved Items',
      },
      {
        // 渲染外部链接生成卡片时会获取的标题
        property: 'og:title',
        content: 'Saved Items',
      },
    ],
  }),

  // loader 瞬间执行完毕并返回一个普通对象，路由不再等待数据，立刻放行并开始渲染 RouteComponent

  /*
    【只要 loader 中返回对象内部包含 Promise，就务必用 defer() 包装起来】
    标准的 JSON 序列化（JSON.stringify）是无法序列化一个 Promise 对象的。它不知道怎么把一个“正在计算中的未来状态”变成字符串
    框架看到被 defer 包裹的 Promise，处理逻辑会变成：
    这是一个流式数据。不把它 JSON 序列化。先立刻把现有的 HTML 骨架发给浏览器，但不切断 HTTP 连接。
    在这里等这个 Promise，一旦它在服务端有结果了，立刻顺着这根没断开的网线，把结果追加（Stream）发送给浏览器！
    */
  loader: () => ({ itemsPromise: defer(getItemsFn()) }),
  validateSearch: itemsSearchSchema,
})

function RouteComponent() {
  const { itemsPromise } = Route.useLoaderData()
  const { status, q } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(q)
  // 【URL as State】
  // 通过传入 from: Route.fullPath，navigate 函数会立刻知道当前在哪个页面。
  // 这样在后续修改 search（URL查询参数）时，TypeScript 就能提供完美的自动补全和类型校验，防止你拼错参数名
  const navigate = useNavigate({ from: Route.fullPath })

  /*
    防抖原理： 每次依赖项发生改变的300ms内再发生改变都会取消作废，直到依赖项超过300ms不再改变，最后只更新最后的状态
    当依赖项改变，
    第一步（清理旧账）React 找到上一次渲染快照遗留下来的 return 清理函数，并在那个旧的闭包作用域内执行它（例如清理旧的定时器、取消旧的 Fetch 请求、解绑旧的事件监听）
    第二步（同步新局）：执行本次渲染快照中新的 Effect 逻辑，并将其返回的全新清理函数存入内存，等待下一次状态改变或组件卸载时调用
    */
  useEffect(() => {
    if (searchInput === q) return
    const timeoutId = setTimeout(() => {
      /*
            navigate 通过改变 URL 这个全局共享状态，命令底层数据流重新去服务端拉取最新的搜索结果

            修改地址栏
            触发参数校验
            重新触发数据加载（Loader 重新执行）
            流式渲染与 UI 更新
            */
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) })
    }, 300)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchInput, navigate, q])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className={'text-2xl font-bold'}>Saved Items</h1>
        <p className={'text-muted-foreground'}>
          Your saved articles and content!
        </p>
      </div>
      {/* Search and Filter controls */}
      <div className={'flex gap-4'}>
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={'Search by title or tags'}
        />
        <Select
          value={status}
          onValueChange={(value) => {
            navigate({
              search: (prev) => ({
                ...prev,
                status: value as typeof status,
              }),
            })
          }}
        >
          <SelectTrigger className={'w-40'}>
            <SelectValue placeholder={'Filter by status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ItemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status[0] + status.slice(1).toLocaleLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback={<ItemsGridSkeleton />}>
        <ItemsList data={itemsPromise} q={q} status={status} />
      </Suspense>
    </div>
  )
}
