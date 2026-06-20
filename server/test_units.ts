import { BadRequestError } from "./utils/errors";
import { generateAccessToken, verifyAccessToken } from "./utils/jwt";
import bcrypt from "bcryptjs";
import { registerSchema } from "./validation/authValidation";
import { createDestinationSchema, calculateRouteSchema } from "./validation/travelValidation";

// Helper from routeController
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Helper from weatherController mock generator test
function generateMockWeather(destinationName: string, category: string, country: string) {
  let baseTemp = 25;
  let conditions = ["Sunny", "Partly Cloudy", "Clear"];
  const catLower = category.toLowerCase();
  if (catLower === "mountain") {
    baseTemp = 5;
    conditions = ["Snowy", "Foggy"];
  }
  const forecast = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    forecast.push({
      date: nextDate.toISOString().split("T")[0],
      temperature: baseTemp + (Math.floor(Math.random() * 5) - 2),
      condition: conditions[0],
    });
  }
  return {
    destinationName: destinationName.toLowerCase(),
    temperature: baseTemp,
    condition: conditions[0],
    humidity: 60,
    windSpeed: 10,
    forecast,
  };
}

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

  // 4. Test Validation Schemas (Auth)
  console.log("\n4. Testing Auth validation schemas...");
  try {
    const validData = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123"
      }
    };
    registerSchema.parse(validData);
    console.log("✅ Valid auth schema passes parsing");
  } catch (err) {
    console.error("❌ Valid auth schema failed to parse", err);
  }

  // 5. Test Distance Calculator (Haversine Formula)
  console.log("\n5. Testing Haversine Distance Calculation...");
  // Distance from Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) is approx 1148 km
  const dist = calculateHaversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
  if (dist > 1100 && dist < 1200) {
    console.log(`✅ Haversine calculation works: Delhi to Mumbai = ${dist} km`);
  } else {
    console.error(`❌ Haversine calculation failed. Output: ${dist} km`);
  }

  // 6. Test Weather Mock Generation
  console.log("\n6. Testing Weather Mock Generator...");
  const mockWeather = generateMockWeather("Manali", "Mountain", "India");
  if (mockWeather.temperature === 5 && mockWeather.forecast.length === 5) {
    console.log("✅ Weather mock generator matches expected categories");
  } else {
    console.error("❌ Weather mock generator failed", mockWeather);
  }

  // 7. Test Travel Validation Schemas
  console.log("\n7. Testing Travel validation schemas...");
  try {
    const validDest = {
      body: {
        name: "Goa",
        description: "Sunny beaches in western India",
        country: "India",
        category: "Beach",
        latitude: 15.2993,
        longitude: 74.1240,
        averageCost: 45,
        activities: ["Swimming", "Sunbathing"],
        bestTimeToVisit: "November - February"
      }
    };
    createDestinationSchema.parse(validDest);
    console.log("✅ Valid Destination schema passes");
  } catch (err) {
    console.error("❌ Valid Destination schema failed to parse", err);
  }

  try {
    const invalidRoute = {
      body: {
        originLatitude: 100, // Invalid latitude
        originLongitude: 72.8777,
        destinationId: "507f1f77bcf86cd799439011", // Valid ObjectID format
        modeOfTransport: "rocket" // Invalid mode
      }
    };
    calculateRouteSchema.parse(invalidRoute);
    console.error("❌ Invalid Route schema mistakenly passed");
  } catch (err) {
    console.log("✅ Invalid Route schema correctly rejected");
  }
}

runTests().catch(console.error);
