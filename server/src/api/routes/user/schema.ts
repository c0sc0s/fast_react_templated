import { z } from "zod";
import { successResponseSchema, errorResponseSchema } from "../auth/schema";

// 参数schema
export const getUserParams = z.object({
  id: z.string().regex(/^[0-9]+$/),
});

// 搜索用户请求参数
export const searchUsersQuery = z.object({
  keyword: z.string().min(1, "搜索关键词不能为空"),
  page: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  limit: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

// 添加好友请求体
export const addFriendBody = z.object({
  userId: z.number(),
  message: z.string().optional(),
});

// 处理好友请求体
export const handleFriendRequestBody = z.object({
  requestId: z.number(),
  action: z.enum(["accept", "reject", "block"]),
});

// 删除好友请求体
export const deleteFriendBody = z.object({
  friendshipId: z.number(),
});

// 用户对象schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  phone: z.string().nullable(),
  username: z.string(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  status: z.string(),
  lastActiveAt: z.string().nullable().or(z.date().nullable()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

// 简化的用户对象schema (用于列表展示)
export const userBasicSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string().nullable(),
  status: z.string(),
});

// 好友关系schema
export const friendshipSchema = z.object({
  id: z.number(),
  initiatorId: z.number(),
  receiverId: z.number(),
  status: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  user: userBasicSchema,
});

// 带分页的用户列表响应
export const usersListSchema = successResponseSchema.extend({
  data: z.object({
    users: z.array(userBasicSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  }),
});

// 好友列表响应
export const friendsListSchema = successResponseSchema.extend({
  data: z.object({
    friends: z.array(friendshipSchema),
    total: z.number(),
  }),
});

// 好友请求列表响应
export const friendRequestsListSchema = successResponseSchema.extend({
  data: z.object({
    requests: z.array(friendshipSchema),
    total: z.number(),
  }),
});

// 路由schema定义
export const getUserRouteSchema = {
  params: getUserParams,
  response: {
    200: userSchema,
    404: errorResponseSchema,
  },
};

export const getCurrentUserRouteSchema = {
  response: {
    200: successResponseSchema.extend({
      data: userSchema,
    }),
    401: errorResponseSchema,
  },
};

export const searchUsersRouteSchema = {
  querystring: searchUsersQuery,
  response: {
    200: usersListSchema,
    400: errorResponseSchema,
  },
};

export const getFriendsRouteSchema = {
  response: {
    200: friendsListSchema,
    401: errorResponseSchema,
  },
};

export const getFriendRequestsRouteSchema = {
  response: {
    200: friendRequestsListSchema,
    401: errorResponseSchema,
  },
};

export const addFriendRouteSchema = {
  body: addFriendBody,
  response: {
    200: successResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
};

export const handleFriendRequestRouteSchema = {
  body: handleFriendRequestBody,
  response: {
    200: successResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

export const deleteFriendRouteSchema = {
  body: deleteFriendBody,
  response: {
    200: successResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
};

// 类型导出
export type GetUserParams = z.infer<typeof getUserParams>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuery>;
export type AddFriendBody = z.infer<typeof addFriendBody>;
export type HandleFriendRequestBody = z.infer<typeof handleFriendRequestBody>;
export type DeleteFriendBody = z.infer<typeof deleteFriendBody>;
export type User = z.infer<typeof userSchema>;
export type UserBasic = z.infer<typeof userBasicSchema>;
export type Friendship = z.infer<typeof friendshipSchema>;
