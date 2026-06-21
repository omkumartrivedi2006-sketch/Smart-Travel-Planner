import { Router } from "express";
import { generateItinerary } from "../controllers/itineraryController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Protect itinerary generation route so that only registered users can query AI
router.post("/", protect, generateItinerary);

export default router;
