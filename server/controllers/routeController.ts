import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { NotFoundError, BadRequestError } from "../utils/errors";

/**
 * Calculate distance between two lat/lng coordinates in km using the Haversine Formula
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Route Details
 * POST /api/routes/calculate
 */
export async function calculateRoute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { originLatitude, originLongitude, destinationId, modeOfTransport } = req.body;

    // 1. Locate destination
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new NotFoundError("Destination not found");
    }

    // 2. Calculate Distance
    const distanceKm = calculateHaversineDistance(
      originLatitude,
      originLongitude,
      destination.latitude,
      destination.longitude
    );

    // 3. Estimations based on mode of transport
    let averageSpeed = 75; // km/h
    let costPerKm = 0.15; // USD/km
    let baseCost = 0; // USD
    let warning: string | undefined;

    switch (modeOfTransport) {
      case "flight":
        averageSpeed = 800; // jet speed
        costPerKm = 0.12;
        baseCost = 100; // booking fees
        if (distanceKm < 200) {
          warning = "Distance is under 200km; taking a flight might not be practical compared to road/rail.";
        }
        break;
      case "train":
        averageSpeed = 65; // average train speed
        costPerKm = 0.06;
        baseCost = 15; // base ticket cost
        break;
      case "car":
        averageSpeed = 75;
        costPerKm = 0.15;
        baseCost = 10; // fuel surcharge / toll allowance
        break;
      default:
        throw new BadRequestError("Invalid mode of transport");
    }

    // Duration: hours = distance / speed
    const durationHours = distanceKm / averageSpeed;
    const finalDurationHours = Math.round(durationHours * 100) / 100;

    // Cost: cost = base + (costPerKm * distance)
    const estimatedCost = baseCost + (costPerKm * distanceKm);
    const finalCost = Math.round(estimatedCost * 100) / 100;

    // 4. Generate suggested step-by-step itinerary
    const suggestedItinerary = [
      `Depart from current coordinates [${originLatitude.toFixed(4)}, ${originLongitude.toFixed(4)}]`,
      modeOfTransport === "flight"
        ? `Transit to nearest airport, complete boarding, and fly towards destination region`
        : modeOfTransport === "train"
        ? `Proceed to closest railway terminal and embark on direct rail line`
        : `Drive on highway routing via local connecting roadways`,
      `Pass through route checkpoints (approx. ${distanceKm.toFixed(0)} km path)`,
      `Arrive at ${destination.name}, ${destination.country} [${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}]`,
    ];

    res.status(200).json({
      status: "success",
      data: {
        origin: {
          latitude: originLatitude,
          longitude: originLongitude,
        },
        destination: {
          id: destination._id,
          name: destination.name,
          country: destination.country,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        modeOfTransport,
        distanceKm,
        durationHours: finalDurationHours,
        estimatedCost: finalCost,
        suggestedItinerary,
        warning,
      },
    });
  } catch (error) {
    next(error);
  }
}
