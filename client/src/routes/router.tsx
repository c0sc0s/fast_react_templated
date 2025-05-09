import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/login";
import RegisterPage from "../pages/Auth/register";
import Layout from "./layout";
import Home from "@/pages/Home";
import Setting from "@/pages/Setting";
import RequireAuth from "./auth";

const router = createBrowserRouter([

    {
        path: "/",
        element: <RequireAuth><Layout /></RequireAuth>,
        children: [
            { path: "home", element: <Home /> },
            { path: "setting", element: <Setting /> },
            { index: true, element: <Navigate to="/home" replace /> }, // 这里重定向
        ],

    },
    {
        path: "/auth",
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            }
        ]
    }

]);

export default router;
