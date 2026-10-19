import type {LucideIcon} from "lucide-react";


export interface NavPrimaryProps {
    items: {
        title: string
        to: string
        icon: LucideIcon
        // 路由匹配模式，exact: true 严格匹配，false 模糊匹配
        activeOptions: {exact: boolean}
    }[]
}