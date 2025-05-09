import { MessageCircle } from "lucide-react"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleAuthSuccess } from "@/util/auth";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/api/auth";
import clientLocalStorage from "@/util/localStorage";


export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const form = Object.fromEntries(formData);
        const { username, email, password, phone } = form;

        try {
            const res = await register({ username, email, password, phone } as any);
            const token = res.token;
            clientLocalStorage.addAuthToken(token);

            toast.success("注册成功");
            handleAuthSuccess(res);
            navigate("/");
        } catch (err: any) {
            toast.error("注册失败", { description: err?.toString() });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <a
                            href="#"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md">
                                <MessageCircle className="size-20" />
                            </div>
                            <span className="sr-only">Acme Inc.</span>
                        </a>
                        <h1 className="text-xl font-bold">Welcome to Chat Focus.</h1>

                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input
                                name="username"
                                placeholder="用户名"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">手机号</Label>
                            <Input
                                name="phone"
                                placeholder="手机号"
                                type="tel"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="邮箱"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="密码"
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        注册
                    </Button>
                </div>
                <div className="relative my-4 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                        Or
                    </span>
                </div>
                <Button onClick={() => navigate("/auth/login")} variant="outline" className="w-full">
                    登录 👻
                </Button>

            </form >
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
                最纯粹的聊天体验
            </div>
        </div >
    )
}
