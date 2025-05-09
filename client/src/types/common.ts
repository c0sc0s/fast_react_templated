/**
 * 通用共享类型
 */

// 分页请求参数
export interface PaginationParams {
  page?: string;
  limit?: string;
}

// 分页响应元数据
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 时间范围查询参数
export interface TimeRangeParams {
  startDate?: string;
  endDate?: string;
}

// 排序方向
export type SortDirection = "asc" | "desc";

// 排序参数
export interface SortParams {
  field: string;
  direction: SortDirection;
}

// 上传文件响应
export interface UploadFileResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// WebSocket事件类型
export type WebSocketEventType =
  | "connection"
  | "message"
  | "message_status"
  | "typing"
  | "presence"
  | "call"
  | "notification";

// WebSocket基础消息
export interface WebSocketBaseMessage {
  type: WebSocketEventType;
  timestamp: string;
}

// WebSocket错误消息
export interface WebSocketErrorMessage extends WebSocketBaseMessage {
  error: string;
  code: number;
}
