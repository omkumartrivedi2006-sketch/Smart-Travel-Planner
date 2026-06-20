import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  let mongodbUri = process.env.MONGODB_URI;
  const forceInMemory = process.env.USE_IN_MEMORY_DB === "true";

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

  if (mongodbUri && !forceInMemory) {
    try {
      logger.info(`Attempting to connect to configured MongoDB URI...`);
      // Use 5s timeout to fail fast if the local/remote MongoDB is offline
      await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 5000 });
      return;
    } catch (err: any) {
      logger.warn(`Failed to connect to MONGODB_URI. Error: ${err.message}`);
      logger.warn("Falling back to in-memory MongoDB server so the application can run.");
    }
  }

  try {
    logger.info("Initializing in-memory MongoDB server for zero-config development...");
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    logger.info(`In-memory MongoDB started at: ${uri}`);
    await mongoose.connect(uri);
  } catch (err) {
    logger.error("Failed to start/connect to in-memory MongoDB server:", err);
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

