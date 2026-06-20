import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { validate } from "../middleware/validationMiddleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/authValidation";

const router = Router();

// Registration
router.post("/register", validate(registerSchema), register);

// Login
router.post("/login", validate(loginSchema), login);

// Logout
router.post("/logout", logout);

// Token Refresh
router.post("/refresh", refresh);

// Forgot Password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset Password
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
