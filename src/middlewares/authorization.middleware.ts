import JWT from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import User from "../models/user.models.js";
dotenv.config();

if(!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const token = req.cookies.token;

   if(!token) {
    return res.status(401).json({message: "Unauthorized"})
   }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET as string) as {
      userId?: string;
      email?: string;
    };

    let user = null;

    if (decoded.userId) {
      user = await User.findById(decoded.userId).select("-password");
    } else if (decoded.email) {
      user = await User.findOne({ email: decoded.email }).select("-password");
    }

    if(!user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    (req as any).user = user;

    next();
  }catch (err) {
   next(err)
  }
}
