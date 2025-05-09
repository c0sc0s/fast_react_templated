import { server } from "@/api/server";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await server.listen({ port: PORT });
    console.log("server listening on", PORT);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
