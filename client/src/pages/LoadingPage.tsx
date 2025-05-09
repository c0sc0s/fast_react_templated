import { Loader2 } from "lucide-react";

export default function FullScreenLoader() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-muted-foreground text-lg">正在加载，请稍候…</div>
            </div>
        </div>
    );
}