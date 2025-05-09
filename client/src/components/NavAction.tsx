import { VideoIcon } from "lucide-react"
import { SidebarGroup, SidebarMenuItem } from "./ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { SidebarMenu } from "./ui/sidebar"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

const NavAction = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isActive = location.pathname === "/quick-start-vedio";


    return (
        <SidebarGroup className="mt-auto">
            <SidebarMenu>
                <SidebarMenuItem className="flex items-center gap-2">
                    <Button
                        variant={isActive ? "default" : "outline"}
                        className={cn("w-full")}
                        onClick={() => navigate("/quick-start-vedio")}
                    >
                        <VideoIcon />
                        <span>快速视频</span>
                    </Button>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}

export default NavAction
