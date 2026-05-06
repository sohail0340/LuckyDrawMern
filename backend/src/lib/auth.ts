import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "./db-mongoose/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "captain-lucky-draw-secret-2026";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

function unauthorized(res: Response) {
  res.status(401).json({ success: false, message: "Please login or create an account to continue" });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    unauthorized(res);
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    unauthorized(res);
    return;
  }
  req.userId = payload.sub;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    unauthorized(res);
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    unauthorized(res);
    return;
  }
  try {
    const user = await User.findById(payload.sub);
    if (!user || !user.isAdmin) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    req.userId = payload.sub;
    req.isAdmin = true;
    next();
  } catch {
    res.status(500).json({ success: false, message: "Auth check failed" });
  }
}

export function generateReferralCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
