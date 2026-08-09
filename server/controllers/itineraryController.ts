import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

function buildFallbackItineraryObject(destination: string, durationDays: number, budgetLevel: string, travelInterests: string[]) {
  const itinerary = [];
  for (let day = 1; day <= durationDays; day++) {
    itinerary.push({
      day,
      activities: [
        {
          time: "09:00 AM",
          activity: `Morning Visit to ${destination} Landmarks`,
          description: `Explore historic attractions, viewpoints, and cultural landmarks around ${destination}.`,
          cost: 0,
        },
        {
          time: "02:00 PM",
          activity: travelInterests.length > 0 ? `${travelInterests[(day - 1) % travelInterests.length]} Experience` : "Local Sightseeing & Shopping",
          description: `Enjoy local activities tailored to your interests: ${travelInterests.join(", ") || "sightseeing"}.`,
          cost: 500,
        },
        {
          time: "07:00 PM",
          activity: "Evening Dining & Cultural Walk",
          description: `Dine at popular local spots and experience nighttime market culture in ${destination}.`,
          cost: 700,
        },
      ],
    });
  }

  return {
    destination,
    durationDays,
    budgetLevel,
    itinerary,
    estimatedCosts: {
      hotelCost: durationDays * 2500,
      foodCost: durationDays * 1200,
      transportCost: durationDays * 800,
      activitiesCost: durationDays * 500,
      miscellaneousCost: 1000,
      totalEstimate: durationDays * 5000 + 1000,
    },
    travelTips: [
      `Keep local currency (INR) for street shopping around ${destination}.`,
      "Use verified cabs or local public transport options for sightseeing.",
      "Check local weather forecasts before planning outdoor morning tours.",
    ],
  };
}

/**
 * POST /api/itinerary
 * Generate a personalized itinerary using Groq API (with intelligent local fallback)
 */
export async function generateItinerary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { destination, budget, days = 3, interests = [] } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!destination || String(destination).trim() === "") {
      throw new BadRequestError("Destination is a required parameter");
    }

    const durationDays = Math.max(1, Math.min(14, Number(days)));
    const budgetLevel = budget || "Mid-range";
    const travelInterests = Array.isArray(interests) ? interests : [interests];

    if (!apiKey || apiKey.trim() === "" || apiKey.trim() === "YOUR_GROQ_KEY" || apiKey.trim() === "YourGroqAPIKeyHere") {
      logger.warn("GROQ_API_KEY not configured. Generating structured fallback itinerary.");
      res.status(200).json({
        status: "success",
        data: buildFallbackItineraryObject(destination, durationDays, budgetLevel, travelInterests),
      });
      return;
    }

    logger.info(`Generating ${durationDays}-day itinerary for ${destination} with budget tier '${budgetLevel}' and interests: ${travelInterests.join(", ")}`);

    const systemPrompt = `You are a world-class travel guide and itinerary planner. 
Generate a comprehensive, highly realistic day-by-day travel itinerary for a trip.
You MUST output your response as a valid JSON object matching the JSON schema below. Do not output any conversational text or markdown blocks, return ONLY the raw JSON object.

JSON SCHEMA:
{
  "destination": "String (Name of the city/destination)",
  "durationDays": Number (Matching the requested duration),
  "budgetLevel": "String (Matching the requested budget tier)",
  "itinerary": [
    {
      "day": Number (Day index starting at 1),
      "activities": [
        {
          "time": "String (e.g., '09:00 AM', '02:00 PM', '07:00 PM')",
          "activity": "String (Name of the place or activity)",
          "description": "String (Detailed, engaging description of what to do, history, or tips for this spot)",
          "cost": Number (Estimated individual cost in INR. Enter 0 if it is a free activity or walk)"
        }
      ]
    }
  ],
  "estimatedCosts": {
    "hotelCost": Number (Estimated total hotel accommodation cost in INR for the entire trip),
    "foodCost": Number (Estimated total dining/eating cost in INR for the entire trip),
    "transportCost": Number (Estimated total transport/local taxi/train cost in INR for the entire trip),
    "activitiesCost": Number (Estimated total sightseeing tickets/rentals cost in INR for the entire trip),
    "miscellaneousCost": Number (Estimated general buffer/shopping cost in INR for the entire trip),
    "totalEstimate": Number (Sum of all costs in INR)
  },
  "travelTips": [
    "String (Useful local travel tips, cultural guidelines, transit advice, or safety warnings)"
  ]
}

Ensure the attractions are actual landmarks in the target destination, and that costs are scaled realistically according to the budget tier (${budgetLevel}).`;

    const userPrompt = `Generate a ${durationDays}-day travel itinerary for ${destination}. 
Budget: ${budgetLevel}.
Interests: ${travelInterests.join(", ")}.`;

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
    let response;
    try {
      response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        }
      });

      const responseContent = response.data?.choices?.[0]?.message?.content;
      if (!responseContent) {
        throw new Error("Empty response returned from Groq completions API");
      }

      const itineraryData = JSON.parse(responseContent);

      res.status(200).json({
        status: "success",
        data: itineraryData
      });
    } catch (err: any) {
      logger.warn("Groq API call failed. Returning fallback structured itinerary:", err.message || err);
      res.status(200).json({
        status: "success",
        data: buildFallbackItineraryObject(destination, durationDays, budgetLevel, travelInterests),
      });
    }
  } catch (error: any) {
    logger.error("Failed to generate AI itinerary:", error.message || error);
    next(error);
  }
}
