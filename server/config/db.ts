import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;
let listenersRegistered = false;

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
  const isProd = process.env.NODE_ENV === "production";
  let mongodbUri = process.env.MONGODB_URI;

  registerConnectionListeners();

  if (isProd) {
    // Production validation
    if (!mongodbUri || mongodbUri.trim() === "") {
      logger.error("FATAL: Database initialization failed. MONGODB_URI environment variable is missing or empty in production mode.");
      logger.error("Production environments require a valid MONGODB_URI to run securely and prevent data loss.");
      process.exit(1);
    }

    if (mongodbUri.includes("localhost") || mongodbUri.includes("127.0.0.1")) {
      logger.warn("SECURITY WARNING: MONGODB_URI points to a local address (localhost/127.0.0.1) in production environment. Ensure this is intentional.");
    }

    logger.info("Database Mode: PRODUCTION (Using configured MONGODB_URI)");
  } else {
    // Development / Test validation
    if (!mongodbUri || mongodbUri.trim() === "") {
      try {
        logger.info("Database Mode: DEVELOPMENT (No MONGODB_URI provided. Initializing MongoMemoryServer...)");
        mongod = await MongoMemoryServer.create();
        mongodbUri = mongod.getUri();
        logger.info(`MongoMemoryServer started at: ${mongodbUri}`);
      } catch (err) {
        logger.error("Failed to start MongoMemoryServer:", err);
        logger.error("No MONGODB_URI provided and in-memory server failed to initialize.");
        process.exit(1);
      }
    } else {
      logger.info("Database Mode: DEVELOPMENT (Using configured MONGODB_URI)");
    }
  }

  try {
    // Enforce connection timeout options to fail fast if DB is offline
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error("FATAL: Failed to establish initial connection to MongoDB:", error);
    process.exit(1);
  }
}

export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    logger.info("MongoMemoryServer stopped.");
  }
}

