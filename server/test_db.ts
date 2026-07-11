import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, closeDB } from "./config/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log("Database URI from .env:", uri ? "Defined" : "Not defined (falling back to in-memory)");

  try {
    console.log("Initializing database connection...");
    await connectDB();
    console.log("Successfully connected!");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("No database connection active");
    }

    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

    // Try to count documents in destinations
    const destCount = await db.collection("destinations").countDocuments();
    console.log("Total destinations in DB:", destCount);

    await closeDB();
    console.log("Disconnected successfully.");
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  }
}

testConnection();

