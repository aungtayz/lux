import { Router } from "express";
import { loginHandler, verifyHandler, logoutHandler, signupHandler } from "../controllers/auth.controllers.js";
const authRouter = Router();

       
authRouter.post('/signup', signupHandler)
authRouter.post('/verify', verifyHandler )
authRouter.post('/logout', logoutHandler)
authRouter.post('/login', loginHandler)
export default authRouter;               