'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import type { NavPrimaryProps } from '@/lib/types.ts'

export function NavPrimary({ items }: NavPrimaryProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => {
            return (
              //  key 一般都是不重复的，如果key 是静态的不会改变顺序的可以用 index 作为 key
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild size={'sm'}>
                  {/*

                                    路由“激活”的本质含义就是“用户当前正在浏览这个页面（或它的子页面）”。一旦被判定为激活，它就会触发你配置在 activeProps 里的高亮样式。activeOptions 匹配模式

                                    */}
                  <Link
                    activeProps={{ 'data-active': true }}
                    to={item.to}
                    activeOptions={item.activeOptions}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
