import {createFileRoute} from '@tanstack/react-router'
import {getSessionFn} from "@/data/session.ts";

export const Route = createFileRoute('/dashboard/')({
    component: RouteComponent,
    loader: () => getSessionFn()
})

function RouteComponent() {
    const {user} = Route.useLoaderData();
    return <div>{user.name}</div>
}
