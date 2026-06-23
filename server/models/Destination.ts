import mongoose, { Schema, Document } from "mongoose";

export interface IDestination extends Document {
  name: string;
  description: string;
  country: string;
  category: "Beach" | "Mountain" | "City" | "Heritage" | "Nature" | "Adventure";
  categories?: string[]; // Multi-category tags for advanced filtering
  latitude: number;
  longitude: number;
  averageCost: number;
  activities: string[];
  bestTimeToVisit: string;
  rating: number;
  image?: string;
  popularPlaces: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema: Schema<IDestination> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Destination name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Beach", "Mountain", "City", "Heritage", "Nature", "Adventure"],
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    averageCost: {
      type: Number,
      required: [true, "Average daily cost is required"],
    },
    activities: {
      type: [String],
      required: [true, "At least one activity is required"],
      default: [],
    },
    bestTimeToVisit: {
      type: String,
      required: [true, "Best time to visit is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 4.5,
    },
    image: {
      type: String,
      trim: true,
    },
    popularPlaces: {
      type: [String],
      default: [],
    },
    // Multi-category tags for advanced filtering (e.g. ["beach", "food", "culture"])
    categories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Destination = mongoose.model<IDestination>("Destination", DestinationSchema);
