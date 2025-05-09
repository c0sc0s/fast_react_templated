import { FastifyInstance } from "fastify";
import { getMe, login, logout, register } from "./handlers";
import {
  loginRouteSchema,
  registerRouteSchema,
  logoutRouteSchema,
} from "./schema";

export default async function authRoutes(fastify: FastifyInstance) {
  // 登录路由
  fastify.post("/login", {
    schema: loginRouteSchema,
    handler: login,
  });

  // 注册路由
  fastify.post("/register", {
    schema: registerRouteSchema,
    handler: register,
  });

  // 登出路由 - 需要身份验证
  fastify.post("/logout", {
    onRequest: [fastify.authenticate],
    schema: logoutRouteSchema,
    handler: logout,
  });

  fastify.get("/me", {
    onRequest: [fastify.authenticate],
    handler: getMe,
  });
}
