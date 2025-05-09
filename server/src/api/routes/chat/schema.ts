import { z } from "zod";
import { successResponseSchema, errorResponseSchema } from "../auth/schema";

// 会话请求 Schema
export const getConversationsParams = z.object({
  page: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  limit: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

export const getConversationParams = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

export const createDirectConversationBody = z.object({
  userId: z.number(),
});

export const createGroupConversationBody = z.object({
  name: z.string().min(1),
  userIds: z.array(z.number()).min(1),
});

// 消息请求 Schema
export const getMessagesParams = z.object({
  conversationId: z.string().regex(/^[0-9]+$/),
  page: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  limit: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  before: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(), // 获取指定消息ID之前的消息
});

export const sendMessageBody = z.object({
  conversationId: z.number(),
  content: z.string().min(1),
  type: z.enum(["text", "image", "file", "audio", "video"]).default("text"),
  mediaUrl: z.string().url().optional(),
  replyToId: z.number().optional(),
});

export const readMessagesBody = z.object({
  conversationId: z.number(),
  lastReadMessageId: z.number().optional(),
});

export const deleteMessageParams = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

// 通话相关 Schema
export const initiateCallBody = z.object({
  conversationId: z.number(),
  type: z.enum(["audio", "video"]),
});

export const updateCallStatusBody = z.object({
  messageId: z.number(),
  status: z.enum(["answered", "rejected", "completed", "missed"]),
  duration: z.number().optional(),
});

// 响应 Schema
export const conversationBasicSchema = z.object({
  id: z.number(),
  type: z.string(),
  lastMessageAt: z.string().nullable().or(z.date().nullable()),
  unreadCount: z.number(),
  isArchived: z.boolean(),
  isMuted: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  participants: z.array(
    z.object({
      id: z.number(),
      username: z.string(),
      avatar: z.string().nullable(),
      status: z.string(),
    })
  ),
  lastMessage: z
    .object({
      id: z.number(),
      content: z.string().nullable(),
      type: z.string(),
      createdAt: z.string().or(z.date()),
      senderId: z.number(),
      senderName: z.string(),
    })
    .nullable(),
  group: z
    .object({
      id: z.number(),
      name: z.string(),
      avatar: z.string().nullable(),
    })
    .nullable(),
});

export const messageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  senderId: z.number(),
  content: z.string().nullable(),
  type: z.string(),
  mediaUrl: z.string().nullable(),
  status: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  sender: z.object({
    id: z.number(),
    username: z.string(),
    avatar: z.string().nullable(),
  }),
  replyTo: z
    .object({
      id: z.number(),
      content: z.string().nullable(),
      senderId: z.number(),
      senderName: z.string(),
    })
    .nullable(),
  callStatus: z.string().nullable(),
  callDuration: z.number().nullable(),
});

// 路由 Schema
export const getConversationsRouteSchema = {
  querystring: getConversationsParams,
  response: {
    200: successResponseSchema.extend({
      data: z.object({
        conversations: z.array(conversationBasicSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        hasMore: z.boolean(),
      }),
    }),
    401: errorResponseSchema,
  },
};

export const getConversationRouteSchema = {
  params: getConversationParams,
  response: {
    200: successResponseSchema.extend({
      data: conversationBasicSchema,
    }),
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const createDirectConversationRouteSchema = {
  body: createDirectConversationBody,
  response: {
    200: successResponseSchema.extend({
      data: conversationBasicSchema,
    }),
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const createGroupConversationRouteSchema = {
  body: createGroupConversationBody,
  response: {
    200: successResponseSchema.extend({
      data: conversationBasicSchema,
    }),
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
};

export const getMessagesRouteSchema = {
  params: z.object({
    conversationId: z.string().regex(/^[0-9]+$/),
  }),
  querystring: z.object({
    page: z
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
    limit: z
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
    before: z
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
  }),
  response: {
    200: successResponseSchema.extend({
      data: z.object({
        messages: z.array(messageSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        hasMore: z.boolean(),
      }),
    }),
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const sendMessageRouteSchema = {
  body: sendMessageBody,
  response: {
    200: successResponseSchema.extend({
      data: messageSchema,
    }),
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const readMessagesRouteSchema = {
  body: readMessagesBody,
  response: {
    200: successResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const deleteMessageRouteSchema = {
  params: deleteMessageParams,
  response: {
    200: successResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const initiateCallRouteSchema = {
  body: initiateCallBody,
  response: {
    200: successResponseSchema.extend({
      data: messageSchema,
    }),
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const updateCallStatusRouteSchema = {
  body: updateCallStatusBody,
  response: {
    200: successResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

// 类型导出
export type GetConversationsParams = z.infer<typeof getConversationsParams>;
export type GetConversationParams = z.infer<typeof getConversationParams>;
export type CreateDirectConversationBody = z.infer<
  typeof createDirectConversationBody
>;
export type CreateGroupConversationBody = z.infer<
  typeof createGroupConversationBody
>;
export type GetMessagesParams = z.infer<typeof getMessagesParams>;
export type SendMessageBody = z.infer<typeof sendMessageBody>;
export type ReadMessagesBody = z.infer<typeof readMessagesBody>;
export type DeleteMessageParams = z.infer<typeof deleteMessageParams>;
export type InitiateCallBody = z.infer<typeof initiateCallBody>;
export type UpdateCallStatusBody = z.infer<typeof updateCallStatusBody>;
export type ConversationBasic = z.infer<typeof conversationBasicSchema>;
export type Message = z.infer<typeof messageSchema>;
