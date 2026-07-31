import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer'
import mongoose from "mongoose";
import transporter from '../utils/mailsender.js';
import JWT from 'jsonwebtoken';
import redis from 'redis';
import {Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import User from '../models/user.models.js';
dotenv.config();

interface User {
  email: string;
  password: string;
  name: string;
} 

const {JWT_SECRET} = process.env;
if(!JWT_SECRET) {
 throw new Error("JWT_SECRET must be defined in .env file");
}

const redisClient = redis.createClient({
  url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().catch((err) => {
  console.error('Redis connection failed', err);
});


// Attempts implementation
const getCachedAttempt = async (email: string) => {
  try {
    const value = await redisClient.get(`attempts:${email}`);
    if(!value) {
      await redisClient.set(`attempts:${email}`, '0', { EX: 60 * 5})
      
    }

    if(parseInt(value ||  '0' ) >= 5 ) {
      throw new Error('Too many attempts. Please try again later.');
    }
    await redisClient.set(`attempts:${email}`, parseInt(value || '0') + 1, { EX: 60 * 5})
  } catch(err) {
    console.error('Error getting cached attempt:', err);
  }
}




export const signupHandler = async (req: Request, res: Response, next: NextFunction) => { 

  try {
    
const {email, password, name} = req.body ;

const existingUser = await User.findOne({email});
if(existingUser) {
  return res.status(400).json({message: "User with this email already exists"});
}

const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt);

const OTP = crypto.randomInt(100000, 1000000).toString(); // 6 digits // Generate a random OTP
const hash = crypto.createHash('sha256').update(email + OTP).digest('hex')

// Store OTP hash and pending signup data in Redis for verification
await redisClient.set(`otp:${email}`, hash, { EX: 60 * 5 }); // expires in 5 minutes
await redisClient.set(
  `signup:${email}`,
  JSON.stringify({ name,  password: hashedPassword }),
  { EX: 60 * 5 }
);


//Send OTP code via nodemailer

try {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER, // sender address
    to: email, // list of recipients
    subject: "Register your account", // subject line
    text: "This is your OTP code", // plain text body
    html: `<p>Please use this OTP code to access our webpage <b>${OTP}</b></p>`, // HTML body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview URL is only available when using an Ethereal test account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} catch (err) {
  console.error("Error while sending mail:", err);
}


// Generate JWT token
const token = JWT.sign({userId: email.toString()}, JWT_SECRET, {expiresIn: '1h'});



res.cookie('token', token, {httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 })

res.status(201).json({"success": true, "data": {
  user: {name, email}
}})


  }catch(err) {
  
    next(err);
  }
}

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const {email, password} = req.body;

    const user = await User.findOne({email});

    if(!user) {
      return res.status(400).json({message: "Invalid email or password"});
    }

    const correctPassword = await bcrypt.compare(password, user.password);
    if(!correctPassword) {
      return res.status(400).json({message: "Invalid email or password"});
    }
    await getCachedAttempt(email)

    const token = JWT.sign({userId: user._id.toString()}, JWT_SECRET, {expiresIn: '1h'});

    res.cookie('token', token, {httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 })
    
    res.status(200).json({"success": true, "data": { user: {
      name: user.name, 
      email: user.email
    }
      
    }})
   

  }catch(err) {
    next(err)
  }
}



export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
}


export const verifyHandler = async (req: Request, res: Response, next: NextFunction) => {
   const session = await mongoose.startSession();
try { 
  
// Destructure the OTP and email
const {otp, email} = req.body;
const hashedOTP = crypto.createHash('sha256').update(email + otp).digest('hex');

//Retrieve the hashedOTP from cache
const cachedHash = await redisClient.get(`otp:${email}`);
const pendingSignupData = await redisClient.get(`signup:${email}`);
const signUpData = pendingSignupData ? JSON.parse(pendingSignupData) : null;

if (!cachedHash || !pendingSignupData) {
  return res.status(400).json({ message: "OTP expired or invalid" });
}

if( hashedOTP !== cachedHash ) {
  return res.status(400).json({message: "Incorrect OTP!"})
}
//Deleting the OTP in cache
await redisClient.del(`otp"${email}`);

const {name, password} = signUpData;
  session.startTransaction();
  const user = await User.create([{name, password, email}], {session});
    res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });

// // Generate JWT token
const token = JWT.sign({userId: email.toString()}, JWT_SECRET, {expiresIn: '1h'});

await session.commitTransaction();
session.endSession();
const userData = user[0].toObject();
console.log("User created: ", userData);

res.cookie('token', token, {httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 })

res.status(201).json({"success": true, "data": {
  user: {name: userData.name, email: userData.email}
}})


session.endSession();
}catch(err) {
  await session.abortTransaction();
    session.endSession();
    next(err);

}

}