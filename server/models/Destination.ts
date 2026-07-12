import mongoose, { Schema, Document } from "mongoose";

export interface IDestination extends Document {
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  continent: string;
  category: "Beach" | "Mountain" | "City" | "Heritage" | "Nature" | "Adventure" | "Culture" | "Food" | "Shopping";
  categories: string[];
  shortDescription: string;
  fullDescription: string;
  description: string;
  bestTimeToVisit: string;
  bestSeason: string;
  averageBudget: number; // in ₹
  averageCost: number;
  budget: number;
  durationRecommendation: string;
  duration: string;
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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  image: string;
  rating: number;
  popularPlaces: string[];
  hotels: string[];
  restaurants: string[];
  weather: {
    day: string;
    temp: string;
    condition: string;
    icon: string;
  }[];
  gallery: string[];
  heroImage: string;
  mapLocation: string;
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
    slug: {
      type: String,
      required: true,
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
      enum: ["Beach", "Mountain", "City", "Heritage", "Nature", "Adventure", "Culture", "Food", "Shopping"],
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
    description: {
      type: String,
      trim: true,
    },
    bestTimeToVisit: {
      type: String,
      required: [true, "Best time to visit is required"],
      trim: true,
    },
    bestSeason: {
      type: String,
      trim: true,
    },
    averageBudget: {
      type: Number,
      required: [true, "Average budget in ₹ is required"],
    },
    averageCost: {
      type: Number,
    },
    budget: {
      type: Number,
    },
    durationRecommendation: {
      type: String,
      required: [true, "Duration recommendation is required"],
      trim: true,
    },
    duration: {
      type: String,
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
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
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
    hotels: {
      type: [String],
      default: [],
    },
    restaurants: {
      type: [String],
      default: [],
    },
    weather: {
      type: [
        {
          day: { type: String, required: true },
          temp: { type: String, required: true },
          condition: { type: String, required: true },
          icon: { type: String, required: true }
        }
      ],
      default: [],
    },
    gallery: {
      type: [String],
      default: [],
    },
    heroImage: {
      type: String,
      trim: true,
    },
    mapLocation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

DestinationSchema.pre("save", function (this: any) {
  // Generate slug from name
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // Sync averageBudget / averageCost / budget
  if (this.averageBudget && !this.averageCost) {
    this.averageCost = this.averageBudget;
  } else if (this.averageCost && !this.averageBudget) {
    this.averageBudget = this.averageCost;
  }
  if (this.averageBudget && !this.budget) {
    this.budget = this.averageBudget;
  } else if (this.budget && !this.averageBudget) {
    this.averageBudget = this.budget;
    this.averageCost = this.budget;
  }

  // Sync image / images / gallery / heroImage
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
  if (this.images && (!this.gallery || this.gallery.length === 0)) {
    this.gallery = this.images;
  } else if (this.gallery && this.gallery.length > 0 && (!this.images || this.images.length === 0)) {
    this.images = this.gallery;
  }
  if (this.image && !this.heroImage) {
    this.heroImage = this.image;
  } else if (this.heroImage && !this.image) {
    this.image = this.heroImage;
  }

  // Sync topAttractions / popularPlaces
  if (this.topAttractions && (!this.popularPlaces || this.popularPlaces.length === 0)) {
    this.popularPlaces = this.topAttractions;
  } else if (this.popularPlaces && (!this.topAttractions || this.topAttractions.length === 0)) {
    this.topAttractions = this.popularPlaces;
  }

  // Sync latitude / longitude / coordinates
  if (this.latitude !== undefined && this.longitude !== undefined && !this.coordinates) {
    this.coordinates = { latitude: this.latitude, longitude: this.longitude };
  } else if (this.coordinates && this.latitude === undefined) {
    this.latitude = this.coordinates.latitude;
    this.longitude = this.coordinates.longitude;
  }

  // Sync description / fullDescription
  if (this.fullDescription && !this.description) {
    this.description = this.fullDescription;
  } else if (this.description && !this.fullDescription) {
    this.fullDescription = this.description;
  }

  // Sync bestTimeToVisit / bestSeason
  if (this.bestTimeToVisit && !this.bestSeason) {
    this.bestSeason = this.bestTimeToVisit;
  } else if (this.bestSeason && !this.bestTimeToVisit) {
    this.bestTimeToVisit = this.bestSeason;
  }

  // Sync durationRecommendation / duration
  if (this.durationRecommendation && !this.duration) {
    this.duration = this.durationRecommendation;
  } else if (this.duration && !this.durationRecommendation) {
    this.durationRecommendation = this.duration;
  }

  // Sync mapLocation
  if (this.city && this.country && !this.mapLocation) {
    this.mapLocation = `${this.city}, ${this.country}`;
  }
});

export const Destination = mongoose.model<IDestination>("Destination", DestinationSchema);
