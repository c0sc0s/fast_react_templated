import type { AuthData, LoginInput, RegisterInput } from "@/types";
import Request from "./client";

export const getMe = async (): Promise<AuthData> => {
    return await Request.get(`/auth/me`);
};

export const login = async (data: LoginInput): Promise<AuthData> => {
    return await Request.post(`/auth/login`, data);
};

export const register = async (data: RegisterInput): Promise<AuthData> => {
    return await Request.post(`/auth/register`, data);
};


