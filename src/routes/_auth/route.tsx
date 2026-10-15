import {createFileRoute, Link, Outlet} from '@tanstack/react-router'
import {buttonVariants} from "@/components/ui/button.tsx";
import {ArrowLeft} from "lucide-react";

export const Route = createFileRoute('/_auth')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="min-h-screen">
                <div className="absolute top-8 left-8">

                    {/*
                        buttonVariants： 将 Link 组件样式变成一个 shadcn/ui 按钮一样的函数
                    */}
                    <Link to={"/"} className={buttonVariants({variant: "secondary"})}>
                        <ArrowLeft className={"size-4"}/>
                        Back to Home
                    </Link>
                </div>
                <div className="flex min-h-screen items-center justify-center">
                    <Outlet/>
                </div>
        </div>
    )
}
