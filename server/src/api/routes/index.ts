import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import authRoutes from "./auth";
import userRoutes from "./user";
import healthRoutes from "./health";
import chatRoutes from "./chat";

interface RouteConfig {
  prefix?: string;
  routes: FastifyPluginAsync;
}

const routeConfigs: RouteConfig[] = [
  {
    prefix: "/auth",
    routes: authRoutes,
  },
  {
    prefix: "/users",
    routes: userRoutes,
  },
  {
    prefix: "/chat",
    routes: chatRoutes,
  },
  {
    routes: healthRoutes,
  },
];

const routes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  for (const routeConfig of routeConfigs) {
    app.register(routeConfig.routes, { prefix: routeConfig.prefix || "" });
  }
};

export default routes;
