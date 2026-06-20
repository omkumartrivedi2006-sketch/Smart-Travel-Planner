import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { Weather, IForecastItem } from "../models/Weather";
import { NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

/**
 * Generate mock weather data based on destination parameters
 */
function generateMockWeather(destinationName: string, category: string, country: string) {
  let baseTemp = 25;
  let conditions = ["Sunny", "Partly Cloudy", "Clear"];
  let humidity = 60;
  let windSpeed = 12;

  const catLower = category.toLowerCase();
  const countryLower = country.toLowerCase();

  // Tailor weather conditions based on category and region
  if (catLower === "mountain" || countryLower === "switzerland") {
    baseTemp = Math.floor(Math.random() * 15) - 2; // -2 to 12 Celsius
    conditions = ["Snowy", "Foggy", "Cloudy", "Windy"];
    humidity = 75;
    windSpeed = 22;
  } else if (catLower === "beach" || catLower === "adventure" || destinationName.toLowerCase() === "maldives") {
    baseTemp = Math.floor(Math.random() * 8) + 28; // 28 to 35 Celsius
    conditions = ["Sunny", "Breezy", "Partly Cloudy"];
    humidity = 80;
    windSpeed = 15;
  } else if (catLower === "heritage" && (countryLower === "india" || countryLower === "egypt")) {
    baseTemp = Math.floor(Math.random() * 10) + 30; // 30 to 39 Celsius
    conditions = ["Sunny", "Hot", "Clear"];
    humidity = 40;
    windSpeed = 8;
  } else if (countryLower === "united kingdom" || countryLower === "london") {
    baseTemp = Math.floor(Math.random() * 10) + 10; // 10 to 19 Celsius
    conditions = ["Rainy", "Overcast", "Showers", "Drizzle"];
    humidity = 85;
    windSpeed = 18;
  } else {
    // Standard template
    baseTemp = Math.floor(Math.random() * 10) + 20; // 20 to 29 Celsius
    conditions = ["Sunny", "Cloudy", "Clear", "Pleasant"];
    humidity = 55;
    windSpeed = 10;
  }

  const primaryCondition = conditions[Math.floor(Math.random() * conditions.length)];

  // Generate 5-day forecast
  const forecast: IForecastItem[] = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const dateStr = forecastDate.toISOString().split("T")[0];

    const tempOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2 variation
    const forecastTemp = baseTemp + tempOffset;
    const forecastCondition = conditions[Math.floor(Math.random() * conditions.length)];

    forecast.push({
      date: dateStr,
      temperature: forecastTemp,
      condition: forecastCondition,
    });
  }

  return {
    destinationName: destinationName.toLowerCase(),
    temperature: baseTemp,
    condition: primaryCondition,
    humidity: Math.floor(Math.random() * 20) + (humidity - 10),
    windSpeed: Math.floor(Math.random() * 10) + (windSpeed - 5),
    forecast,
    lastUpdated: new Date(),
  };
}

/**
 * Fetch weather from OpenWeatherMap API
 */
async function fetchOpenWeather(destinationName: string, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destinationName)}&appid=${apiKey}&units=metric`;
  const response = await axios.get(url);
  const data = response.data;

  const list = data.list || [];
  const current = list[0];
  if (!current) {
    throw new Error("No weather forecasts returned from OpenWeatherMap");
  }

  const temperature = Math.round(current.main.temp);
  const condition = current.weather[0]?.main || "Clear";
  const humidity = current.main.humidity;
  const windSpeed = Math.round(current.wind.speed * 3.6); // convert m/s to km/h

  // Generate 5-day forecast by extracting 1 record per day (roughly every 24h)
  const forecast: IForecastItem[] = [];
  const addedDays = new Set<string>();
  const todayStr = new Date().toISOString().split("T")[0];

  for (const item of list) {
    const dateTimeStr = item.dt_txt || "";
    const dateStr = dateTimeStr.split(" ")[0] || new Date(item.dt * 1000).toISOString().split("T")[0];

    if (dateStr !== todayStr && !addedDays.has(dateStr) && forecast.length < 5) {
      addedDays.add(dateStr);
      forecast.push({
        date: dateStr,
        temperature: Math.round(item.main.temp),
        condition: item.weather[0]?.main || "Clear",
      });
    }
  }

  return {
    destinationName: destinationName.toLowerCase(),
    temperature,
    condition,
    humidity,
    windSpeed,
    forecast,
    lastUpdated: new Date(),
  };
}

/**
 * Get weather for a given destination (with cache refresh check)
 * GET /api/weather/:destination
 */
export async function getDestinationWeather(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { destination } = req.params;

    // 1. Find destination to verify it exists and get geographic context
    const foundDestination = await Destination.findOne({
      $or: [
        { name: new RegExp(`^${destination}$`, "i") },
        { country: new RegExp(`^${destination}$`, "i") }
      ]
    });

    if (!foundDestination) {
      throw new NotFoundError(`Destination '${destination}' not found`);
    }

    const lookupName = foundDestination.name.toLowerCase();

    // 2. Lookup existing weather record
    let weatherRecord = await Weather.findOne({ destinationName: lookupName });

    // 3. Cache expiration logic: if not found or last updated > 2 hours ago, refresh
    const cacheExpiryMs = 2 * 60 * 60 * 1000; // 2 hours
    const needsRefresh =
      !weatherRecord ||
      Date.now() - new Date(weatherRecord.lastUpdated).getTime() > cacheExpiryMs;

    if (needsRefresh) {
      logger.info(`Generating/Refreshing weather details for: ${foundDestination.name}`);
      
      let freshWeatherData;
      const apiKey = process.env.OPENWEATHER_API_KEY;

      if (apiKey && apiKey.trim() !== "" && apiKey.trim() !== "YourOpenWeatherAPIKeyHere") {
        try {
          logger.info(`Fetching live weather from OpenWeatherMap for ${foundDestination.name}...`);
          freshWeatherData = await fetchOpenWeather(foundDestination.name, apiKey.trim());
        } catch (err: any) {
          logger.warn(`OpenWeatherMap fetch failed for ${foundDestination.name}: ${err.message || err}. Falling back to mock generator.`);
          freshWeatherData = generateMockWeather(
            foundDestination.name,
            foundDestination.category,
            foundDestination.country
          );
        }
      } else {
        freshWeatherData = generateMockWeather(
          foundDestination.name,
          foundDestination.category,
          foundDestination.country
        );
      }

      if (weatherRecord) {
        // Update existing cache
        weatherRecord.temperature = freshWeatherData.temperature;
        weatherRecord.condition = freshWeatherData.condition;
        weatherRecord.humidity = freshWeatherData.humidity;
        weatherRecord.windSpeed = freshWeatherData.windSpeed;
        weatherRecord.forecast = freshWeatherData.forecast;
        weatherRecord.lastUpdated = freshWeatherData.lastUpdated;
        await weatherRecord.save();
      } else {
        // Create new cache record
        weatherRecord = await Weather.create(freshWeatherData);
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        destination: foundDestination.name,
        country: foundDestination.country,
        weather: weatherRecord,
      },
    });
  } catch (error) {
    next(error);
  }
}
