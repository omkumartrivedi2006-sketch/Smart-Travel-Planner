import { Destination } from "../models/Destination";
import { Weather } from "../models/Weather";
import { logger } from "../utils/logger";

interface ChatMessageContext {
  role: "user" | "model";
  content: string;
}

/**
 * Clean user query to search for destination name references in the database
 */
async function findMentionedDestination(text: string) {
  const destinations = await Destination.find({});
  for (const dest of destinations) {
    const destNameLower = dest.name.toLowerCase();
    const countryLower = dest.country.toLowerCase();
    
    if (text.toLowerCase().includes(destNameLower) || text.toLowerCase().includes(countryLower)) {
      return dest;
    }
  }
  return null;
}

/**
 * Generate fallback response when Gemini API is unavailable or fails
 */
async function generateLocalFallbackResponse(
  message: string,
  history: ChatMessageContext[]
): Promise<string> {
  const query = message.toLowerCase();
  
  // 1. Locate if any destination is mentioned
  const dest = await findMentionedDestination(query);

  // 2. Weather Inquiries
  if (query.includes("weather") || query.includes("temp") || query.includes("forecast")) {
    if (dest) {
      const weather = await Weather.findOne({ destinationName: dest.name.toLowerCase() });
      if (weather) {
        let forecastStr = weather.forecast
          .map((f) => `- **${f.date}**: ${f.temperature}°C, ${f.condition}`)
          .join("\n");
        return `Here is the current weather forecast for **${dest.name}, ${dest.country}**:\n\n` +
          `*   **Temperature**: ${weather.temperature}°C\n` +
          `*   **Condition**: ${weather.condition}\n` +
          `*   **Humidity**: ${weather.humidity}%\n` +
          `*   **Wind Speed**: ${weather.windSpeed} km/h\n\n` +
          `**5-Day Forecast**:\n${forecastStr}\n\n*Note: Simulated cache forecast.*`;
      }
    }
    return "To get weather advice, please include a valid destination name (e.g., 'What is the weather like in Goa?').";
  }

  // 3. Packing Suggestions
  if (query.includes("pack") || query.includes("clothing") || query.includes("gear")) {
    if (dest) {
      let packingList = "";
      if (dest.category.toLowerCase() === "beach") {
        packingList = "- Light cotton clothes, swimwear\n- Sunglasses, sunblock (SPF 50+), and a wide-brimmed hat\n- Sandals or flip-flops\n- Waterproof dry bag for electronics\n- Quick-dry beach towel";
      } else if (dest.category.toLowerCase() === "mountain") {
        packingList = "- Thermal base layers, fleece jackets, and windproof outer coat\n- Hiking boots with good grip and warm socks\n- Beanie, gloves, and neck warmer\n- Hydration flask and headlamp\n- Personal lip balm and moisturizers";
      } else {
        packingList = "- Comfortable walking sneakers\n- Layered smart-casual clothing\n- Universal plug adapters and power banks\n- Compact umbrella or light rain poncho\n- Crossbody bag for security";
      }
      return `Here are my packing suggestions for **${dest.name}** (${dest.category} destination):\n\n${packingList}\n\nDon't forget your passports and tickets!`;
    }
    return "I can give you custom packing advice! Please specify where you are traveling (e.g., 'What should I pack for Ladakh?').";
  }

  // 4. Route / Distance Inquiries
  if (query.includes("route") || query.includes("reach") || query.includes("distance") || query.includes("map")) {
    if (dest) {
      return `For traveling to **${dest.name}, ${dest.country}**, here are the recommended options:\n\n` +
        `1.  **Flight**: Highly recommended for long distances. Standard flight time is calculated from your local airport. (Approx Daily Cost index: high)\n` +
        `2.  **Train**: A scenic budget-friendly option for domestic routes inside the region.\n` +
        `3.  **Road (Car)**: Great for localized sightseeing and mountain passes (like Ladakh/Manali routes).\n\n` +
        `You can use the **Route Planner** page on our app to enter your exact coordinates and calculate precise highway mileage, transit duration, and fuel costs!`;
    }
    return "Please specify a destination to get route recommendations (e.g., 'How do I reach Paris?').";
  }

  // 5. Itinerary Inquiries
  if (query.includes("itinerary") || query.includes("plan") || query.includes("day")) {
    if (dest) {
      const popularSpots = dest.topAttractions || dest.popularPlaces || [];
      const placesStr = popularSpots.map(p => `- Visit **${p}**`).join("\n");
      const activitiesStr = dest.activities.map(a => `- Participate in **${a}**`).join("\n");
      return `Here is a suggested 3-Day weekend itinerary for **${dest.name}, ${dest.country}**:\n\n` +
        `**Day 1: Arrival & Exploration**\n` +
        `${placesStr.split("\n").slice(0, 2).join("\n")}\n` +
        `- Evening: Rest and try local cuisine at the local market.\n\n` +
        `**Day 2: Adventure & Activities**\n` +
        `${activitiesStr}\n` +
        `- Afternoon: Sightseeing at the remaining popular viewpoints.\n\n` +
        `**Day 3: Sightseeing & Departure**\n` +
        `${placesStr.split("\n").slice(2).join("\n") || "- Stroll around the local township and purchase souvenirs"}\n` +
        `- Depart back home.\n\n` +
        `*You can save this exact trip in the **Trip Planner** tab to generate full day-by-day schedules with cost structures!*`;
    }
    return "To generate a custom itinerary, please tell me your target destination (e.g., 'Create a plan for Rome').";
  }

  // 6. Budget Advice
  if (query.includes("budget") || query.includes("cost") || query.includes("price") || query.includes("money")) {
    if (dest) {
      const budgetEstimate = dest.averageBudget || dest.averageCost || 3000;
      return `**Budget Advice for ${dest.name}, ${dest.country}**:\n\n` +
        `*   **Daily Base Cost Index**: ~₹${budgetEstimate.toLocaleString()} INR per day per traveler (covers mid-range lodging and standard food).\n` +
        `*   **Budgeting Category**: ${budgetEstimate > 10000 ? "Premium/Luxury" : budgetEstimate > 5000 ? "Mid-Range" : "Budget-friendly"}.\n\n` +
        `**Money Saving Tips**:\n` +
        `- Book local transport/trains instead of private flyers/cabs.\n` +
        `- Dine at local street markets rather than high-end resort diners.\n` +
        `- Visit public/free heritage spots (like forts and beaches) which require zero entry tickets.\n\n` +
        `Try out our standalone **Budget Calculator** page to get itemized breakdowns based on your hotel and flight preferences!`;
    }
    return "Specify a destination to get customized budget advice (e.g., 'What is the budget for Switzerland?').";
  }

  // 7. General Destination Suggestions
  if (dest) {
    const spotsList = dest.topAttractions || dest.popularPlaces || [];
    const places = spotsList.join(", ");
    const activities = dest.activities.join(", ");
    return `**Destination Spotlight: ${dest.name}, ${dest.country}**\n\n` +
      `*   **Category**: ${dest.category}\n` +
      `*   **Best Time to Visit**: ${dest.bestTimeToVisit}\n` +
      `*   **Average Rating**: ⭐ ${dest.rating}/5.0\n` +
      `*   **Description**: ${dest.shortDescription || ""}\n` +
      `*   **Top Spots**: ${places}\n` +
      `*   **Top Activities**: ${activities}\n\n` +
      `Let me know if you would like me to help you plan an itinerary, calculate a budget, or get packing checklists for this destination!`;
  }

  // 8. General Greetings and Fallback
  return `Hello! I am your AI Travel Assistant. How can I help you plan your next adventure?\n\n` +
    `I can provide:\n` +
    `1.  **Destination Suggestions** (e.g., 'Tell me about Bali')\n` +
    `2.  **Weather Forecasts** (e.g., 'Weather in Paris')\n` +
    `3.  **Packing Suggestions** (e.g., 'What should I pack for Switzerland?')\n` +
    `4.  **Budget Advice** (e.g., 'Cost for Dubai')\n` +
    `5.  **Itineraries** (e.g., 'Plan a trip to Goa')\n` +
    `6.  **Route/Travel Tips** (e.g., 'How to reach Kashmir')`;
}

/**
 * Query AI Service (Gemini API with custom system instructions + conversation memory)
 */
export async function getAIChatResponse(params: {
  message: string;
  history: ChatMessageContext[];
}): Promise<string> {
  const { message, history } = params;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.info("GEMINI_API_KEY not configured. Falling back to local rules-engine.");
    return generateLocalFallbackResponse(message, history);
  }

  try {
    // Construct Gemini chat model structure
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstruction = 
      "You are a friendly, expert AI Travel Assistant helping users plan trips. " +
      "Provide helpful travel recommendations, budget advice, destination suggestions, " +
      "itinerary generation, weather reviews, packing suggestions, and travel tips. " +
      "Keep responses structured, concise, and formatted in Markdown. " +
      "If users ask about specific destinations, try to reflect information matching global destinations like Goa, Kashmir, Paris, Bali, London, Tokyo, etc.";

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Gemini API Error Response: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API failed with status ${response.status}`);
    }

    const responseData = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };

    const reply = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error("Empty candidate content from Gemini API response");
    }

    return reply;
  } catch (error) {
    logger.warn("AI API request failed. Falling back to local rules-engine.", error);
    return generateLocalFallbackResponse(message, history);
  }
}
