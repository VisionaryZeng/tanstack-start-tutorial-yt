import {createFileRoute, Link} from '@tanstack/react-router'
import {getItemsFn} from "@/data/items.ts";
import {Card, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Copy} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {copyToClipboard} from "@/lib/clipboard.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {ItemStatus} from "@/generated/prisma/enums.ts";

export const Route = createFileRoute('/dashboard/items/')({
    component: RouteComponent,
    loader: () => getItemsFn()
})

function RouteComponent() {
    const data = Route.useLoaderData();

    return (
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
    )
}
