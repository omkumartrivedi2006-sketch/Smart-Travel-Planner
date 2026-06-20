import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  let mongodbUri = process.env.MONGODB_URI;

  // If MONGODB_URI is not set, or points to localhost/127.0.0.1, spin up an in-memory MongoDB server
  if (!mongodbUri || mongodbUri.includes("localhost") || mongodbUri.includes("127.0.0.1")) {
    try {
      logger.info("Initializing in-memory MongoDB server for zero-config development...");
      mongod = await MongoMemoryServer.create();
      mongodbUri = mongod.getUri();
      logger.info(`In-memory MongoDB started at: ${mongodbUri}`);
    } catch (err) {
      logger.error("Failed to start in-memory MongoDB server:", err);
      if (!mongodbUri) {
        logger.error("No MONGODB_URI provided and memory server failed to start.");
        process.exit(1);
      }
    }
  }

  try {
    mongoose.connection.on("connecting", () => {
      logger.info("Connecting to MongoDB...");
    });

    mongoose.connection.on("connected", () => {
      logger.info("Successfully connected to MongoDB.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection disconnected.");
    });

    await mongoose.connect(mongodbUri);
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    logger.info("In-memory MongoDB server stopped.");
  }
}

