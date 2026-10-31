import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {getItemsFn} from "@/data/items.ts";
import {Card, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Copy} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {copyToClipboard} from "@/lib/clipboard.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {ItemStatus} from "@/generated/prisma/enums.ts";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {itemsSearchSchema} from "@/schemas/item.ts";
import {useEffect, useState} from "react";

export const Route = createFileRoute('/dashboard/items/')({
    component: RouteComponent,
    loader: () => getItemsFn(),
    validateSearch: itemsSearchSchema
})

function RouteComponent() {
    const data = Route.useLoaderData();
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


            <div className={"grid gap-6 md:grid-cols-2"}>
                {data.map((item) => (
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
        </div>
    )
}
