import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetUserParams,
  SearchUsersQuery,
  AddFriendBody,
  HandleFriendRequestBody,
  DeleteFriendBody,
} from "./schema";
import response from "../../utils/response";

// 获取所有用户
export async function getAllUsers(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { prisma } = request.server;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    return response.success(reply, { users, total: users.length });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取用户列表失败");
  }
}

// 根据ID获取用户信息
export async function getUserById(
  request: FastifyRequest<{ Params: GetUserParams }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { id } = request.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
        // 不返回敏感信息如密码
      },
    });

    if (!user) {
      return response.notFound(reply, "用户不存在");
    }

    return response.success(reply, user);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取用户信息失败");
  }
}

// 搜索用户
export async function searchUsers(
  request: FastifyRequest<{ Querystring: SearchUsersQuery }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { keyword, page = "1", limit = "10" } = request.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    // 避免搜索自己
    const currentUserId = request.user?.id;

    // 搜索用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword } },
            { email: { contains: keyword } },
          ],
          // 排除当前用户
          ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          status: true,
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: keyword } },
            { email: { contains: keyword } },
          ],
          ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
        },
      }),
    ]);

    return response.success(reply, {
      users,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + users.length < total,
    });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "搜索用户失败");
  }
}

// 获取当前登录用户信息
export async function getCurrentUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return response.notFound(reply, "用户不存在");
    }

    return response.success(reply, user);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取当前用户信息失败");
  }
}

// 获取好友列表
export async function getFriends(request: FastifyRequest, reply: FastifyReply) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 查询已接受的好友关系
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: "accepted",
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    // 处理好友数据，确保返回正确的用户信息
    const friends = friendships.map((friendship) => {
      const friendUser =
        friendship.initiatorId === userId
          ? friendship.receiver
          : friendship.initiator;

      return {
        ...friendship,
        user: friendUser,
      };
    });

    return response.success(reply, {
      friends,
      total: friends.length,
    });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取好友列表失败");
  }
}

// 获取好友请求列表
export async function getFriendRequests(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 查询待处理的好友请求
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: "pending",
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    // 处理请求数据
    const requests = pendingRequests.map((request) => ({
      ...request,
      user: request.initiator,
    }));

    return response.success(reply, {
      requests,
      total: requests.length,
    });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取好友请求列表失败");
  }
}

// 添加好友
export async function addFriend(
  request: FastifyRequest<{ Body: AddFriendBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { userId: friendId } = request.body;
  const currentUserId = request.user?.id;

  if (!currentUserId) {
    return response.unauthorized(reply);
  }

  // 不能添加自己为好友
  if (currentUserId === friendId) {
    return response.error(reply, "不能添加自己为好友", 400);
  }

  try {
    // 检查目标用户是否存在
    const friendUser = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friendUser) {
      return response.notFound(reply, "用户不存在");
    }

    // 检查是否已经是好友
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            initiatorId: currentUserId,
            receiverId: friendId,
          },
          {
            initiatorId: friendId,
            receiverId: currentUserId,
          },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return response.error(reply, "已经是好友关系", 400);
      } else if (existingFriendship.status === "pending") {
        return response.error(reply, "好友请求已发送，等待对方接受", 400);
      } else if (existingFriendship.status === "blocked") {
        return response.error(reply, "无法添加该用户为好友", 400);
      }
    }

    // 创建好友请求
    await prisma.friendship.create({
      data: {
        initiatorId: currentUserId,
        receiverId: friendId,
        status: "pending",
        // 这里可以添加请求信息等额外数据
      },
    });

    return response.success(reply, null, "好友请求已发送");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "添加好友失败");
  }
}

// 处理好友请求
export async function handleFriendRequest(
  request: FastifyRequest<{ Body: HandleFriendRequestBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { requestId, action } = request.body;
  const currentUserId = request.user?.id;

  if (!currentUserId) {
    return response.unauthorized(reply);
  }

  try {
    // 查找好友请求
    const friendRequest = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        receiverId: currentUserId,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return response.notFound(reply, "好友请求不存在或已处理");
    }

    let statusMessage = "";

    // 根据操作更新状态
    if (action === "accept") {
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });
      statusMessage = "已接受好友请求";
    } else if (action === "reject") {
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: "rejected" },
      });
      statusMessage = "已拒绝好友请求";
    } else if (action === "block") {
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: "blocked" },
      });
      statusMessage = "已屏蔽该用户";
    }

    return response.success(reply, null, statusMessage);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "处理好友请求失败");
  }
}

// 删除好友
export async function deleteFriend(
  request: FastifyRequest<{ Body: DeleteFriendBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { friendshipId } = request.body;
  const currentUserId = request.user?.id;

  if (!currentUserId) {
    return response.unauthorized(reply);
  }

  try {
    // 查找好友关系
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        OR: [{ initiatorId: currentUserId }, { receiverId: currentUserId }],
        status: "accepted",
      },
    });

    if (!friendship) {
      return response.notFound(reply, "好友关系不存在");
    }

    // 删除好友关系
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return response.success(reply, null, "已成功删除好友");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "删除好友失败");
  }
}
