import JWT from "jsonwebtoken";
import dotenv from 'dotenv';
import User from "../models/user.models.js";
dotenv.config();
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
export const authorize = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        let user = null;
        if (decoded.userId) {
            user = await User.findById(decoded.userId).select("-password");
        }
        else if (decoded.email) {
            user = await User.findOne({ email: decoded.email }).select("-password");
        }
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
};
