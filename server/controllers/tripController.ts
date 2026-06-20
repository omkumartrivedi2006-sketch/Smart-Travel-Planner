import { Response, NextFunction } from "express";
import { Trip } from "../models/Trip";
import { Budget } from "../models/Budget";
import { Destination } from "../models/Destination";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { performBudgetCalculation } from "./budgetController";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Generate a structured daily itinerary based on destination activities and places
 */
function generateItinerary(params: {
  destination: any;
  durationDays: number;
  hotelPreference: "budget" | "mid-range" | "luxury";
}) {
  const { destination, durationDays, hotelPreference } = params;
  const popularPlaces = destination.popularPlaces || [];
  const activities = destination.activities || [];

  const itinerary = [];

  for (let day = 1; day <= durationDays; day++) {
    const dayActivities = [];

    // Round-robin selection of places and activities
    const place1 = popularPlaces.length > 0
      ? popularPlaces[(day - 1) % popularPlaces.length]
      : "Local Landmark";
      
    const place2 = popularPlaces.length > 0
      ? popularPlaces[day % popularPlaces.length]
      : "Scenic Overlook";

    const activityName = activities.length > 0
      ? activities[(day - 1) % activities.length]
      : "Sightseeing Walk";

    // Activity cost weights
    let activityCost = 15;
    if (hotelPreference === "budget") activityCost = 5;
    if (hotelPreference === "luxury") activityCost = 45;

    // 1. Morning Activity
    dayActivities.push({
      time: "09:00 AM",
      activity: `Visit ${place1}`,
      description: `Explore the prominent sights and historical architecture of ${place1}. Perfect for morning photography.`,
      cost: 0, // Sightseeing at landmarks is usually free
    });

    // 2. Afternoon Activity
    dayActivities.push({
      time: "02:00 PM",
      activity: `${activityName} Session`,
      description: `Participate in a guided ${activityName.toLowerCase()} experience at selected local hubs.`,
      cost: Math.round(activityCost * (destination.averageCost / 50) * 100) / 100,
    });

    // 3. Evening Leisure
    dayActivities.push({
      time: "06:00 PM",
      activity: `Leisure walk near ${place2}`,
      description: `Relax, dine, and enjoy the sunset views around the ${place2} waterfront or bazaar.`,
      cost: 0,
    });

    itinerary.push({
      day,
      activities: dayActivities,
    });
  }

  return itinerary;
}

/**
 * Create a new Trip (with linked budget & itinerary)
 * POST /api/trips
 */
export async function createTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const {
      destinationId,
      startDate,
      endDate,
      travelers,
      hotelPreference = "mid-range",
      transportPreference = "car",
      travelType = "solo",
      originLatitude,
      originLongitude,
    } = req.body;

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new NotFoundError("Destination not found");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1);

    // 1. Perform Budget Calculation
    const budgetBreakdown = performBudgetCalculation({
      destination,
      startDate: start,
      endDate: end,
      travelers,
      hotelPreference,
      transportPreference,
      travelType,
      originLatitude,
      originLongitude,
    });

    // 2. Save Budget Document
    const newBudget = await Budget.create({
      user: userId,
      ...budgetBreakdown,
    });

    // 3. Generate Itinerary
    const itinerary = generateItinerary({
      destination,
      durationDays,
      hotelPreference,
    });

    // 4. Create Trip Document
    const newTrip = await Trip.create({
      user: userId,
      destination: destinationId,
      startDate: start,
      endDate: end,
      travelers,
      hotelPreference,
      transportPreference,
      travelType,
      budget: newBudget._id,
      itinerary,
    });

    // 5. Link Trip to Budget
    newBudget.trip = newTrip._id as any;
    await newBudget.save();

    logger.info(`Trip planned successfully to ${destination.name} by User: ${userId}`);

    // Populate references for client response
    const populatedTrip = await Trip.findById(newTrip._id)
      .populate("destination")
      .populate("budget");

    res.status(201).json({
      status: "success",
      data: {
        trip: populatedTrip,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all trips for the authenticated user
 * GET /api/trips
 */
export async function getTrips(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;

    const trips = await Trip.find({ user: userId })
      .populate("destination")
      .populate("budget")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: trips.length,
      data: {
        trips,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get details of a specific trip
 * GET /api/trips/:id
 */
export async function getTripById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate("destination")
      .populate("budget");

    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    // Verify ownership
    if (trip.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to view this trip");
    }

    res.status(200).json({
      status: "success",
      data: {
        trip,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update trip details (and automatically update linked budget/itinerary if needed)
 * PUT /api/trips/:id
 */
export async function updateTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    // Verify ownership
    if (trip.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to modify this trip");
    }

    const {
      destinationId,
      startDate,
      endDate,
      travelers,
      hotelPreference,
      transportPreference,
      travelType,
      originLatitude,
      originLongitude,
    } = req.body;

    // Check if parameters affecting budget or itinerary are updated
    const isDestChanged = destinationId && destinationId !== trip.destination.toString();
    const isStartChanged = startDate && new Date(startDate).getTime() !== new Date(trip.startDate).getTime();
    const isEndChanged = endDate && new Date(endDate).getTime() !== new Date(trip.endDate).getTime();
    const isTravelersChanged = travelers && travelers !== trip.travelers;
    const isHotelPrefChanged = hotelPreference && hotelPreference !== trip.hotelPreference;
    const isTransportPrefChanged = transportPreference && transportPreference !== trip.transportPreference;
    const isTravelTypeChanged = travelType && travelType !== trip.travelType;

    const needsRecalculation =
      isDestChanged ||
      isStartChanged ||
      isEndChanged ||
      isTravelersChanged ||
      isHotelPrefChanged ||
      isTransportPrefChanged ||
      isTravelTypeChanged;

    // Update basic trip fields
    if (destinationId) trip.destination = destinationId;
    if (startDate) trip.startDate = new Date(startDate);
    if (endDate) trip.endDate = new Date(endDate);
    if (travelers) trip.travelers = travelers;
    if (hotelPreference) trip.hotelPreference = hotelPreference;
    if (transportPreference) trip.transportPreference = transportPreference;
    if (travelType) trip.travelType = travelType;

    if (needsRecalculation) {
      const destination = await Destination.findById(trip.destination);
      if (!destination) {
        throw new NotFoundError("Destination not found");
      }

      // 1. Recalculate Budget
      const budgetBreakdown = performBudgetCalculation({
        destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
        hotelPreference: trip.hotelPreference,
        transportPreference: trip.transportPreference,
        travelType: trip.travelType,
        originLatitude,
        originLongitude,
      });

      // 2. Update linked Budget document
      if (trip.budget) {
        await Budget.findByIdAndUpdate(trip.budget, budgetBreakdown);
      } else {
        const newBudget = await Budget.create({
          trip: trip._id,
          user: userId,
          ...budgetBreakdown,
        });
        trip.budget = newBudget._id as any;
      }

      // 3. Regenerate Itinerary
      const durationMs = trip.endDate.getTime() - trip.startDate.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1);
      trip.itinerary = generateItinerary({
        destination,
        durationDays,
        hotelPreference: trip.hotelPreference,
      });
    }

    await trip.save();
    logger.info(`Trip updated successfully: ${trip._id}`);

    const populatedTrip = await Trip.findById(trip._id)
      .populate("destination")
      .populate("budget");

    res.status(200).json({
      status: "success",
      data: {
        trip: populatedTrip,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a trip and its linked budget
 * DELETE /api/trips/:id
 */
export async function deleteTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    // Verify ownership
    if (trip.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to delete this trip");
    }

    // Delete linked Budget first
    if (trip.budget) {
      await Budget.findByIdAndDelete(trip.budget);
    }

    await Trip.findByIdAndDelete(id);
    logger.info(`Trip and linked budget deleted successfully: ${id}`);

    res.status(200).json({
      status: "success",
      message: "Trip and linked budget successfully deleted",
    });
  } catch (error) {
    next(error);
  }
}
