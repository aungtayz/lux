import { Router } from "express";
import { authorize } from "../middlewares/authorization.middleware.js";
import { getUsers, getUser, getProfile } from "../controllers/users.controllers.js";
const userRouter = Router();
userRouter.get("/", getUsers);
userRouter.get("/profile", authorize, getProfile);
userRouter.get("/:id", getUser);
export default userRouter;
