import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

/**
 * GET /api/places/:city
 * Fetch attractions, hotels, cafes, restaurants, and landmarks for a city
 */
export async function getPlacesByCity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { city } = req.params;
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const apiKeyMissing = !apiKey || apiKey.trim() === "" || apiKey.trim() === "YOUR_GEOAPIFY_KEY" || apiKey.trim() === "YourGeoapifyAPIKeyHere";

    let lat: number | null = null;
    let lon: number | null = null;
    let cityName = city;

    // 1. Try to find the city in destinations database for fast coordinate lookup or fallback data
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const foundDestination = await Destination.findOne({
      $or: [
        { name: new RegExp(`^${escapedCity}$`, "i") },
        { city: new RegExp(`^${escapedCity}$`, "i") }
      ]
    });

    if (foundDestination) {
      lat = foundDestination.latitude;
      lon = foundDestination.longitude;
      cityName = foundDestination.name;
      logger.info(`Resolved coordinates from local database for ${cityName}: ${lat}, ${lon}`);
    }

    // Function to generate seeded fallback places
    const generateFallbackPlaces = (dest: any) => {
      const fallbackList: any[] = [];
      const dLat = dest.latitude || 20.0;
      const dLng = dest.longitude || 77.0;

      if (dest.hotels && dest.hotels.length > 0) {
        dest.hotels.forEach((hotel: string, i: number) => {
          fallbackList.push({
            name: hotel,
            rating: 4.2 + (i % 3) * 0.3,
            address: `Near City Center, ${dest.name}`,
            category: "Hotel",
            coordinates: {
              lat: dLat + (i + 1) * 0.002,
              lng: dLng + (i + 1) * 0.002,
            }
          });
        });
      }

      if (dest.restaurants && dest.restaurants.length > 0) {
        dest.restaurants.forEach((rest: string, i: number) => {
          fallbackList.push({
            name: rest,
            rating: 4.3 + (i % 3) * 0.3,
            address: `Gourmet Street, ${dest.name}`,
            category: "Restaurant",
            coordinates: {
              lat: dLat - (i + 1) * 0.002,
              lng: dLng + (i + 1) * 0.002,
            }
          });
        });
      }

      if (dest.topAttractions && dest.topAttractions.length > 0) {
        dest.topAttractions.forEach((attr: string, i: number) => {
          fallbackList.push({
            name: attr,
            rating: 4.5 + (i % 3) * 0.2,
            address: `Tourist Spot, ${dest.name}`,
            category: "Attraction",
            coordinates: {
              lat: dLat + (i + 1) * 0.002,
              lng: dLng - (i + 1) * 0.002,
            }
          });
        });
      }

      return fallbackList;
    };

    // If API key is missing, immediately return seeded fallback data if available
    if (apiKeyMissing) {
      if (foundDestination) {
        logger.info(`Geoapify key missing. Returning seeded fallback places for ${cityName}.`);
        res.status(200).json({
          status: "success",
          data: {
            city: cityName,
            coordinates: { lat, lng: lon },
            places: generateFallbackPlaces(foundDestination),
          }
        });
        return;
      } else {
        throw new BadRequestError("Geoapify API key is not configured in environment variables and city not found in database.");
      }
    }

    logger.info(`Fetching places for city: ${city}`);

    if (!foundDestination) {
      // 2. Call Geoapify Geocoding API if not in local destinations database
      try {
        const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&limit=1&apiKey=${apiKey.trim()}`;
        const geocodeRes = await axios.get(geocodeUrl);
        const features = geocodeRes.data?.features || [];

        if (features.length === 0) {
          throw new NotFoundError(`Coordinates for city '${city}' could not be resolved`);
        }

        const properties = features[0].properties;
        lat = features[0].geometry.coordinates[1];
        lon = features[0].geometry.coordinates[0];
        cityName = properties.city || properties.name || city;
        logger.info(`Resolved coordinates from Geoapify Geocoding for ${cityName}: ${lat}, ${lon}`);
      } catch (err: any) {
        logger.error(`Geocoding failed for ${city}:`, err.message || err);
        throw new NotFoundError(`Failed to resolve coordinates for city '${city}': ${err.message || err}`);
      }
    }

    if (lat === null || lon === null) {
      throw new NotFoundError(`Coordinates for city '${city}' could not be resolved`);
    }

    // 3. Call Geoapify Places API
    // Requesting tourist attractions, hotels, cafes, restaurants, and sights
    const categories = "tourism.attraction,catering.restaurant,accommodation.hotel,catering.cafe,tourism.sights";
    const radius = 15000; // 15km radius
    const limit = 30;

    let placeFeatures = [];
    try {
      const placesUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=${limit}&apiKey=${apiKey.trim()}`;
      const placesRes = await axios.get(placesUrl);
      placeFeatures = placesRes.data?.features || [];
    } catch (err: any) {
      logger.warn(`Geoapify Places API call failed for coordinates ${lat}, ${lon}. Falling back to seeded database places. Error: ${err.message}`);
      if (foundDestination) {
        res.status(200).json({
          status: "success",
          data: {
            city: cityName,
            coordinates: { lat, lng: lon },
            places: generateFallbackPlaces(foundDestination),
          }
        });
        return;
      }
      throw err;
    }

    // 4. Map features to our clean structure
    const places = placeFeatures.map((feat: any) => {
      const props = feat.properties;
      const cats: string[] = props.categories || [];
      
      let category = "Landmark";
      if (cats.includes("accommodation.hotel") || cats.some(c => c.startsWith("accommodation"))) {
        category = "Hotel";
      } else if (cats.includes("catering.restaurant")) {
        category = "Restaurant";
      } else if (cats.includes("catering.cafe")) {
        category = "Cafe";
      } else if (cats.includes("tourism.attraction")) {
        category = "Attraction";
      }

      const rating = props.datasource?.raw?.rating 
        ? parseFloat(props.datasource.raw.rating) 
        : props.rating 
        ? parseFloat(props.rating)
        : null;

      return {
        name: props.name || props.street || "Unnamed Location",
        rating,
        address: props.formatted || props.address_line2 || "Address not available",
        category,
        coordinates: {
          lat: feat.geometry.coordinates[1],
          lng: feat.geometry.coordinates[0],
        }
      };
    }).filter((place: any) => place.name !== "Unnamed Location"); // Filter out items with no name

    res.status(200).json({
      status: "success",
      data: {
        city: cityName,
        coordinates: { lat, lng: lon },
        places,
      }
    });

  } catch (error) {
    next(error);
  }
}
