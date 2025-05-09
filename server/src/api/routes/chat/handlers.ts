import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetConversationsParams,
  GetConversationParams,
  CreateDirectConversationBody,
  CreateGroupConversationBody,
  ReadMessagesBody,
  GetMessagesParams,
  SendMessageBody,
  DeleteMessageParams,
  InitiateCallBody,
  UpdateCallStatusBody,
} from "./schema";
import response from "../../utils/response";
import { broadcastToUser, broadcastToUsers } from "../../plugins/websocket";

// 获取当前用户的所有会话
export async function getConversations(
  request: FastifyRequest<{ Querystring: GetConversationsParams }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  const { page = "1", limit = "20" } = request.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    // 查询用户参与的所有会话
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  status: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.conversationParticipant.count({
        where: {
          userId,
        },
      }),
    ]);

    // 获取未读消息计数
    const userConversationParticipants =
      await prisma.conversationParticipant.findMany({
        where: {
          userId,
          conversationId: {
            in: conversations.map((conv) => conv.id),
          },
        },
      });

    // 格式化会话数据
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = userConversationParticipants.find(
          (p) => p.conversationId === conversation.id
        );

        // 计算未读消息数量
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
            senderId: {
              not: userId,
            },
          },
        });

        // 处理参与者信息 - 排除当前用户
        const otherParticipants = conversation.participants
          .filter((p) => p.userId !== userId)
          .map((p) => p.user);

        // 获取最后一条消息
        const lastMessage = conversation.messages[0]
          ? {
              id: conversation.messages[0].id,
              content: conversation.messages[0].content,
              type: conversation.messages[0].type,
              createdAt: conversation.messages[0].createdAt,
              senderId: conversation.messages[0].senderId,
              senderName: conversation.messages[0].sender.username,
            }
          : null;

        return {
          id: conversation.id,
          type: conversation.type,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
          isArchived: participant?.isArchived || false,
          isMuted: participant?.isMuted || false,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          participants: otherParticipants,
          lastMessage,
          group: conversation.group,
        };
      })
    );

    return response.success(reply, {
      conversations: formattedConversations,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + conversations.length < total,
    });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取会话列表失败");
  }
}

// 获取特定会话详情
export async function getConversation(
  request: FastifyRequest<{ Params: GetConversationParams }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { id } = request.params;
  const conversationId = parseInt(id, 10);

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 检查用户是否为会话参与者
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return response.notFound(reply, "会话不存在或您无权访问");
    }

    // 获取会话详情
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!conversation) {
      return response.notFound(reply, "会话不存在");
    }

    // 计算未读消息数量
    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        createdAt: {
          gt: participant.lastReadAt,
        },
        senderId: {
          not: userId,
        },
      },
    });

    // 处理参与者信息 - 排除当前用户
    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.user);

    // 获取最后一条消息
    const lastMessage = conversation.messages[0]
      ? {
          id: conversation.messages[0].id,
          content: conversation.messages[0].content,
          type: conversation.messages[0].type,
          createdAt: conversation.messages[0].createdAt,
          senderId: conversation.messages[0].senderId,
          senderName: conversation.messages[0].sender.username,
        }
      : null;

    // 格式化会话数据
    const formattedConversation = {
      id: conversation.id,
      type: conversation.type,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      isArchived: participant.isArchived,
      isMuted: participant.isMuted,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: otherParticipants,
      lastMessage,
      group: conversation.group,
    };

    return response.success(reply, formattedConversation);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取会话详情失败");
  }
}

// 创建私聊会话
export async function createDirectConversation(
  request: FastifyRequest<{ Body: CreateDirectConversationBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { userId: targetUserId } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  // 不能与自己创建私聊
  if (userId === targetUserId) {
    return response.error(reply, "不能与自己创建私聊", 400);
  }

  try {
    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return response.notFound(reply, "用户不存在");
    }

    // 检查是否已有私聊会话
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        participants: {
          every: {
            userId: {
              in: [userId, targetUserId],
            },
          },
        },
        AND: [
          {
            participants: {
              some: {
                userId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: targetUserId,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // 如果已有会话，直接返回
    if (existingConversation) {
      // 获取参与者信息 - 排除当前用户
      const otherParticipants = existingConversation.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.user);

      // 获取会话信息
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: existingConversation.id,
            userId,
          },
        },
      });

      // 获取最后一条消息
      const lastMessage = await prisma.message.findFirst({
        where: {
          conversationId: existingConversation.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // 格式化会话数据
      const formattedConversation = {
        id: existingConversation.id,
        type: existingConversation.type,
        lastMessageAt: existingConversation.lastMessageAt,
        unreadCount: 0, // 需要计算
        isArchived: participant?.isArchived || false,
        isMuted: participant?.isMuted || false,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
        participants: otherParticipants,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.username,
            }
          : null,
        group: null,
      };

      return response.success(reply, formattedConversation);
    }

    // 创建新的私聊会话
    const newConversation = await prisma.conversation.create({
      data: {
        type: "direct",
        participants: {
          create: [
            {
              userId,
            },
            {
              userId: targetUserId,
            },
          ],
        },
      },
    });

    // 返回新会话的详情
    const createdConversation = {
      id: newConversation.id,
      type: newConversation.type,
      lastMessageAt: newConversation.lastMessageAt,
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
      participants: [
        {
          id: targetUser.id,
          username: targetUser.username,
          avatar: targetUser.avatar,
          status: targetUser.status,
        },
      ],
      lastMessage: null,
      group: null,
    };

    return response.success(reply, createdConversation);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "创建私聊会话失败");
  }
}

// 创建群聊会话
export async function createGroupConversation(
  request: FastifyRequest<{ Body: CreateGroupConversationBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { name, userIds } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  // 确保当前用户被包含在群组中
  if (!userIds.includes(userId)) {
    userIds.push(userId);
  }

  try {
    // 创建群组
    const group = await prisma.group.create({
      data: {
        name,
        creatorId: userId,
        members: {
          create: userIds.map((memberId) => ({
            userId: memberId,
            role: memberId === userId ? "owner" : "member",
          })),
        },
      },
    });

    // 创建群聊会话
    const conversation = await prisma.conversation.create({
      data: {
        type: "group",
        groupId: group.id,
        participants: {
          create: userIds.map((memberId) => ({
            userId: memberId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        group: true,
      },
    });

    // 获取参与者信息 - 排除当前用户
    const otherParticipants = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.user);

    // 格式化返回数据
    const formattedConversation = {
      id: conversation.id,
      type: conversation.type,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: otherParticipants,
      lastMessage: null,
      group: conversation.group
        ? {
            id: conversation.group.id,
            name: conversation.group.name,
            avatar: conversation.group.avatar,
          }
        : null,
    };

    // 通知其他群组成员
    userIds
      .filter((id) => id !== userId)
      .forEach((id) => {
        broadcastToUser(id, {
          type: "group_conversation_created",
          data: formattedConversation,
        });
      });

    return response.success(reply, formattedConversation);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "创建群聊会话失败");
  }
}

// 获取会话的消息列表
export async function getMessages(
  request: FastifyRequest<{
    Params: { conversationId: string };
    Querystring: {
      page?: string;
      limit?: string;
      before?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { conversationId } = request.params;
  const { page = "1", limit = "20", before } = request.query;

  if (!userId) {
    return response.unauthorized(reply);
  }

  const conversationIdNum = parseInt(conversationId, 10);
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    // 检查用户是否为会话参与者
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conversationIdNum,
          userId,
        },
      },
    });

    if (!participant) {
      return response.notFound(reply, "会话不存在或您无权访问");
    }

    // 构建查询条件
    const whereCondition: any = {
      conversationId: conversationIdNum,
      deletedAt: null,
    };

    // 如果指定了before参数，获取该消息之前的消息
    if (before) {
      const beforeMessageId = parseInt(before, 10);
      const beforeMessage = await prisma.message.findUnique({
        where: { id: beforeMessageId },
      });

      if (beforeMessage) {
        whereCondition.createdAt = {
          lt: beforeMessage.createdAt,
        };
      }
    }

    // 查询消息
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc", // 最新的消息在前
        },
        skip,
        take: limitNum,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              sender: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      }),
      prisma.message.count({
        where: whereCondition,
      }),
    ]);

    // 更新最后阅读时间
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: conversationIdNum,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // 格式化消息数据
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatar: message.sender.avatar,
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderId: message.replyTo.senderId,
            senderName: message.replyTo.sender.username,
          }
        : null,
      callStatus: message.callStatus,
      callDuration: message.callDuration,
    }));

    return response.success(reply, {
      messages: formattedMessages,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + messages.length < total,
    });
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取消息失败");
  }
}

// 发送消息
export async function sendMessage(
  request: FastifyRequest<{ Body: SendMessageBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { conversationId, content, type, mediaUrl, replyToId } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 检查会话是否存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return response.notFound(reply, "会话不存在");
    }

    // 检查用户是否为会话参与者
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId
    );

    if (!isParticipant) {
      return response.error(reply, "您不是该会话的参与者", 403);
    }

    // 如果是回复消息，检查回复的消息是否存在
    if (replyToId) {
      const replyToMessage = await prisma.message.findUnique({
        where: { id: replyToId },
      });

      if (!replyToMessage || replyToMessage.conversationId !== conversationId) {
        return response.error(reply, "回复的消息不存在或不属于当前会话", 400);
      }
    }

    // 创建新消息
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        type,
        mediaUrl,
        replyToId,
        status: "sent",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    // 更新会话的最后消息时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    // 更新发送者的已读状态
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // 格式化消息数据
    const formattedMessage = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatar: message.sender.avatar,
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderId: message.replyTo.senderId,
            senderName: message.replyTo.sender.username,
          }
        : null,
      callStatus: message.callStatus,
      callDuration: message.callDuration,
    };

    // 向会话的其他参与者发送消息通知
    const otherParticipantIds = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    broadcastToUsers(otherParticipantIds, {
      type: "new_message",
      data: formattedMessage,
    });

    return response.success(reply, formattedMessage);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "发送消息失败");
  }
}

// 标记消息为已读
export async function readMessages(
  request: FastifyRequest<{ Body: ReadMessagesBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { conversationId, lastReadMessageId } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 检查会话是否存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return response.notFound(reply, "会话不存在");
    }

    // 构建更新数据
    const updateData: any = {
      lastReadAt: new Date(),
    };

    // 如果指定了最后读取的消息ID，更新相应消息的状态
    if (lastReadMessageId) {
      // 获取该消息及之前的所有未读消息
      await prisma.message.updateMany({
        where: {
          conversationId,
          id: {
            lte: lastReadMessageId,
          },
          senderId: {
            not: userId,
          },
          status: {
            in: ["sent", "delivered"],
          },
        },
        data: {
          status: "read",
        },
      });

      // 获取最后一条消息的时间
      const lastMessage = await prisma.message.findUnique({
        where: { id: lastReadMessageId },
      });

      if (lastMessage) {
        updateData.lastReadAt = lastMessage.createdAt;
      }
    }

    // 更新会话参与者的已读状态
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: updateData,
    });

    // 通知消息发送者消息已读
    if (lastReadMessageId) {
      const message = await prisma.message.findUnique({
        where: { id: lastReadMessageId },
      });

      if (message && message.senderId !== userId) {
        broadcastToUser(message.senderId, {
          type: "message_read",
          data: {
            messageId: lastReadMessageId,
            conversationId,
            readBy: userId,
            readAt: new Date(),
          },
        });
      }
    }

    return response.success(reply, null, "消息已标记为已读");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "标记消息为已读失败");
  }
}

// 删除消息
export async function deleteMessage(
  request: FastifyRequest<{ Params: DeleteMessageParams }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { id } = request.params;
  const messageId = parseInt(id, 10);

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 获取消息详情
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      return response.notFound(reply, "消息不存在");
    }

    // 检查权限 - 只有消息发送者可以删除消息
    if (message.senderId !== userId) {
      return response.error(reply, "您没有权限删除此消息", 403);
    }

    // 软删除消息（保留记录但标记为已删除）
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: null, // 清空内容
      },
    });

    // 通知会话的其他参与者消息已删除
    const otherParticipantIds = message.conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    broadcastToUsers(otherParticipantIds, {
      type: "message_deleted",
      data: {
        messageId,
        conversationId: message.conversationId,
        deletedAt: new Date(),
      },
    });

    return response.success(reply, null, "消息已删除");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "删除消息失败");
  }
}

// 发起通话
export async function initiateCall(
  request: FastifyRequest<{ Body: InitiateCallBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { conversationId, type } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 检查会话是否存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return response.notFound(reply, "会话不存在");
    }

    // 检查用户是否为会话参与者
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId
    );
    if (!isParticipant) {
      return response.error(reply, "您不是该会话的参与者", 403);
    }

    // 对于私聊，获取接收者ID
    let receiverId: number | null = null;
    if (conversation.type === "direct") {
      const receiver = conversation.participants.find(
        (p) => p.userId !== userId
      );
      if (receiver) {
        receiverId = receiver.userId;
      }
    }

    // 创建通话消息
    const callMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId, // 只在私聊中设置
        content: `${type === "audio" ? "语音" : "视频"}通话`,
        type: type === "audio" ? "call_audio" : "call_video",
        callStatus: "missed", // 初始状态，如果被接听会更新
        callStartedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // 更新会话的最后消息时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: callMessage.createdAt,
      },
    });

    // 格式化通话消息
    const formattedCallMessage = {
      id: callMessage.id,
      conversationId: callMessage.conversationId,
      senderId: callMessage.senderId,
      content: callMessage.content,
      type: callMessage.type,
      mediaUrl: null,
      status: callMessage.status,
      createdAt: callMessage.createdAt,
      updatedAt: callMessage.updatedAt,
      sender: {
        id: callMessage.sender.id,
        username: callMessage.sender.username,
        avatar: callMessage.sender.avatar,
      },
      replyTo: null,
      callStatus: callMessage.callStatus,
      callDuration: callMessage.callDuration,
    };

    // 通知其他参与者有新的通话请求
    const otherParticipantIds = conversation.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    broadcastToUsers(otherParticipantIds, {
      type: "incoming_call",
      data: {
        ...formattedCallMessage,
        callType: type,
      },
    });

    return response.success(reply, formattedCallMessage);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "发起通话失败");
  }
}

// 更新通话状态
export async function updateCallStatus(
  request: FastifyRequest<{ Body: UpdateCallStatusBody }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const userId = request.user?.id;
  const { messageId, status, duration } = request.body;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 获取通话消息
    const callMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!callMessage || !callMessage.type.startsWith("call_")) {
      return response.notFound(reply, "通话不存在");
    }

    // 检查权限 - 只有通话参与者可以更新通话状态
    const isParticipant =
      callMessage.senderId === userId || callMessage.receiverId === userId;
    if (!isParticipant) {
      return response.error(reply, "您不是该通话的参与者", 403);
    }

    // 更新通话状态
    const updateData: any = {
      callStatus: status,
    };

    // 如果是结束通话，记录持续时间和结束时间
    if (status === "completed" && duration) {
      updateData.callDuration = duration;
      updateData.callEndedAt = new Date();
    }

    // 更新通话消息
    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    // 通知其他通话参与者状态变更
    const otherParticipantId =
      callMessage.senderId === userId
        ? callMessage.receiverId
        : callMessage.senderId;

    if (otherParticipantId) {
      broadcastToUser(otherParticipantId, {
        type: "call_status_changed",
        data: {
          messageId,
          status,
          duration: updateData.callDuration,
          callEndedAt: updateData.callEndedAt,
        },
      });
    }

    return response.success(reply, null, `通话已${getCallStatusText(status)}`);
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "更新通话状态失败");
  }
}

// 获取通话状态文本
function getCallStatusText(status: string): string {
  switch (status) {
    case "answered":
      return "接听";
    case "rejected":
      return "拒绝";
    case "completed":
      return "结束";
    case "missed":
      return "未接听";
    default:
      return status;
  }
}
