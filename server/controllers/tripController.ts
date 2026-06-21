import { Response, NextFunction } from "express";
import { Trip } from "../models/Trip";
import { Budget } from "../models/Budget";
import { Destination } from "../models/Destination";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { performBudgetCalculation } from "./budgetController";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

/**
 * Generate a structured daily itinerary based on destination activities and places using Groq API
 */
async function generateItinerary(params: {
  destination: any;
  durationDays: number;
  hotelPreference: "budget" | "mid-range" | "luxury";
}): Promise<any[]> {
  const { destination, durationDays, hotelPreference } = params;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey.trim() === "YOUR_GROQ_KEY" || apiKey.trim() === "YourGroqAPIKeyHere") {
    throw new BadRequestError("Groq API key is not configured in environment variables. Cannot generate AI itinerary.");
  }

  const popularPlaces = destination.popularPlaces || [];
  const activities = destination.activities || [];

  try {
    logger.info(`Fetching AI itinerary from Groq for destination: ${destination.name}`);
    const systemPrompt = `You are an expert AI Travel Planner. Generate a highly realistic and structured day-by-day travel itinerary.
You MUST output your response as a valid JSON object matching the JSON schema below. Do not output any conversational text or markdown blocks, return ONLY the raw JSON object.

JSON SCHEMA:
{
  "itinerary": [
    {
      "day": Number (Day index starting at 1),
      "activities": [
        {
          "time": "String (e.g. '09:00 AM')",
          "activity": "String (Short activity name)",
          "description": "String (A 1-2 sentence description of what to do)",
          "cost": Number (Estimated activity cost in INR. Use 0 if it is a free sightseeing walk or leisure)"
        }
      ]
    }
  ]
}`;

    const userPrompt = `Generate a ${durationDays}-day travel itinerary for visiting ${destination.name}, ${destination.country}. 
Accommodation / Budget Category: ${hotelPreference}.
Primary Travel Theme: ${destination.category}.
Include actual local attractions and sights like: ${popularPlaces.join(", ")}.
Include local activities like: ${activities.join(", ")}.`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    };

    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      }
    });

    const responseContent = response.data?.choices?.[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response returned from Groq API");
    }

    const parsedData = JSON.parse(responseContent);
    return parsedData.itinerary || [];
  } catch (error: any) {
    logger.error("Failed to generate AI itinerary via Groq:", error.message || error);
    // Return a basic fallback structured itinerary instead of crashing, but let it be a clean live API fallback
    throw new Error(`AI Itinerary generation failed: ${error.message || error}`);
  }
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
    const itinerary = await generateItinerary({
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
      trip.itinerary = await generateItinerary({
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
