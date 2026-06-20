import { BadRequestError } from "./utils/errors";
import { generateAccessToken, verifyAccessToken } from "./utils/jwt";
import bcrypt from "bcryptjs";
import { registerSchema } from "./validation/authValidation";

async function runTests() {
  console.log("=== RUNNING BACKEND FOUNDATION UNIT TESTS ===");

  // 1. Test Errors
  console.log("\n1. Testing Custom Errors...");
  const badReq = new BadRequestError("Missing required parameter");
  if (badReq.statusCode === 400 && badReq.isOperational && badReq.message === "Missing required parameter") {
    console.log("✅ BadRequestError works");
  } else {
    console.error("❌ BadRequestError failed");
  }

  // 2. Test JWT
  console.log("\n2. Testing JWT Signing & Verification...");
  process.env.JWT_ACCESS_SECRET = "test_access_secret_key_1234567890";
  const payload = { userId: "user123", role: "admin" };
  const token = generateAccessToken(payload);
  const verified = verifyAccessToken(token);
  if (verified.userId === "user123" && verified.role === "admin") {
    console.log("✅ JWT Access Token generation & verification works");
  } else {
    console.error("❌ JWT failed", verified);
  }

  // 3. Test Bcrypt
  console.log("\n3. Testing Password Hashing...");
  const rawPass = "superSecurePass123";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPass, salt);
  const match = await bcrypt.compare(rawPass, hash);
  const noMatch = await bcrypt.compare("wrongPass", hash);
  if (match && !noMatch) {
    console.log("✅ Password hashing & validation works");
  } else {
    console.error("❌ Bcrypt failed");
  }

  // 4. Test Validation Schemas
  console.log("\n4. Testing Zod validation schemas...");
  try {
    const validData = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123"
      }
    };
    registerSchema.parse(validData);
    console.log("✅ Valid schema passes parsing");
  } catch (err) {
    console.error("❌ Valid schema failed to parse", err);
  }

  try {
    const invalidData = {
      body: {
        name: "J",
        email: "invalid-email",
        password: "123"
      }
    };
    registerSchema.parse(invalidData);
    console.error("❌ Invalid schema mistakenly passed parsing");
  } catch (err) {
    console.log("✅ Invalid schema correctly rejected parsing");
  }
}

runTests().catch(console.error);
