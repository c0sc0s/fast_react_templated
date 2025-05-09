import path from "path";
import { logDir } from "./utils/logger";
import "dotenv/config";

export const loggerConfig = {
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      destination: path.join(logDir, `app-readable.log`),
      translateTime: "SYS:standard",
      colorize: false,
      singleLine: true,
    },
  },
};

export const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error("BASE_URL environment variable is required");
}

export const publicPaths = ["/health", "/auth/login", "/auth/register"];
