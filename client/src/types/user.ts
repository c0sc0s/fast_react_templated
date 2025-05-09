/**
 * 用户相关的共享类型
 */

// 用户完整信息
export interface User {
  id: number;
  email: string;
  phone: string | null;
  username: string;
  avatar: string | null;
  bio: string | null;
  status: string;
  lastActiveAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 用户基本信息 (用于列表展示)
export interface UserBasic {
  id: number;
  username: string;
  avatar: string | null;
  status: string;
}

// 好友关系
export interface Friendship {
  id: number;
  initiatorId: number;
  receiverId: number;
  status: string; // "pending", "accepted", "rejected", "blocked"
  createdAt: string | Date;
  updatedAt: string | Date;
  user: UserBasic; // 对方用户的信息
}

// 获取用户参数
export interface GetUserParams {
  id: string;
}

// 搜索用户请求参数
export interface SearchUsersQuery {
  keyword: string;
  page?: string;
  limit?: string;
}

// 添加好友请求体
export interface AddFriendBody {
  userId: number;
  message?: string;
}

// 处理好友请求体
export interface HandleFriendRequestBody {
  requestId: number;
  action: "accept" | "reject" | "block";
}

// 删除好友请求体
export interface DeleteFriendBody {
  friendshipId: number;
}

// 用户列表响应数据
export interface UsersListResponse {
  users: UserBasic[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 好友列表响应数据
export interface FriendsListResponse {
  friends: Friendship[];
  total: number;
}

// 好友请求列表响应数据
export interface FriendRequestsListResponse {
  requests: Friendship[];
  total: number;
}
