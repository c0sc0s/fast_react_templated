import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import { FastifyPluginAsync, FastifyRequest } from "fastify";

// 在线用户连接管理
export const connections = new Map<number, Set<WebSocket>>();

// WebSocket连接处理函数类型
export type WebSocketHandler = (
  connection: WebSocket,
  request: FastifyRequest,
  userId: number
) => void;

// WebSocket插件
const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  // 注册WebSocket插件
  fastify.register(websocket);

  // 通用WebSocket路由处理器
  fastify.decorate(
    "ws",
    function (path: string, options, handler: WebSocketHandler) {
      fastify.route({
        method: "GET",
        url: path,
        ...options,
        handler: (req, reply) => {
          // 不需要HTTP处理，因为WebSocket会接管
          reply.send();
        },
        wsHandler: (connection, req) => {
          // 确保用户已认证
          if (!req.user?.id) {
            connection.socket.send(
              JSON.stringify({
                type: "error",
                message: "Unauthorized",
              })
            );
            connection.socket.close();
            return;
          }

          const userId = req.user.id;

          // 添加连接到用户的连接池
          addConnection(userId, connection.socket);

          // 更新用户的在线状态
          fastify.prisma.user
            .update({
              where: { id: userId },
              data: {
                status: "online",
                lastActiveAt: new Date(),
              },
            })
            .catch((err) => {
              fastify.log.error("Failed to update user status:", err);
            });

          // 处理WebSocket连接
          handler(connection.socket, req, userId);

          // 连接关闭时处理
          connection.socket.on("close", async () => {
            removeConnection(userId, connection.socket);

            // 检查用户是否还有其他连接
            if (!connections.has(userId)) {
              // 更新用户为离线状态
              await fastify.prisma.user
                .update({
                  where: { id: userId },
                  data: {
                    status: "offline",
                    lastActiveAt: new Date(),
                  },
                })
                .catch((err) => {
                  fastify.log.error(
                    "Failed to update user status on disconnect:",
                    err
                  );
                });
            }
          });
        },
      });
    }
  );
};

// 广播消息给用户
export const broadcastToUser = (userId: number, message): void => {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const messageStr = JSON.stringify(message);
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
};

// 广播消息给多个用户
export const broadcastToUsers = (userIds: number[], message): void => {
  const messageStr = JSON.stringify(message);
  userIds.forEach((userId) => {
    const userConnections = connections.get(userId);
    if (userConnections) {
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  });
};

// 添加连接
export const addConnection = (userId: number, ws: WebSocket): void => {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)?.add(ws);
};

// 移除连接
export const removeConnection = (userId: number, ws: WebSocket): void => {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(ws);
    if (userConnections.size === 0) {
      connections.delete(userId);
    }
  }
};

export default fp(websocketPlugin);
