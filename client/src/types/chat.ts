/**
 * 聊天相关的共享类型
 */

// 会话类型
export type ConversationType = "direct" | "group";

// 消息类型
export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio"
  | "video"
  | "call_audio"
  | "call_video";

// 消息状态
export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

// 通话状态
export type CallStatus = "missed" | "answered" | "rejected" | "completed";

// 会话参与者基本信息
export interface ConversationParticipantBasic {
  id: number;
  username: string;
  avatar: string | null;
  status: string;
}

// 最后一条消息信息
export interface LastMessageInfo {
  id: number;
  content: string | null;
  type: string;
  createdAt: string | Date;
  senderId: number;
  senderName: string;
}

// 群组基本信息
export interface GroupBasic {
  id: number;
  name: string;
  avatar: string | null;
}

// 会话基本信息
export interface ConversationBasic {
  id: number;
  type: string;
  lastMessageAt: string | Date | null;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  participants: ConversationParticipantBasic[];
  lastMessage: LastMessageInfo | null;
  group: GroupBasic | null;
}

// 回复消息信息
export interface ReplyInfo {
  id: number;
  content: string | null;
  senderId: number;
  senderName: string;
}

// 消息发送者信息
export interface MessageSender {
  id: number;
  username: string;
  avatar: string | null;
}

// 消息完整信息
export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  type: string;
  mediaUrl: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  sender: MessageSender;
  replyTo: ReplyInfo | null;
  callStatus: string | null;
  callDuration: number | null;
}

// 获取会话列表参数
export interface GetConversationsParams {
  page?: string;
  limit?: string;
}

// 获取会话详情参数
export interface GetConversationParams {
  id: string;
}

// 创建私聊会话请求体
export interface CreateDirectConversationBody {
  userId: number;
}

// 创建群聊会话请求体
export interface CreateGroupConversationBody {
  name: string;
  userIds: number[];
}

// 获取消息列表参数
export interface GetMessagesParams {
  conversationId: string;
  page?: string;
  limit?: string;
  before?: string; // 获取指定消息ID之前的消息
}

// 发送消息请求体
export interface SendMessageBody {
  conversationId: number;
  content: string;
  type?: MessageType;
  mediaUrl?: string;
  replyToId?: number;
}

// 已读消息请求体
export interface ReadMessagesBody {
  conversationId: number;
  lastReadMessageId?: number;
}

// 删除消息参数
export interface DeleteMessageParams {
  id: string;
}

// 发起通话请求体
export interface InitiateCallBody {
  conversationId: number;
  type: "audio" | "video";
}

// 更新通话状态请求体
export interface UpdateCallStatusBody {
  messageId: number;
  status: CallStatus;
  duration?: number;
}

// 会话列表响应数据
export interface ConversationsListResponse {
  conversations: ConversationBasic[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 消息列表响应数据
export interface MessagesListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
