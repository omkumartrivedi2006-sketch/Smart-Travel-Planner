import mongoose, { Schema, Document } from "mongoose";

export interface IDestination extends Document {
  name: string;
  city: string;
  state: string;
  country: string;
  continent: string;
  category: "Beach" | "Mountain" | "City" | "Heritage" | "Nature" | "Adventure";
  categories?: string[]; // legacy multi-category
  shortDescription: string;
  fullDescription: string;
  bestTimeToVisit: string;
  averageBudget: number; // in ₹
  averageCost?: number; // legacy averageCost (synced with averageBudget)
  durationRecommendation: string;
  weatherInformation: string;
  famousFor: string;
  topAttractions: string[];
  activities: string[];
  localCuisine: string[];
  transportationOptions: string[];
  nearestAirport: string;
  nearestRailwayStation: string;
  languagesSpoken: string[];
  currency: string;
  safetyInformation: string;
  travelTips: string;
  latitude: number;
  longitude: number;
  images: string[];
  image?: string; // legacy image URL (synced with images[0])
  rating: number;
  popularPlaces?: string[]; // legacy popularPlaces (synced with topAttractions)
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
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      index: true,
    },
    continent: {
      type: String,
      required: [true, "Continent is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Beach", "Mountain", "City", "Heritage", "Nature", "Adventure"],
    },
    categories: {
      type: [String],
      default: [],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
    },
    fullDescription: {
      type: String,
      required: [true, "Full description is required"],
      trim: true,
    },
    bestTimeToVisit: {
      type: String,
      required: [true, "Best time to visit is required"],
      trim: true,
    },
    averageBudget: {
      type: Number,
      required: [true, "Average budget in ₹ is required"],
    },
    averageCost: {
      type: Number,
    },
    durationRecommendation: {
      type: String,
      required: [true, "Duration recommendation is required"],
      trim: true,
    },
    weatherInformation: {
      type: String,
      required: [true, "Weather information is required"],
      trim: true,
    },
    famousFor: {
      type: String,
      required: [true, "Famous for is required"],
      trim: true,
    },
    topAttractions: {
      type: [String],
      required: [true, "Top attractions are required"],
      default: [],
    },
    activities: {
      type: [String],
      required: [true, "At least one activity is required"],
      default: [],
    },
    localCuisine: {
      type: [String],
      required: [true, "Local cuisine is required"],
      default: [],
    },
    transportationOptions: {
      type: [String],
      required: [true, "Transportation options are required"],
      default: [],
    },
    nearestAirport: {
      type: String,
      required: [true, "Nearest airport is required"],
      trim: true,
    },
    nearestRailwayStation: {
      type: String,
      required: [true, "Nearest railway station is required"],
      trim: true,
    },
    languagesSpoken: {
      type: [String],
      required: [true, "Languages spoken are required"],
      default: [],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      trim: true,
    },
    safetyInformation: {
      type: String,
      required: [true, "Safety information is required"],
      trim: true,
    },
    travelTips: {
      type: String,
      required: [true, "Travel tips are required"],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      default: [],
    },
    image: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 4.5,
    },
    popularPlaces: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

DestinationSchema.pre("save", function (this: any) {
  if (this.averageBudget && !this.averageCost) {
    this.averageCost = this.averageBudget;
  } else if (this.averageCost && !this.averageBudget) {
    this.averageBudget = this.averageCost;
  }

  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }

  if (this.topAttractions && (!this.popularPlaces || this.popularPlaces.length === 0)) {
    this.popularPlaces = this.topAttractions;
  } else if (this.popularPlaces && (!this.topAttractions || this.topAttractions.length === 0)) {
    this.topAttractions = this.popularPlaces;
  }
});

export const Destination = mongoose.model<IDestination>("Destination", DestinationSchema);
