import { Router } from "express";
import { getPlacesByCity } from "../controllers/placesController";

const router = Router();

// Route for places/attractions by city name
router.get("/:city", getPlacesByCity);

export default router;
