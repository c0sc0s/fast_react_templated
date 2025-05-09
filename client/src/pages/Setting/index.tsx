import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { ModeToggle } from "./ModeToggle"; // 你可以把上面代码保存为 components/ModeToggle.tsx

export default function Setting() {
    const [notify, setNotify] = useState(false);

    return (
        <div className="items-start w-full h-full p-4 rounded-lg bg-background/80">
            <h2 className="text-2xl font-bold mb-6">系统设置</h2>
            <div className="mb-6">
                <Label className="block mb-2">主题</Label>
                <ModeToggle />
            </div>
            <div className="mb-2">
                <Label className="block mb-2">通知</Label>
                <div className="flex items-center gap-2">
                    <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
                    <Label htmlFor="notify">启用消息通知</Label>
                </div>
            </div>
        </div>
    );
}