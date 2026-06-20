import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import destinationRoutes from "./routes/destinationRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import routeRoutes from "./routes/routeRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Connect to Database
  await connectDB();

  const app = express();
  const server = createServer(app);

  // 2. Security & Utility Middlewares
  app.use(helmet({ contentSecurityPolicy: false })); // Let CSP be false so it doesn't conflict with Vite client assets in development
  app.use(cors({ origin: true, credentials: true }));
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

  // 4. API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/destinations", destinationRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/routes", routeRoutes);

  // 5. API 404 Handler (ensures unknown /api requests don't fall back to client HTML)
  app.all("/api/*", notFoundHandler);

  // 6. Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // 7. Handle client-side routing fallback - serve index.html for all other routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

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

