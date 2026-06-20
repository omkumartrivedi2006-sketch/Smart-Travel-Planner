import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string({
      message: "Name is required",
    }).min(2, "Name must be at least 2 characters").trim(),
    email: z.string({
      message: "Email is required",
    }).email("Invalid email format").trim(),
    password: z.string({
      message: "Password is required",
    }).min(6, "Password must be at least 6 characters"),
    role: z.undefined().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      message: "Email is required",
    }).email("Invalid email format").trim(),
    password: z.string({
      message: "Password is required",
    }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({
      message: "Email is required",
    }).email("Invalid email format").trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({
      message: "Reset token is required",
    }),
    password: z.string({
      message: "New password is required",
    }).min(6, "Password must be at least 6 characters"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
    email: z.string().email("Invalid email format").trim().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  }),
});
