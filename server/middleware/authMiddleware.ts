import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/User";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Protect middleware
 * Verifies JWT token in Authorization header and attaches the user to the request
 */
export async function protect(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.toLowerCase().startsWith("bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new UnauthorizedError("You are not logged in. Please log in to get access.");
    }

    // Verify token (will throw UnauthorizedError if expired or invalid)
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      throw new UnauthorizedError("The user belonging to this token no longer exists.");
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role restriction middleware (RBAC)
 * Restricts access to specific roles (e.g. 'admin')
 */
export function restrictTo(...roles: ("user" | "admin")[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
