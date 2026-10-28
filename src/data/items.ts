import {createServerFn} from "@tanstack/react-start";
import {firecrawl} from "@/lib/firecrawl.ts";
import {bulkImportSchema, extractSchema, firecrawlSchema, singleImportSchema} from "@/schemas/import.ts";
import {prisma} from "@/db.ts";
import {ItemStatus} from "@/generated/prisma/enums.ts";
import {z} from "zod";
import {authFnMiddleware} from "@/middlewares/auth.ts";


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

export const getItemsFn = createServerFn({method: "GET"})
.middleware([authFnMiddleware])
.handler(async ({context}) => {
    return await prisma.savedItem.findMany({
        where: {
            userId: context.session.user.id,
        },
        orderBy: {
            createdAt: "desc"
        }
    })
})