import { FastifyRequest, FastifyReply } from "fastify";
import { LoginInput, RegisterInput } from "./schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import response from "@/api/utils/response";
import { USER_STATUS } from "@/common/const";

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        status: true,
      },
    });

    if (!user) {
      return response.error(reply, "用户不存在", 404);
    }

    return response.success(reply, { user }, "获取用户信息成功");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "获取用户信息失败，请稍后再试");
  }
}
// 登录处理
export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { email, password } = request.body;

  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return response.error(reply, "不存在该用户", 401);
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return response.error(reply, "密码不匹配", 401);
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // 更新最后活动时间
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: USER_STATUS.ONLINE,
        lastActiveAt: new Date(),
      },
    });

    // 返回用户信息和令牌
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: USER_STATUS.ONLINE,
    };

    return response.success(reply, { user: userData, token }, "登录成功");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "登录失败，请稍后再试");
  }
}

// 注册处理
const HASH_ROUNDS = 10;
export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  const { prisma } = request.server;
  const { username, email, password, phone } = request.body;

  console.log(username, email, password, phone);

  try {
    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return response.error(reply, "邮箱已被注册", 400);
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return response.error(reply, "用户名已被使用", 400);
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return response.error(reply, "手机号已被注册", 400);
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone: phone || null, // 确保phone是从请求中获取的
        avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${username}`, // 生成默认头像
        status: "online",
        lastActiveAt: new Date(),
      },
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // 返回用户信息和令牌
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    };

    return response.success(reply, { user: userData, token }, "注册成功");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "注册失败，请稍后再试");
  }
}

// 退出登录处理
export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const { prisma } = request.server;
  const userId = request.user?.id;

  if (!userId) {
    return response.unauthorized(reply);
  }

  try {
    // 更新用户状态为离线
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: USER_STATUS.OFFLINE,
        lastActiveAt: new Date(),
      },
    });

    return response.success(reply, null, "已成功退出登录");
  } catch (error) {
    request.log.error(error);
    return response.serverError(reply, "退出登录失败，请稍后再试");
  }
}
