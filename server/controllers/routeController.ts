import { Request, Response, NextFunction } from "express";
import { Destination } from "../models/Destination";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import axios from "axios";

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

    const lat1 = Number(originLatitude);
    const lon1 = Number(originLongitude);
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    if (isNaN(lat1) || isNaN(lon1)) {
      throw new BadRequestError("Valid origin coordinates are required");
    }

    let distanceKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    let durationHours = distanceKm / 75; // default driving duration
    let routeCoordinates: [number, number][] = [[lat1, lon1], [lat2, lon2]];
    let suggestedItinerary: string[] = [];
    let warning: string | undefined;

    if (modeOfTransport === "flight") {
      // Flight: direct straight path
      const averageSpeed = 800; // average commercial flight speed in km/h
      durationHours = distanceKm / averageSpeed;
      routeCoordinates = [[lat1, lon1], [lat2, lon2]];
      suggestedItinerary = [
        `Depart from airport near current coordinates [${lat1.toFixed(4)}, ${lon1.toFixed(4)}]`,
        `Fly direct via flight path towards destination (approx. ${distanceKm.toFixed(0)} km)`,
        `Arrive at ${destination.name} airport [${lat2.toFixed(4)}, ${lon2.toFixed(4)}]`
      ];

      if (distanceKm < 200) {
        warning = "Distance is under 200km; taking a flight might not be practical compared to road/rail.";
      }
    } else {
      // Land transport (car or train)
      const geoapifyKey = process.env.GEOAPIFY_API_KEY;
      let routeFetched = false;

      // Try Geoapify Routing API if key is configured
      if (geoapifyKey && geoapifyKey.trim() !== "" && geoapifyKey.trim() !== "YOUR_GEOAPIFY_KEY" && geoapifyKey.trim() !== "YourGeoapifyAPIKeyHere") {
        try {
          const mode = modeOfTransport === "train" ? "transit" : "drive";
          logger.info(`Fetching live route from Geoapify Routing API for ${mode}...`);
          const url = `https://api.geoapify.com/v1/routing?waypoints=${lat1},${lon1}|${lat2},${lon2}&mode=${mode}&apiKey=${geoapifyKey.trim()}`;
          const response = await axios.get(url);
          const features = response.data?.features || [];

          if (features.length > 0) {
            const feature = features[0];
            const props = feature.properties;
            
            distanceKm = props.distance / 1000;
            durationHours = props.time / 3600;

            const coords = feature.geometry.coordinates || [];
            // Geoapify returns [lon, lat] points, map to [lat, lon]
            if (Array.isArray(coords) && coords.length > 0) {
              if (Array.isArray(coords[0][0])) {
                // MultiLineString or nested array, flatten
                routeCoordinates = coords[0].map((c: any) => [c[1], c[0]]);
              } else {
                routeCoordinates = coords.map((c: any) => [c[1], c[0]]);
              }
            }

            // Construct directions from steps
            const legs = props.legs || [];
            if (legs.length > 0 && legs[0].steps) {
              suggestedItinerary = legs[0].steps.map((s: any, idx: number) => {
                return s.instruction?.text || `Step ${idx + 1}: Proceed for ${(s.distance / 1000).toFixed(1)} km`;
              });
            } else {
              suggestedItinerary = [
                `Depart from [${lat1.toFixed(4)}, ${lon1.toFixed(4)}]`,
                `Follow driving route instructions for ${distanceKm.toFixed(1)} km`,
                `Arrive at ${destination.name} [${lat2.toFixed(4)}, ${lon2.toFixed(4)}]`
              ];
            }
            routeFetched = true;
          }
        } catch (err: any) {
          logger.warn(`Geoapify Routing API failed: ${err.message || err}. Falling back to OSRM.`);
        }
      }

      // Fallback to free public OSRM (Open Source Routing Machine) driving API
      if (!routeFetched) {
        try {
          logger.info("Fetching live route from OSRM driving service...");
          const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`;
          const response = await axios.get(url);
          const routes = response.data?.routes || [];

          if (routes.length > 0) {
            const route = routes[0];
            distanceKm = route.distance / 1000;
            durationHours = route.duration / 3600;

            const coords = route.geometry?.coordinates || [];
            // OSRM returns [lon, lat] points, map to [lat, lon] for Leaflet
            routeCoordinates = coords.map((c: any) => [c[1], c[0]]);

            const steps = route.legs?.[0]?.steps || [];
            if (steps.length > 0) {
              suggestedItinerary = steps.map((s: any) => {
                const modifier = s.maneuver?.modifier ? ` ${s.maneuver.modifier}` : "";
                const type = s.maneuver?.type || "proceed";
                const street = s.name ? ` onto ${s.name}` : "";
                return `${type}${modifier}${street} for ${(s.distance / 1000).toFixed(1)} km`;
              });
            } else {
              suggestedItinerary = [
                `Depart from [${lat1.toFixed(4)}, ${lon1.toFixed(4)}]`,
                `Follow driving route instructions for ${distanceKm.toFixed(1)} km`,
                `Arrive at ${destination.name} [${lat2.toFixed(4)}, ${lon2.toFixed(4)}]`
              ];
            }
            routeFetched = true;
          }
        } catch (err: any) {
          logger.error(`OSRM Routing failed: ${err.message || err}. Using straight-line fallback.`);
          // If everything fails, fall back to straight line
          distanceKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
          durationHours = distanceKm / (modeOfTransport === "train" ? 65 : 75);
          routeCoordinates = [[lat1, lon1], [lat2, lon2]];
          suggestedItinerary = [
            `Depart from [${lat1.toFixed(4)}, ${lon1.toFixed(4)}]`,
            `Travel straight line route for ${distanceKm.toFixed(1)} km`,
            `Arrive at ${destination.name} [${lat2.toFixed(4)}, ${lon2.toFixed(4)}]`
          ];
        }
      }
    }

    // Cost estimation based on distance
    let costPerKm = 0.15; // USD/km
    let baseCost = 0; // USD
    
    switch (modeOfTransport) {
      case "flight":
        costPerKm = 0.12;
        baseCost = 100;
        break;
      case "train":
        costPerKm = 0.06;
        baseCost = 15;
        break;
      case "car":
        costPerKm = 0.15;
        baseCost = 10;
        break;
    }

    const estimatedCost = baseCost + (costPerKm * distanceKm);
    const finalCost = Math.round(estimatedCost * 100) / 100;
    const finalDurationHours = Math.round(durationHours * 100) / 100;

    res.status(200).json({
      status: "success",
      data: {
        origin: {
          latitude: lat1,
          longitude: lon1,
        },
        destination: {
          id: destination._id,
          name: destination.name,
          country: destination.country,
          latitude: lat2,
          longitude: lon2,
        },
        modeOfTransport,
        distanceKm,
        durationHours: finalDurationHours,
        estimatedCost: finalCost,
        suggestedItinerary,
        routeCoordinates,
        warning,
      },
    });

  } catch (error) {
    next(error);
  }
}
