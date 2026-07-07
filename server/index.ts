import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import destinationRoutes from "./routes/destinationRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import routeRoutes from "./routes/routeRoutes";
import tripRoutes from "./routes/tripRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import chatRoutes from "./routes/chatRoutes";
import placesRoutes from "./routes/placesRoutes";
import itineraryRoutes from "./routes/itineraryRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { Destination } from "./models/Destination";
import { seed } from "./seed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Connect to Database
  await connectDB();

  // 1b. Auto-seed if database is empty (e.g. for in-memory MongoDB)
  try {
    const destCount = await Destination.countDocuments();
    if (destCount === 0) {
      logger.info("Database is empty. Running auto-seeding script...");
      await seed(true);
      logger.info("Auto-seeding completed.");
    }
  } catch (err) {
    logger.error("Failed to run database auto-seeding:", err);
  }

  const app = express();
  const server = createServer(app);

  // 2. Security & Utility Middlewares
  app.use(helmet({ contentSecurityPolicy: false })); // Let CSP be false so it doesn't conflict with Vite client assets in development
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://omkumartrivedi2006-sketch.github.io",
      ];

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // In development mode, allow any origin to make local network and tunnel testing easy
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS block: Request from disallowed origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Rate Limiting for API routes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      status: "fail",
      message: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Health check endpoint (used by Render.com to verify service is alive)
  app.get("/api/auth/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 4. API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/destinations", destinationRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/routes", routeRoutes);
  app.use("/api/trips", tripRoutes);
  app.use("/api/budget", budgetRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/places", placesRoutes);
  app.use("/api/itinerary", itineraryRoutes);

  // Swagger Documentation Route
  try {
    // In production on Render, swagger.json sits next to index.js in dist/
    // In development, it sits in server/
    const swaggerPath = process.env.NODE_ENV === "production"
      ? new URL("./swagger.json", import.meta.url)
      : new URL("./swagger.json", import.meta.url);
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (err) {
    logger.warn("swagger.json not found — API docs disabled.");
  }

  // 5. API 404 Handler (ensures unknown /api requests don't fall back to client HTML)
  app.all("/api/*", notFoundHandler);

  // 6. Serve static files from dist/public if it exists (local full-stack mode)
  //    On Render (API-only), dist/public won't exist — frontend is on GitHub Pages.
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    // 7. Handle client-side routing fallback
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    // Running as API-only (Render deployment) — frontend is on GitHub Pages
    app.get("/", (_req, res) => {
      res.json({
        status: "ok",
        message: "Smart Travel Planner API",
        docs: "/api-docs",
        frontend: "https://omkumartrivedi2006-sketch.github.io/Smart-Travel-Planner/",
      });
    });
  }

  // 8. Global Centralized Error Handling Middleware
  app.use(errorHandler);

  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 5000);

  server.listen(port, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${port}/`);
  });
}

startServer().catch((err) => {
  logger.error("Failed to start the Express server:", err);
  process.exit(1);
});

