import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { BadRequestError, NotFoundError } from "../utils/errors";

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
  return R * c;
}

/**
 * Main budget calculation function reusable across standalone calculations and trip saves.
 */
export function performBudgetCalculation(params: {
  destination: any;
  startDate: Date;
  endDate: Date;
  travelers: number;
  hotelPreference: "budget" | "mid-range" | "luxury";
  transportPreference: "car" | "train" | "flight";
  travelType: "solo" | "couple" | "family" | "friends";
  originLatitude?: number;
  originLongitude?: number;
}) {
  const {
    destination,
    startDate,
    endDate,
    travelers,
    hotelPreference,
    transportPreference,
    originLatitude,
    originLongitude,
  } = params;

  // 1. Calculate duration of trip in days
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1);
  const durationNights = Math.max(1, durationDays - 1);

  // Cost factor matching destination averageBudget (default baseline is ₹4000/day)
  const destBudget = destination.averageBudget || destination.averageCost || 4000;
  const destinationCostFactor = destBudget / 4000;

  // 2. Hotel Cost estimation
  // Assumes 2 travelers per room
  const roomsCount = Math.max(1, Math.ceil(travelers / 2));
  let baseHotelDailyRate = 4000; // mid-range default (INR)
  if (hotelPreference === "budget") baseHotelDailyRate = 1500;
  if (hotelPreference === "luxury") baseHotelDailyRate = 12000;

  const roomDailyRate = baseHotelDailyRate * destinationCostFactor;
  const hotelCost = roomDailyRate * roomsCount * durationNights;

  // 3. Food Cost estimation
  let baseFoodDailyRatePerPerson = 1000; // mid-range default (INR)
  if (hotelPreference === "budget") baseFoodDailyRatePerPerson = 300;
  if (hotelPreference === "luxury") baseFoodDailyRatePerPerson = 3500;

  const foodDailyRate = baseFoodDailyRatePerPerson * destinationCostFactor;
  const foodCost = foodDailyRate * travelers * durationDays;

  // 4. Transport Cost estimation
  let transportCost = 0;
  let distanceKm = 1000; // default assumptions if coordinates are missing

  if (originLatitude !== undefined && originLongitude !== undefined) {
    distanceKm = calculateHaversineDistance(
      originLatitude,
      originLongitude,
      destination.latitude,
      destination.longitude
    );
  } else {
    // If country is different, assume it is an international flight distance
    const isInternational = destination.country.toLowerCase() !== "india";
    distanceKm = isInternational ? 5000 : 800;
  }

  if (transportPreference === "flight") {
    // Base ticket cost per traveler + mileage cost (INR)
    const ticketCost = 4000 + distanceKm * 10;
    transportCost = ticketCost * travelers;
  } else if (transportPreference === "train") {
    // Base ticket cost per traveler + mileage cost (INR)
    const ticketCost = 400 + distanceKm * 2;
    transportCost = ticketCost * travelers;
  } else {
    // Car rental / driving costs per day (INR)
    const vehiclesCount = Math.max(1, Math.ceil(travelers / 4));
    const dailyRentalCost = 1800 + (distanceKm * 12) / durationDays;
    transportCost = dailyRentalCost * vehiclesCount * durationDays;
  }

  // 5. Activities Cost estimation
  let baseActivitiesDailyRatePerPerson = 750; // mid-range default (INR)
  if (hotelPreference === "budget") baseActivitiesDailyRatePerPerson = 200;
  if (hotelPreference === "luxury") baseActivitiesDailyRatePerPerson = 3000;

  const activitiesDailyRate = baseActivitiesDailyRatePerPerson * destinationCostFactor;
  const activitiesCost = activitiesDailyRate * travelers * durationDays;

  // 6. Miscellaneous Cost estimation (10% surcharge)
  const subTotal = hotelCost + foodCost + transportCost + activitiesCost;
  const miscellaneousCost = subTotal * 0.10;

  // Total Estimate
  const totalEstimate = subTotal + miscellaneousCost;

  return {
    hotelCost: Math.round(hotelCost),
    foodCost: Math.round(foodCost),
    transportCost: Math.round(transportCost),
    activitiesCost: Math.round(activitiesCost),
    miscellaneousCost: Math.round(miscellaneousCost),
    totalEstimate: Math.round(totalEstimate),
  };
}

/**
 * Handle standalone budget calculations
 * POST /api/budget/calculate
 */
export async function calculateBudget(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new NotFoundError("Destination not found");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    res.status(200).json({
      status: "success",
      data: {
        destinationName: destination.name,
        country: destination.country,
        travelers,
        durationDays: Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1),
        budget: budgetBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
}
