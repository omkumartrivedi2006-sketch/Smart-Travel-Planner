import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/authController";
import { validate } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
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

// Profile Updates (authenticated)
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);

export default router;
