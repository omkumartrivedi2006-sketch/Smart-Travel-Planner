import { Router } from "express";
import { calculateRoute } from "../controllers/routeController";
import { validate } from "../middleware/validationMiddleware";
import { calculateRouteSchema } from "../validation/travelValidation";

const router = Router();

// Route distance, travel time, and cost calculation
router.post("/calculate", validate(calculateRouteSchema), calculateRoute);

export default router;
