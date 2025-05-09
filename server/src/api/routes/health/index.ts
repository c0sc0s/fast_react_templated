import { FastifyInstance } from "fastify";
import response from "@/api/utils/response";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (request, reply) => {
    return response.success(reply, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });
}
