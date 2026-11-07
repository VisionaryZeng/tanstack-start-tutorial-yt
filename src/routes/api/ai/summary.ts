import { createFileRoute } from '@tanstack/react-router'
import {prisma} from "@/db.ts";
import {chatParamsFromRequest, summarize, toServerSentEventsResponse} from "@tanstack/ai";
import {summary_adapter} from "@/lib/openRouter.ts";

export const Route = createFileRoute('/api/ai/summary')({
    // 核心区别：API 路由必须把 HTTP 方法包裹在 server.handlers 内部
    server: {
        handlers: {
            POST: async ({request, context}) => {
                const {threadId, forwardedProps,runId} = await chatParamsFromRequest(request);

                const itemId = forwardedProps.itemId as string
                const text = forwardedProps.text as string

                if (!itemId) {
                    return new Response('Missing content or itemId', { status: 400 })
                }
                console.log(`itemId: ${itemId}`)

                const item = await prisma.savedItem.findUnique({
                    where: {
                        id: itemId,
                        userId: context?.session?.user?.id,
                    },
                })

                console.log(`userId: ${context?.session?.user?.id}`);

                if (!item) {
                    console.log(`item doesn't exist!`)
                    return new Response('Item not found!!!', { status: 404 })
                }

                // stream summary
                const result = summarize({
                    adapter: summary_adapter,
                    threadId,
                    text,
                    runId,
                    stream: true,     // 默认为 true
                })

                //Return the stream in the format useCompletion expects
                return toServerSentEventsResponse(result)
            },
        },
    },
})