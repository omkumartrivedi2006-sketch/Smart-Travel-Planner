import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors";

export interface TokenPayload {
  userId: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is missing");
  }

  return jwt.sign(payload, secret, { expiresIn });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is missing");
  }

  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is missing");
  }

  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is missing");
  }

  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
}
