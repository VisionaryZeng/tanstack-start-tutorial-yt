import {createServerFn} from "@tanstack/react-start";
import {firecrawl} from "@/lib/firecrawl.ts";
import {bulkImportSchema, extractSchema, firecrawlSchema, singleImportSchema} from "@/schemas/import.ts";
import {prisma} from "@/db.ts";
import {ItemStatus} from "@/generated/prisma/enums.ts";
import {z} from "zod";
import {authFnMiddleware} from "@/middlewares/auth.ts";
import {notFound} from "@tanstack/react-router";
import {adapter} from "@/lib/openRouter.ts";
import {chat} from "@tanstack/ai";


export const scrapeUrlFn = createServerFn({method: "POST"})
    .middleware([authFnMiddleware])
    .validator(singleImportSchema)
    .handler(
        async ({data, context}) => {
            const item = await prisma.savedItem.create({
                data: {
                    url: data.url,
                    userId: context.session.user.id,
                    status: ItemStatus.PROCESSING,
                }
            })

            try {
                const result = await firecrawl.scrape(data.url, {
                    formats: [
                        'markdown',
                        {
                            type: 'json',
                            schema: firecrawlSchema,
                        },
                    ],
                    onlyMainContent: true,
                })

                const jsonData = result.json as z.infer<typeof extractSchema>
                console.log(`jsonData => ${jsonData.author} | ${jsonData.publishedAt} `);
                let publishedAt = null

                if (jsonData.publishedAt) {
                    const parsed = new Date(jsonData.publishedAt)

                    if (!isNaN(parsed.getTime())) {
                        publishedAt = parsed
                    }
                }

                return await prisma.savedItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        title: result.metadata?.title,
                        content: result.markdown,
                        ogImage: result.metadata?.ogImage,
                        author: jsonData.author,
                        publishedAt: publishedAt,
                        status: ItemStatus.COMPLETED,
                    },
                })
            } catch {
                return await prisma.savedItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        status: ItemStatus.FAILED,
                    },
                })
            }
        })

export const mapUrlFn = createServerFn({method: "POST"})
    .middleware([authFnMiddleware])
    .validator(bulkImportSchema)
    .handler(async ({data}) => {
        const result = await firecrawl.map(data.url, {
            limit: 25,
            search: data.search,
            location: {
                country: "US",
                languages: ["en"],
            }
        })
        return result.links
    })

export const bulkScrapeUrlFn = createServerFn({method: "POST"})
    .middleware([authFnMiddleware])
    .validator(z.object({
        urls: z.array(z.url())
    })).handler(async ({data, context}) => {
        console.log(`scrape all URLs ...`)
        for (let i = 0; i < data.urls.length; i++) {
            const url = data.urls[i]
            const item = await prisma.savedItem.create({
                data: {
                    url: url,
                    userId: context.session.user.id,
                    status: ItemStatus.PENDING,
                }
            })

            try {
                const result = await firecrawl.scrape(url, {
                    formats: [
                        'markdown',
                        {
                            type: 'json',
                            schema: firecrawlSchema,
                        },
                    ],
                    onlyMainContent: true,
                })

                const jsonData = result.json as z.infer<typeof extractSchema>
                console.log(`jsonData => ${jsonData.author} | ${jsonData.publishedAt} `);
                let publishedAt = null

                if (jsonData.publishedAt) {
                    const parsed = new Date(jsonData.publishedAt)

                    if (!isNaN(parsed.getTime())) {
                        publishedAt = parsed
                    }
                }

                await prisma.savedItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        title: result.metadata?.title,
                        content: result.markdown,
                        ogImage: result.metadata?.ogImage,
                        author: jsonData.author,
                        publishedAt: publishedAt,
                        status: ItemStatus.COMPLETED,
                    },
                })
            } catch {
                await prisma.savedItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        status: ItemStatus.FAILED,
                    },
                })
            }
        }
    })

// 只要是通过 createServerFn 创建的 Server Function，当在其他地方（特别是客户端）调用它时，它最终返回的必然是一个 Promise
export const getItemsFn = createServerFn({method: "GET"})
.middleware([authFnMiddleware])
.handler(async ({context}) => {

    await new Promise(resolve => setTimeout(resolve, 2000))

    return await prisma.savedItem.findMany({
        where: {
            userId: context.session.user.id,
        },
        orderBy: {
            createdAt: "desc"
        }
    })
})

export const getItemByIdFn = createServerFn({method: "GET"})
    .middleware([authFnMiddleware])
    .validator(z.object({id: z.string()}))
    .handler(async ({data, context}) => {
        const item = await prisma.savedItem.findUnique({
            where: {
                userId: context.session.user.id,
                id: data.id
            }
        })

        if (!item) {
            throw notFound()
        }

        return item
    })

export const saveSummaryAndGenerateTagsFn = createServerFn({method: "POST"})
    .middleware([authFnMiddleware])
    .validator(z.object({id: z.string(), summary: z.string()}))
    .handler(async ({data, context}) => {
        const existing = await prisma.savedItem.findUnique({
            where: {
                id: data.id,
                userId: context.session.user.id,
            },
        })

        if (!existing) {
            throw notFound()
        }

        const {text} = await chat({
            adapter,
            systemPrompts: [
                `You are a helpful assistant that extracts relevant tags from content summaries.
Extract 3-5 short, relevant tags that categorize the content.
Return ONLY a comma-separated list of tags, nothing else.
Example: technology, programming, web development, javascript`,
            ],
            messages: [
                {
                    role: 'user',
                    content: `Extract tags from this summary: \n\n${data.summary}`,
                },
            ],
            threadId: data.id, // 任意稳定 id 即可
            stream: false,              // 关键流式，对应原来的 generateText
        })

        const tags = text
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter((tag) => tag.length > 0)
            .slice(0, 5)

        return await prisma.savedItem.update({
            where: {
                userId: context.session.user.id,
                id: data.id,
            },
            data: {
                summary: data.summary,
                tags: tags,
            },
        })

    })
