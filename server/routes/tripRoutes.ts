import { Router } from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from "../controllers/tripController";
import { protect } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { createTripSchema, updateTripSchema } from "../validation/tripValidation";

const router = Router();

// Protect all trip planning endpoints
router.use(protect);

router.post("/", validate(createTripSchema), createTrip);
router.get("/", getTrips);
router.get("/:id", getTripById);
router.put("/:id", validate(updateTripSchema), updateTrip);
router.delete("/:id", deleteTrip);

export default router;
