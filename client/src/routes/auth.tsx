// src/routes/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import useAppStore from "@/store/app";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const hasLogin = useAppStore((state) => state.hasLogin);
    const hasInit = useAppStore((state) => state.hasInit);
    const location = useLocation();

    // 等待初始化完成
    if (!hasInit) return null;

    if (!hasLogin) {
        // 跳转到登录页，并带上原始路径
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}