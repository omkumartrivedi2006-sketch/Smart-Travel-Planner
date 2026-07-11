import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { MongoMemoryServer } from "mongodb-memory-server";

let listenersRegistered = false;
let mongod: MongoMemoryServer | null = null;

function registerConnectionListeners() {
  if (listenersRegistered) return;

  mongoose.connection.on("connecting", () => {
    logger.info("MongoDB Connection: Connecting to database...");
  });

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB Connection: Successfully connected.");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB Connection: Error encountered:", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB Connection: Disconnected.");
  });

  listenersRegistered = true;
}

export async function connectDB(): Promise<void> {
  let mongodbUri = process.env.MONGODB_URI;

  registerConnectionListeners();

  if (!mongodbUri || mongodbUri.trim() === "") {
    logger.warn("MONGODB_URI environment variable is missing or empty. Starting zero-config in-memory MongoDB...");
    try {
      mongod = await MongoMemoryServer.create();
      mongodbUri = mongod.getUri();
      logger.info(`In-memory MongoDB successfully started at: ${mongodbUri}`);
    } catch (err: any) {
      logger.error("FATAL: Failed to spin up in-memory MongoDB server:", err);
      process.exit(1);
    }
  }

  if (!mongodbUri.startsWith("mongodb://") && !mongodbUri.startsWith("mongodb+srv://")) {
    logger.error(`FATAL: Database initialization failed. MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'. Got: ${mongodbUri}`);
    process.exit(1);
  }

  if (mongodbUri.includes("localhost") || mongodbUri.includes("127.0.0.1") || mongod) {
    logger.warn("SECURITY WARNING: MONGODB_URI points to a local or in-memory address. Ensure this is intentional.");
  }

  const isAtlas = mongodbUri.startsWith("mongodb+srv://");
  logger.info(`Database Mode: ${isAtlas ? "MongoDB Atlas Cloud" : (mongod ? "In-Memory MongoDB" : "Local MongoDB")} instance`);

  const maxRetries = 5;
  const retryDelayMs = 5000;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    try {
      // Enforce connection timeout options to fail fast if DB is offline
      await mongoose.connect(mongodbUri, {
        serverSelectionTimeoutMS: 5000,
      });
      return; // Connection successful, exit function
    } catch (error: any) {
      logger.error(`Database Connection: Failed on attempt ${attempts}/${maxRetries}. Error: ${error.message}`);
      if (attempts >= maxRetries) {
        logger.error("FATAL: Failed to establish initial connection to MongoDB after maximum retry attempts.");
        process.exit(1);
      }
      logger.info(`Database Connection: Retrying in ${retryDelayMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    logger.info("In-memory MongoDB Server stopped.");
  }
}

