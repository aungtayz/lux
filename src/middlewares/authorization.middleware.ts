import JWT from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import User from "../models/user.models.js";
dotenv.config();

if(!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

console.log(req.cookies);
   const token = req.cookies.token;
    


   if(!token) {
    return res.status(401).json({message: "Unauthorized"})
   }
  try {
 

  const decoded = JWT.verify(token, process.env.JWT_SECRET as string) as {email: string};


  const user = await User.find({ email: decoded.email }).select("-password");
console.log(user)

  if(!user) {
   return res.status(401).json({ message: "Unauthorized" })
  }

  // attach user to request for downstream handlers
  (req as any).user = user;

   next();


  }catch (err) {
   next(err)
  }
}
