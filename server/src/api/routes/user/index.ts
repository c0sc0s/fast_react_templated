import { FastifyPluginAsync } from "fastify";
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  searchUsers,
  getFriends,
  getFriendRequests,
  addFriend,
  handleFriendRequest,
  deleteFriend,
} from "./handlers";
import {
  getUserRouteSchema,
  searchUsersRouteSchema,
  getCurrentUserRouteSchema,
  getFriendsRouteSchema,
  getFriendRequestsRouteSchema,
  addFriendRouteSchema,
  handleFriendRequestRouteSchema,
  deleteFriendRouteSchema,
} from "./schema";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // 用户个人资料相关路由
  fastify.get("/me", { schema: getCurrentUserRouteSchema }, getCurrentUser);
  fastify.get("/all", getAllUsers);
  fastify.get("/search", { schema: searchUsersRouteSchema }, searchUsers);
  fastify.get("/:id", { schema: getUserRouteSchema }, getUserById);

  // 好友相关路由
  fastify.get("/friends", { schema: getFriendsRouteSchema }, getFriends);
  fastify.get(
    "/friend-requests",
    { schema: getFriendRequestsRouteSchema },
    getFriendRequests
  );
  fastify.post("/add-friend", { schema: addFriendRouteSchema }, addFriend);
  fastify.post(
    "/handle-friend-request",
    { schema: handleFriendRequestRouteSchema },
    handleFriendRequest
  );
  fastify.post(
    "/delete-friend",
    {
      schema: deleteFriendRouteSchema,
      onRequest: [fastify.authenticate],
    },
    deleteFriend
  );
};

export default userRoutes;
