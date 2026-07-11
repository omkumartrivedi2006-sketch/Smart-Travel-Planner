import { Router } from "express";
import {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
  updateDestinationImages,
} from "../controllers/destinationController";
import { protect, restrictTo } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import {
  createDestinationSchema,
  updateDestinationSchema,
} from "../validation/travelValidation";

const router = Router();

// Public: list and detail view and image updating
router.get("/", getDestinations);
router.get("/:id", getDestinationById);
router.put("/:id/update-images", updateDestinationImages);

// Protected (Admin only): create, update, and delete actions
router.post("/", protect, restrictTo("admin"), validate(createDestinationSchema), createDestination);
router.put("/:id", protect, restrictTo("admin"), validate(updateDestinationSchema), updateDestination);
router.delete("/:id", protect, restrictTo("admin"), deleteDestination);

export default router;
