import {Request, Response, NextFunction} from 'express';

export const errorMiddleware = async (err: Error, req: Request, res: Response, next: NextFunction) => {
try {
 let error: {name: string, message: string, code?: number}= {...err};
 error.message = err.message;
 console.error(error)

 //MongoDB bad ObjectId
 if(error.name === "CastError") {
  const message = 'Resource not found';
  error = new Error(message);
  res.status(404).json({success: false, message});
 }


 //MongoDB duplicate key error
 if(error.code === 11000) {
  const message = 'Duplicate field value entered';
  error = new Error(message);
  res.status(400).json({success: false, message});
 }

 //MongoDB validation error
 if(error.name === "ValidationError") {
  const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
  error = new Error(message);
  res.status(400).json({success: false, message});
 }


 res.status(error.code || 500).json({success: false, message: error.message || 'Server Error'})

}catch(err) {
 next(err);
}
}