/**
 * 身份验证相关的共享类型
 */

// 登录请求参数
export interface LoginInput {
  email: string;
  password: string;
}

// 注册请求参数
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// 用户数据
export interface UserData {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  status?: string;
}

// 身份验证响应数据
export interface AuthData {
  user: UserData;
  token: string;
}

// API 基础响应
export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
  code: number;
}

// 成功响应
export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data?: T;
}

// 错误响应
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
}

// API 响应
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// 身份验证成功响应
export type AuthSuccessResponse = SuccessResponse<AuthData>;

// 登出成功响应
export type LogoutSuccessResponse = SuccessResponse<null>;
