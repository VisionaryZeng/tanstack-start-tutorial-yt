import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {getItemsFn} from "@/data/items.ts";
import {Card, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Copy, Inbox} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {copyToClipboard} from "@/lib/clipboard.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {ItemStatus} from "@/generated/prisma/enums.ts";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {itemsSearchSchema} from "@/schemas/item.ts";
import {Suspense, use, useEffect, useState} from "react";
import type {ItemsSearch} from "@/lib/types.ts";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@/components/ui/empty.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";


function ItemsList({
                       data,
                       q,
                       status
                   }: {
                        data: ReturnType<typeof getItemsFn>,
                        q: ItemsSearch['q'],
                        status: ItemsSearch['status']
                }) {
    const items = use(data)

    const filteredItem = items.filter((item) => {
        const matchQuery = q === ''
            || item.title?.toLowerCase().includes(q.toLowerCase())
            || item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()));

        const matchStatus = status === 'all' || item.status === status;
        return matchQuery && matchStatus;
    })

    if (filteredItem.length === 0) {
        return (
            <Empty className={"board rounded-lg h-full"}>
                <EmptyHeader>
                    <EmptyMedia variant={"icon"}>
                        <Inbox className={"size-12"}/>
                    </EmptyMedia>
                    <EmptyTitle>
                        {items.length === 0 ? "No Items saved yet" : "No Items Found"}
                    </EmptyTitle>
                    <EmptyDescription>
                        {items.length === 0 ? "Import a URL to get started with saving your content." : "No items match your current search filters."}
                    </EmptyDescription>
                </EmptyHeader>
                {items.length === 0 && (
                    <EmptyContent>
                        <Link to={"/dashboard/import"}>
                            Import URL
                        </Link>
                    </EmptyContent>
                )}
            </Empty>
        )
    }

    return (
        <div className={"grid gap-6 md:grid-cols-2"}>
            {filteredItem.map((item) => (
                <Card
                    key={item.id}
                    className={"group overflow-hidden transition-all hover:shadow-lg pt-0"}
                >
                    <Link to={"/dashboard"} className={"block"}>
                        {item.ogImage && (
                            <div className={"aspect-video w-full overflow-hidden bg-muted"}>
                                <img
                                    src={item.ogImage}
                                    alt={item.title ?? 'Article Thumbnail'}
                                    className="h-full w-full object-cover transition-transfrom group-hover:scale-105"
                                />
                            </div>
                        )}

                        <CardHeader className={"space-y-3 pt-4"}>
                            <div className={"flex items-center justify-between gap-2"}>
                                <Badge
                                    variant={item.status === ItemStatus.COMPLETED ? "default" : "secondary"}
                                >
                                    {item.status.toLocaleLowerCase()}
                                </Badge>
                                <Button
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        await copyToClipboard(item.url)
                                    }}
                                    variant={"outline"}
                                    size={"icon"}
                                    className={"size-8"}
                                >
                                    <Copy className={"size-4"}/>
                                </Button>
                            </div>

                            <CardTitle
                                className={"line-clamp-1 text-xl leading-snug group-hover:text-primary transition-colors"}>
                                {item.title}
                            </CardTitle>
                        </CardHeader>
                    </Link>
                </Card>
            ))}
        </div>
    )
}

function ItemsGridSkeleton() {
    return (
        <div className={"grid gap-6 md:grid-cols-2"}>
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className={"overflow-hidden pt-0"}>
                    <Skeleton className={"aspect-video w-full"}/>
                    <CardHeader className={"space-y-3"}>
                        <div className={"flex items-center justify-between"}>
                            <Skeleton className={"h-5 w-20 rounded-full"}/>
                            <Skeleton className={"size-8 rounded-md"}/>
                        </div>
                        <Skeleton className={"h-6 w-full"}/>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}


export const Route = createFileRoute('/dashboard/items/')({
    component: RouteComponent,
    loader: () => ({itemsPromise: getItemsFn()}),
    validateSearch: itemsSearchSchema
})

function RouteComponent() {
    const {itemsPromise} = Route.useLoaderData();
    const {status, q} = Route.useSearch();
    const [searchInput, setSearchInput] = useState(q);
    const navigate = useNavigate({from: Route.fullPath});
    useEffect(() => {
        if (searchInput === q) return
        const timeoutId = setTimeout(() => {
            navigate({search: (prev) => ({...prev, q: searchInput})})
        }, 300)
        return () => {
            clearTimeout(timeoutId)
        }
    }, [searchInput, navigate, q])

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div>
                <h1 className={"text-2xl font-bold"}>Saved Items</h1>
                <p className={"text-muted-foreground"}>Your saved articles and content!</p>
            </div>
            {/* Search and Filter controls */}
            <div className={"flex gap-4"}>
                <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={"Search by title or tags"}/>
                <Select
                    value={status}
                    onValueChange={(value) => {
                        navigate({
                            search: (prev) => ({
                                ...prev,
                                status: value as typeof status,
                            })
                        })
                    }}
                >
                    <SelectTrigger className={"w-40"}>
                        <SelectValue placeholder={"Filter by status"}/>
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

            <Suspense fallback={<ItemsGridSkeleton/>}>
                <ItemsList data={itemsPromise} q={q} status={status}/>
            </Suspense>
        </div>
    )
}
