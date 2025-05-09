import * as React from "react"
import {
    BarChartIcon,
    ListIcon,
    MessageCircle,
    SettingsIcon,
    UsersIcon,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./NavMain"
import { NavUser } from "./NavUser"
import { NavLink } from "react-router-dom"
import NavAction from "./NavAction"

const data = {
    navMain: [
        {
            title: "应用数据",
            url: "/home",
            icon: BarChartIcon,
        },
        {
            title: "聊天列表",
            url: "/chatlist",
            icon: ListIcon,
        },
        {
            title: "好友列表",
            url: "/friends",
            icon: UsersIcon,
        },
        {
            title: "设置",
            url: "/setting",
            icon: SettingsIcon,
        },
    ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <NavLink to="/home" className="flex items-center gap-2">
                                <MessageCircle />
                                <span className="text-base font-semibold">ChatFocus</span>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavAction />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}