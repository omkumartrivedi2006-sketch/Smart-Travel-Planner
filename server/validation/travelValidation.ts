import { z } from "zod";

const categories = ["Beach", "Mountain", "City", "Heritage", "Nature", "Adventure"] as const;

export const createDestinationSchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(2, "Name is too short").trim(),
    description: z.string({ message: "Description is required" }).min(10, "Description should be at least 10 characters").trim(),
    country: z.string({ message: "Country is required" }).min(2, "Country is too short").trim(),
    category: z.enum(categories, { message: "Invalid category" }),
    latitude: z.number({ message: "Latitude is required" }).min(-90).max(90),
    longitude: z.number({ message: "Longitude is required" }).min(-180).max(180),
    averageCost: z.number({ message: "Average daily cost is required" }).nonnegative(),
    activities: z.array(z.string()).min(1, "At least one activity is required"),
    bestTimeToVisit: z.string({ message: "Best time to visit is required" }).trim(),
    rating: z.number().min(0).max(5).optional(),
    image: z.string().url("Invalid image URL").optional().or(z.string().length(0)),
    popularPlaces: z.array(z.string()).optional(),
  }),
});

export const updateDestinationSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    description: z.string().min(10).trim().optional(),
    country: z.string().min(2).trim().optional(),
    category: z.enum(categories).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    averageCost: z.number().nonnegative().optional(),
    activities: z.array(z.string()).min(1).optional(),
    bestTimeToVisit: z.string().trim().optional(),
    rating: z.number().min(0).max(5).optional(),
    image: z.string().url().optional().or(z.string().length(0)),
    popularPlaces: z.array(z.string()).optional(),
  }),
});

export const calculateRouteSchema = z.object({
  body: z.object({
    originLatitude: z.number({ message: "Origin latitude is required" }).min(-90).max(90),
    originLongitude: z.number({ message: "Origin longitude is required" }).min(-180).max(180),
    destinationId: z.string({ message: "Destination ID is required" }).regex(/^[0-9a-fA-F]{24}$/, "Invalid Destination ID format"),
    modeOfTransport: z.enum(["car", "train", "flight"], { message: "Invalid mode of transport" }),
  }),
});
