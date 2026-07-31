import { Router } from "express";
import {authorize} from "../middlewares/authorization.middleware.js";
import { loginHandler, verifyHandler, logoutHandler, signupHandler } from "../controllers/auth.controllers.js";
const authRouter = Router();

       
authRouter.post('/signup', signupHandler)
authRouter.post('/verify', authorize, verifyHandler )
authRouter.post('/logout', logoutHandler)
authRouter.post('/login', loginHandler)
export default authRouter;               