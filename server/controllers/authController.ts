import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendEmail } from "../utils/email";
import { logger } from "../utils/logger";

// Helper to filter user response fields
const getCleanUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * Register User
 * POST /api/auth/register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("Email is already in use");
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: "user",
    });

    const payload = { userId: newUser._id.toString(), role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      status: "success",
      data: {
        user: getCleanUser(newUser),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login User
 * POST /api/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Retrieve user and explicitly include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    logger.info(`User logged in successfully: ${email}`);

    res.status(200).json({
      status: "success",
      data: {
        user: getCleanUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout User
 * POST /api/auth/logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required to logout");
    }

    // Try to verify token to find who it belonged to
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      // If token is expired or invalid, we still respond success but can't find db record
      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (user) {
      // Remove this token from user's refreshTokens array
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }

    logger.info(`User logged out successfully: ${user?.email || "Unknown User"}`);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh Access Token (Rotation)
 * POST /api/auth/refresh
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    // Detect refresh token reuse (Token reuse attack prevention)
    if (!user.refreshTokens.includes(refreshToken)) {
      // Revoke all refresh tokens for this user as a precaution
      user.refreshTokens = [];
      await user.save();
      logger.warn(`Token reuse detected for user: ${user.email}. All sessions revoked.`);
      throw new ForbiddenError("Token reuse detected. All sessions revoked.");
    }

    // Filter out used token
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);

    // Generate new tokens
    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Save new refresh token
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Security practice: do not confirm if email exists or not
      res.status(200).json({
        status: "success",
        message: "If the email is registered, a password reset link has been sent.",
      });
      return;
    }

    // Generate reset token and set expiry
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Prepare mail link/instructions
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password`;
    const message = `Forgot your password? Please submit a POST request to ${resetUrl} with your reset token and new password.\n\nYour reset token is (valid for 10 minutes):\n\n${resetToken}\n\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request (valid for 10 min)",
        text: message,
      });

      logger.info(`Password reset token generated and sent to: ${email}`);

      res.status(200).json({
        status: "success",
        message: "If the email is registered, a password reset link has been sent.",
      });
    } catch (err) {
      // Clear token if email sending failed
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body;

    // Hash the token sent in the body to compare it with the stored hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError("Token is invalid or has expired");
    }

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Revoke all existing sessions/refresh tokens on password reset
    user.refreshTokens = [];
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Password reset successful.",
    });
  } catch (error) {
    next(error);
  }
}
