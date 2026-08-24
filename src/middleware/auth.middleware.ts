import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { IUser } from "../types/user.interface";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. প্রথমে HttpOnly cookie থেকে token নেবে
    let token = req.cookies?.token;

    // 2. Cookie-তে না থাকলে Authorization header থেকে নেবে
    if (!token) {
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // Token পাওয়া না গেলে
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      config.jwt_secret as string
    ) as IUser;

    // User information request-এর মধ্যে রাখবে
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${req.user.role}`,
      });
    }

    next();
  };
};

export const isOwnerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.id;

  // Admin সব user-এর account modify করতে পারবে
  if (req.user?.role === "admin") {
    return next();
  }

  // নিজের account ছাড়া অন্য account modify করতে পারবে না
  if (req.user?._id?.toString() === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You can only modify your own account",
  });
};