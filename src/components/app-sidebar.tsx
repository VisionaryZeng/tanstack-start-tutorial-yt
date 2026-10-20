"use client"

import {NavPrimary} from "@/components/nav-primary.tsx"
import {NavUser} from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    BookmarkIcon, Compass, Import
} from "lucide-react"
import {Link, linkOptions} from "@tanstack/react-router";
import type {NavPrimaryProps, NavUserProps} from "@/lib/types.ts";

// linkOptions 组件将 <Link> 组件的属性提取到组件外部，并保持完整的 TypeScript 类型安全。
//
// 在大型应用中，我们经常需要在不同的地方复用同一个路由跳转逻辑（包含路径、参数、search 参数等）。
// 如果你直接写在 <Link> 里，代码会很冗长；如果提取成普通的 JavaScript 对象，又会丢失强大的路径类型推导。linkOptions 就是为了解决这个问题


const navItems: NavPrimaryProps["items"] = linkOptions([
    {
        title: "Items",
        icon: BookmarkIcon,
        to: "/dashboard/items",
        activeOptions: {exact: false}
    },
    {
        title: "Import",
        icon: Import,
        to: "/dashboard/import",
        activeOptions: {exact: false}
    },
    {
        title: "Discover",
        icon: Compass,
        to: "/dashboard/discover",
        activeOptions: {exact: false}
    }
])

export function AppSidebar({user}: NavUserProps) {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                {/*<TeamSwitcher teams={data.teams} />*/}

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size={"lg"} asChild>
                            <Link to={"/dashboard"} className={"flex items-center gap-3"}>
                                <div
                                    className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <BookmarkIcon className="size-4"/>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="font-medium">Recall</span>
                                    <span className="text-xs">Your AI Knowledge Base</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

            </SidebarHeader>
            <SidebarContent>
                <NavPrimary items={navItems}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user}/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    )
}
