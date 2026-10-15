import {createFileRoute} from '@tanstack/react-router'
import {Navbar} from "#/components/web/navbat.tsx";

//  除了跟路由，其他的所有路由都是用 createFileRoute 创建
// 路由名称由 tanstack 自动写入并管理，当创建一个新的路由时，tanstack 会自动创建路由
export const Route = createFileRoute('/')({component: Home})

function Home() {
    return (
        <div>
            <Navbar/>
        </div>
    )
}
