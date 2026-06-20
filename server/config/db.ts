import mongoose from "mongoose";
import { logger } from "../utils/logger";

export async function connectDB(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    logger.error("MONGODB_URI environment variable is missing!");
    process.exit(1);
  }

  try {
    mongoose.connection.on("connecting", () => {
      logger.info("Connecting to MongoDB Atlas...");
    });

    mongoose.connection.on("connected", () => {
      logger.info("Successfully connected to MongoDB Atlas.");
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
