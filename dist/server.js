import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from 'dotenv';
import mongoose from "mongoose";
import { errorMiddleware } from "./middlewares/error_middleware.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/users.routes.js";
dotenv.config();
const { PORT, MONGO_URI } = process.env;
// Check if env variables are defined
if (!PORT || !MONGO_URI) {
    throw new Error("PORT and MONGO_URI must be defined in .env file");
}
// Declaring Sever
const app = express();
//Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(errorMiddleware);
// Logger middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
//Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server is running: Yayyyyyy! `);
        });
    }
    catch (err) {
        throw new Error(`Failed to connect to MongoDB ${err}`);
    }
};
startServer();
