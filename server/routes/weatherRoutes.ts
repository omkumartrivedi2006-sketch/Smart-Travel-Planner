import { Router } from "express";
import { getDestinationWeather } from "../controllers/weatherController";

const router = Router();

// Public weather lookup by destination name
router.get("/:destination", getDestinationWeather);

export default router;
