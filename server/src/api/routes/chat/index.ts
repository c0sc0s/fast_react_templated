import { FastifyPluginAsync } from "fastify";
import {
  getConversations,
  getConversation,
  createDirectConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  readMessages,
  deleteMessage,
  initiateCall,
  updateCallStatus,
} from "./handlers";
import {
  getConversationsRouteSchema,
  getConversationRouteSchema,
  createDirectConversationRouteSchema,
  createGroupConversationRouteSchema,
  getMessagesRouteSchema,
  sendMessageRouteSchema,
  readMessagesRouteSchema,
  deleteMessageRouteSchema,
  initiateCallRouteSchema,
  updateCallStatusRouteSchema,
} from "./schema";

import { broadcastToUsers } from "../../plugins/websocket";

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // 会话管理路由
  fastify.get(
    "/conversations",
    { schema: getConversationsRouteSchema, onRequest: [fastify.authenticate] },
    getConversations
  );

  fastify.get(
    "/conversations/:id",
    { schema: getConversationRouteSchema, onRequest: [fastify.authenticate] },
    getConversation
  );

  fastify.post(
    "/conversations/direct",
    {
      schema: createDirectConversationRouteSchema,
      onRequest: [fastify.authenticate],
    },
    createDirectConversation
  );

  fastify.post(
    "/conversations/group",
    {
      schema: createGroupConversationRouteSchema,
      onRequest: [fastify.authenticate],
    },
    createGroupConversation
  );

  // 消息管理路由
  fastify.get(
    "/conversations/:conversationId/messages",
    { schema: getMessagesRouteSchema, onRequest: [fastify.authenticate] },
    getMessages
  );

  fastify.post(
    "/messages",
    { schema: sendMessageRouteSchema, onRequest: [fastify.authenticate] },
    sendMessage
  );

  fastify.post(
    "/messages/read",
    { schema: readMessagesRouteSchema, onRequest: [fastify.authenticate] },
    readMessages
  );

  fastify.delete(
    "/messages/:id",
    { schema: deleteMessageRouteSchema, onRequest: [fastify.authenticate] },
    deleteMessage
  );

  // 通话相关路由
  fastify.post(
    "/calls/initiate",
    { schema: initiateCallRouteSchema, onRequest: [fastify.authenticate] },
    initiateCall
  );

  fastify.post(
    "/calls/status",
    { schema: updateCallStatusRouteSchema, onRequest: [fastify.authenticate] },
    updateCallStatus
  );

  // WebSocket连接
  fastify.ws(
    "/ws/connect",
    {
      onRequest: [fastify.authenticate],
    },
    (connection, request, userId) => {
      // 连接建立时的处理
      connection.send(
        JSON.stringify({
          type: "connection_established",
          data: { userId, timestamp: new Date() },
        })
      );

      // 接收消息的处理
      connection.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // 处理不同类型的客户端消息
          if (data.type === "typing") {
            // 处理正在输入状态
            handleTypingStatus(fastify, data, userId);
          } else if (data.type === "ping") {
            // 回应心跳
            connection.send(
              JSON.stringify({ type: "pong", data: { timestamp: new Date() } })
            );
          }
        } catch (err) {
          fastify.log.error(`WebSocket message parsing error: ${err}`);
          connection.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });
    }
  );
};

// 处理用户正在输入的状态
async function handleTypingStatus(fastify, data, userId) {
  try {
    const { conversationId } = data;

    // 检查用户是否是会话参与者
    const participant = await fastify.prisma.conversationParticipant.findUnique(
      {
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      }
    );

    if (!participant) return;

    // 获取其他参与者
    const otherParticipants =
      await fastify.prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: {
            not: userId,
          },
        },
        select: {
          userId: true,
        },
      });

    // 获取当前用户信息
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    // 通知其他参与者
    const otherParticipantIds = otherParticipants.map((p) => p.userId);

    if (otherParticipantIds.length > 0 && user) {
      broadcastToUsers(otherParticipantIds, {
        type: "user_typing",
        data: {
          conversationId,
          user: {
            id: user.id,
            username: user.username,
          },
          timestamp: new Date(),
        },
      });
    }
  } catch (error) {
    fastify.log.error(`Error handling typing status: ${error}`);
  }
}

export default chatRoutes;
