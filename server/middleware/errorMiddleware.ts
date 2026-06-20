import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Handle requests to routes that don't exist (404)
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
}

/**
 * Global centralized error-handling middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  error.statusCode = err.statusCode || 500;
  error.isOperational = err.isOperational || false;

  // Log error with details
  logger.error(err.message || "An unhandled error occurred", err);

  // Mongoose duplicate key error (MongoDB error code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    const message = `Duplicate value: '${value}' for field '${field}'. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(". ");
    error = new AppError(message, 400);
  }

  // CastError (invalid MongoDB ObjectIDs)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid authentication token. Please log in again.", 401);
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    error = new AppError("Your session token has expired. Please log in again.", 401);
  }

  const statusCode = error.statusCode;
  const status = error.statusCode >= 500 ? "error" : "fail";

  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      status,
      message: error.message,
      stack: error.stack,
      error: err,
    });
  } else {
    // Production mode
    if (error.isOperational) {
      res.status(statusCode).json({
        status,
        message: error.message,
      });
    } else {
      // Non-operational (programming or system) error: don't leak details
      res.status(500).json({
        status: "error",
        message: "Something went wrong on the server.",
      });
    }
  }
}
