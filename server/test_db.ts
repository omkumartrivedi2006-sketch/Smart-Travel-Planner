import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log("Database URI:", uri ? "Defined" : "Not defined");

  if (!uri) {
    console.error("No MONGODB_URI found in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Successfully connected!");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("No database connection active");
    }

    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

    const destCount = await db.collection("destinations").countDocuments();
    console.log("Total destinations in DB:", destCount);

    await mongoose.disconnect();
    console.log("Disconnected successfully.");
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  }
}

testConnection();
