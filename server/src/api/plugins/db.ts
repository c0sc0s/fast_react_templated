import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const prisma = new PrismaClient();

  await prisma.$connect();

  // 将 Prisma 客户端添加到 Fastify 实例
  fastify.decorate<PrismaClient>("prisma", prisma);

  // 应用关闭时断开 Prisma 连接
  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});

export default prismaPlugin;
