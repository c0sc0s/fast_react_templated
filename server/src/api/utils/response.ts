/**
 * 统一API响应格式工具
 */

import { FastifyReply } from "fastify";

/**
 * 基础响应结构
 * 所有类型的响应都建立在这个基础结构上
 */
interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
  code: number;
}

/**
 * 成功响应结构
 */
export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data?: T;
}

/**
 * 错误响应结构
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
}

/**
 * API响应类型（成功或错误）
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * 创建基础响应对象
 */
function createBaseResponse(
  success: boolean,
  message: string,
  code: number
): BaseResponse {
  return {
    success,
    message,
    timestamp: new Date().toISOString(),
    code,
  };
}

/**
 * 创建成功响应
 */
function createSuccessResponse<T = unknown>(
  message: string,
  data?: T,
  code: number = 200
): SuccessResponse<T> {
  const response = createBaseResponse(
    true,
    message,
    code
  ) as SuccessResponse<T>;

  if (data !== undefined) {
    response.data = data;
  }

  return response;
}

/**
 * 创建错误响应
 */
function createErrorResponse(
  message: string,
  error: string,
  code: number = 400
): ErrorResponse {
  const response = createBaseResponse(false, message, code) as ErrorResponse;
  response.error = error;

  return response;
}

/**
 * 成功响应
 * @param reply Fastify回复对象
 * @param data 响应数据
 * @param message 成功消息
 * @param statusCode HTTP状态码
 */
export function success<T = unknown>(
  reply: FastifyReply,
  data?: T,
  message: string = "操作成功",
  statusCode: number = 200
): FastifyReply {
  const response = createSuccessResponse(message, data, statusCode);
  return reply.code(statusCode).send(response);
}

/**
 * 错误响应
 * @param reply Fastify回复对象
 * @param error 错误信息
 * @param statusCode HTTP状态码
 * @param message 错误消息
 */
export function error(
  reply: FastifyReply,
  error: string = "操作失败",
  statusCode: number = 400,
  message: string = "请求处理失败"
): FastifyReply {
  const response = createErrorResponse(message, error, statusCode);
  return reply.code(statusCode).send(response);
}

/**
 * 未授权响应
 * @param reply Fastify回复对象
 * @param error 具体错误信息
 */
export function unauthorized(
  reply: FastifyReply,
  error: string = "未授权访问"
): FastifyReply {
  const response = createErrorResponse("身份验证失败", error, 401);
  return reply.code(401).send(response);
}

/**
 * 服务器错误响应
 * @param reply Fastify回复对象
 * @param error 错误详情
 */
export function serverError(
  reply: FastifyReply,
  error: string = "服务器内部错误"
): FastifyReply {
  const response = createErrorResponse("服务器处理请求时出错", error, 500);
  return reply.code(500).send(response);
}

/**
 * 资源未找到响应
 * @param reply Fastify回复对象
 * @param error 错误详情
 */
export function notFound(
  reply: FastifyReply,
  error: string = "请求的资源不存在"
): FastifyReply {
  const response = createErrorResponse("资源未找到", error, 404);
  return reply.code(404).send(response);
}

/**
 * 请求异常响应
 * @param reply Fastify回复对象
 * @param error 错误详情
 */
export function badRequest(
  reply: FastifyReply,
  error: string = "请求参数无效"
): FastifyReply {
  const response = createErrorResponse("请求格式错误", error, 400);
  return reply.code(400).send(response);
}

// 导出响应工具对象
export default {
  success,
  error,
  unauthorized,
  serverError,
  notFound,
  badRequest,
};
