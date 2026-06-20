import { BadRequestError } from "./utils/errors";
import { generateAccessToken, verifyAccessToken } from "./utils/jwt";
import bcrypt from "bcryptjs";
import { registerSchema } from "./validation/authValidation";
import { createDestinationSchema, calculateRouteSchema } from "./validation/travelValidation";
import { performBudgetCalculation } from "./controllers/budgetController";
import { createTripSchema, calculateBudgetSchema } from "./validation/tripValidation";
import { getAIChatResponse } from "./services/aiService";
import { Chat } from "./models/Chat";
import { Destination } from "./models/Destination";
import { Weather } from "./models/Weather";
import mongoose from "mongoose";

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

  try {
    const invalidDataWithAdminRole = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
        role: "admin"
      }
    };
    registerSchema.parse(invalidDataWithAdminRole);
    console.error("❌ Invalid auth schema (role: admin) mistakenly passed parsing");
  } catch (err) {
    console.log("✅ Invalid auth schema (role: admin) correctly failed to parse");
  }

  try {
    const invalidDataWithUserRole = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
        role: "user"
      }
    };
    registerSchema.parse(invalidDataWithUserRole);
    console.error("❌ Invalid auth schema (role: user) mistakenly passed parsing");
  } catch (err) {
    console.log("✅ Invalid auth schema (role: user) correctly failed to parse");
  }

  // 5. Test Distance Calculator (Haversine Formula)
  console.log("\n5. Testing Haversine Distance Calculation...");
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

  // 8. Test Budget Calculator Logic
  console.log("\n8. Testing Budget Calculator Logic...");
  const mockDestination = {
    name: "Paris",
    country: "France",
    category: "City",
    averageCost: 100, // Cost factor = 2.0
    latitude: 48.8566,
    longitude: 2.3522,
  };

  const budget1 = performBudgetCalculation({
    destination: mockDestination,
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-05"), // 5 days, 4 nights
    travelers: 1,
    hotelPreference: "mid-range",
    transportPreference: "car",
    travelType: "solo",
  });

  const budget2 = performBudgetCalculation({
    destination: mockDestination,
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-05"), // 5 days, 4 nights
    travelers: 1,
    hotelPreference: "luxury",
    transportPreference: "car",
    travelType: "solo",
  });

  const budget3 = performBudgetCalculation({
    destination: mockDestination,
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-05"), // 5 days, 4 nights
    travelers: 3, // more travelers
    hotelPreference: "mid-range",
    transportPreference: "car",
    travelType: "friends",
  });

  if (budget2.totalEstimate > budget1.totalEstimate) {
    console.log(`✅ Luxury preference estimated correctly higher: ${budget2.totalEstimate} USD vs ${budget1.totalEstimate} USD`);
  } else {
    console.error("❌ Luxury costing failed", budget1, budget2);
  }

  if (budget3.totalEstimate > budget1.totalEstimate) {
    console.log(`✅ More travelers estimated correctly higher: ${budget3.totalEstimate} USD vs ${budget1.totalEstimate} USD`);
  } else {
    console.error("❌ Traveler weight costing failed", budget1, budget3);
  }

  // 9. Test Trip Validation Schemas
  console.log("\n9. Testing Trip & Budget validation schemas...");
  try {
    const validTripData = {
      body: {
        destinationId: "507f1f77bcf86cd799439011",
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        travelers: 2,
        hotelPreference: "luxury",
        transportPreference: "flight",
        travelType: "couple"
      }
    };
    createTripSchema.parse(validTripData);
    console.log("✅ Valid Trip schema passes parsing");
  } catch (err) {
    console.error("❌ Valid Trip schema failed to parse", err);
  }

  try {
    const invalidTripData = {
      body: {
        destinationId: "507f1f77bcf86cd799439011",
        startDate: "2026-07-05",
        endDate: "2026-07-01", // End date before start date
        travelers: 2
      }
    };
    createTripSchema.parse(invalidTripData);
    console.error("❌ Invalid Trip schema (reversed dates) mistakenly passed");
  } catch (err) {
    console.log("✅ Invalid Trip schema (reversed dates) correctly rejected");
  }

  // 10. Test AI Service Fallback Engine
  console.log("\n10. Testing AI Service Fallback Engine...");
  const originalDestFind = Destination.find;
  Destination.find = (() => Promise.resolve([
    { name: "Goa", country: "India", category: "Beach", averageCost: 40, popularPlaces: ["Calangute"], activities: ["Swimming"] },
    { name: "Manali", country: "India", category: "Mountain", averageCost: 50, popularPlaces: ["Solang"], activities: ["Skiing"] }
  ] as any)) as any;

  const originalWeatherFindOne = Weather.findOne;
  Weather.findOne = (() => Promise.resolve({
    destinationName: "goa",
    temperature: 28,
    condition: "Sunny",
    humidity: 60,
    windSpeed: 10,
    forecast: [
      { date: "2026-06-21", temperature: 28, condition: "Sunny" }
    ]
  } as any)) as any;

  try {
    const responseText = await getAIChatResponse({
      message: "What is the weather in Goa?",
      history: []
    });
    if (responseText.includes("weather") || responseText.includes("Goa")) {
      console.log("✅ AI Service fallback engine resolved weather query correctly");
    } else {
      console.error("❌ AI Service weather fallback failed. Output:", responseText);
    }

    const responseText2 = await getAIChatResponse({
      message: "What should I pack for Manali?",
      history: []
    });
    if (responseText2.includes("packing suggestions") || responseText2.includes("pack") || responseText2.includes("Manali")) {
      console.log("✅ AI Service fallback engine resolved packing query correctly");
    } else {
      console.error("❌ AI Service packing fallback failed. Output:", responseText2);
    }
  } catch (err) {
    console.error("❌ AI Service test failed with error:", err);
  } finally {
    Destination.find = originalDestFind;
    Weather.findOne = originalWeatherFindOne;
  }

  // 11. Test Chat Mongoose Schema validation
  console.log("\n11. Testing Chat Mongoose Schema validation...");
  try {
    const dummyUser = new mongoose.Types.ObjectId();
    const chatDoc = new Chat({
      user: dummyUser,
      session: "session_abc",
      messages: [
        { role: "user", content: "hello", timestamp: new Date() },
        { role: "model", content: "hi!", timestamp: new Date() }
      ]
    });
    
    const validateErr = chatDoc.validateSync();
    if (!validateErr) {
      console.log("✅ Chat Schema validation succeeds with correct parameters");
    } else {
      console.error("❌ Chat Schema validation failed on valid data", validateErr);
    }
  } catch (err) {
    console.error("❌ Chat Mongoose schema test failed", err);
  }
}

runTests().catch(console.error);
