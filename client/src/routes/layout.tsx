import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/Sidebar"; // 你的 sidebar 组件
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout() {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}