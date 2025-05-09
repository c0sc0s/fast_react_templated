import { z } from "zod";

// 登录请求验证
export const loginSchema = z.object({
  email: z.string().email("无效的电子邮件地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
});

// 注册请求验证
export const registerSchema = z.object({
  username: z.string().min(3, "用户名至少需要3个字符"),
  email: z.string().email("无效的电子邮件地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
});

// 基础响应模式
export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  code: z.number(),
});

// 成功响应模式
export const successResponseSchema = baseResponseSchema.extend({
  success: z.literal(true),
  data: z.any().optional(),
});

// 错误响应模式
export const errorResponseSchema = baseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
});

// API响应模式
export const apiResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

// 用户数据模式
export const userDataSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  avatar: z.string().optional(),
  status: z.string().optional(),
});

// 认证响应数据模式
export const authDataSchema = z.object({
  user: userDataSchema,
  token: z.string(),
});

// 认证成功响应模式
export const authSuccessResponseSchema = successResponseSchema.extend({
  data: authDataSchema,
});

// 登录请求和响应模式
export const loginRouteSchema = {
  body: loginSchema,
  response: {
    200: authSuccessResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
};

// 注册请求和响应模式
export const registerRouteSchema = {
  body: registerSchema,
  response: {
    200: authSuccessResponseSchema,
    400: errorResponseSchema,
    500: errorResponseSchema,
  },
};

// 登出响应模式
export const logoutSuccessSchema = successResponseSchema.extend({
  data: z.null(),
});

// 登出路由模式
export const logoutRouteSchema = {
  response: {
    200: logoutSuccessSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
};

// 类型导出
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ApiResponse<T = unknown> = z.infer<typeof apiResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type AuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;
export type LogoutSuccessResponse = z.infer<typeof logoutSuccessSchema>;
