import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

/**
 * POST /api/itinerary
 * Generate a personalized itinerary using Groq API
 */
export async function generateItinerary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { destination, budget, days = 3, interests = [] } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey.trim() === "" || apiKey.trim() === "YOUR_GROQ_KEY" || apiKey.trim() === "YourGroqAPIKeyHere") {
      throw new BadRequestError("Groq API key is not configured in environment variables");
    }

    if (!destination || String(destination).trim() === "") {
      throw new BadRequestError("Destination is a required parameter");
    }

    const durationDays = Math.max(1, Math.min(14, Number(days))); // Limit duration between 1 and 14 days
    const budgetLevel = budget || "Mid-range";
    const travelInterests = Array.isArray(interests) ? interests : [interests];

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
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          throw new BadRequestError("The Groq API key configured on the server is invalid or has expired.");
        }
        throw new BadRequestError(`AI service error: ${err.response?.data?.error?.message || err.message}`);
      }
      throw err;
    }

    const responseContent = response.data?.choices?.[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response returned from Groq completions API");
    }

    const itineraryData = JSON.parse(responseContent);

    res.status(200).json({
      status: "success",
      data: itineraryData
    });

  } catch (error: any) {
    logger.error("Failed to generate AI itinerary:", error.message || error);
    next(error);
  }
}
