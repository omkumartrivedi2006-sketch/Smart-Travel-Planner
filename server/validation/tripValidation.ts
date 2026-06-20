import { z } from "zod";

const hotelPreferences = ["budget", "mid-range", "luxury"] as const;
const transportPreferences = ["car", "train", "flight"] as const;
const travelTypes = ["solo", "couple", "family", "friends"] as const;

export const createTripSchema = z.object({
  body: z.object({
    destinationId: z.string({ message: "Destination ID is required" }).regex(/^[0-9a-fA-F]{24}$/, "Invalid Destination ID format"),
    startDate: z.string({ message: "Start date is required" }).transform((str) => new Date(str)),
    endDate: z.string({ message: "End date is required" }).transform((str) => new Date(str)),
    travelers: z.number({ message: "Travelers count is required" }).min(1, "Must have at least 1 traveler"),
    hotelPreference: z.enum(hotelPreferences).optional().default("mid-range"),
    transportPreference: z.enum(transportPreferences).optional().default("car"),
    travelType: z.enum(travelTypes).optional().default("solo"),
  }).refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    destinationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Destination ID format").optional(),
    startDate: z.string().transform((str) => new Date(str)).optional(),
    endDate: z.string().transform((str) => new Date(str)).optional(),
    travelers: z.number().min(1).optional(),
    hotelPreference: z.enum(hotelPreferences).optional(),
    transportPreference: z.enum(transportPreferences).optional(),
    travelType: z.enum(travelTypes).optional(),
  }),
});

export const calculateBudgetSchema = z.object({
  body: z.object({
    destinationId: z.string({ message: "Destination ID is required" }).regex(/^[0-9a-fA-F]{24}$/, "Invalid Destination ID format"),
    startDate: z.string({ message: "Start date is required" }).transform((str) => new Date(str)),
    endDate: z.string({ message: "End date is required" }).transform((str) => new Date(str)),
    travelers: z.number({ message: "Travelers count is required" }).min(1, "Must have at least 1 traveler"),
    hotelPreference: z.enum(hotelPreferences).optional().default("mid-range"),
    transportPreference: z.enum(transportPreferences).optional().default("car"),
    travelType: z.enum(travelTypes).optional().default("solo"),
    originLatitude: z.number().min(-90).max(90).optional(),
    originLongitude: z.number().min(-180).max(180).optional(),
  }).refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }),
});
