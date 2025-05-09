import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import response from "../utils/response";
import jwt from "jsonwebtoken";
import { BASE_URL } from "../server";
import { jwtSecret } from "../config";

interface AuthOptions {
  publicPaths?: string[];
}

const DEFAULT_OPTIONS: AuthOptions = {
  publicPaths: [],
};

const authPlugin: FastifyPluginAsync<AuthOptions> = fp(
  async (fastify, options) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const publicPaths = [...(opts.publicPaths || [])].map(
      (path) => BASE_URL + path
    );

    function isPublicRoute(path: string): boolean {
      return publicPaths.some((publicPath) => path === publicPath);
    }

    fastify.decorate("public", () => {
      return function (request: FastifyRequest, done: () => void) {
        request.isPublicRoute = true;
        done();
      };
    });

    fastify.decorate("authenticate", authenticate);

    // 添加认证中间件到以下所有路由
    fastify.addHook("preHandler", async (request, reply) => {
      if (request.isPublicRoute || isPublicRoute(request.url)) {
        return;
      }

      await fastify.authenticate(request, reply);
    });
  }
);

const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 验证令牌逻辑
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("缺少授权令牌");
    }

    const token = authHeader.split(" ")[1];

    // 验证JWT令牌
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: number;
        email: string;
      };

      // 设置用户ID到请求对象
      request.user = {
        id: decoded.userId,
        email: decoded.email,
      };
    } catch {
      throw new Error("无效的令牌");
    }
  } catch (error) {
    return response.unauthorized(reply, (error as Error).message);
  }
};

export default authPlugin;
