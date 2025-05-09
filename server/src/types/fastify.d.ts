/// <reference types="fastify" />
import { PrismaClient } from "@prisma/client";

// 扩展 Fastify 类型
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request, reply) => Promise<void>;
    ws: (path: string, options, handler: WebSocketHandler) => void;
  }
  interface FastifyRequest {
    user?: {
      id: number;
      email: string;
    };
    isPublicRoute?: boolean;
  }
}
