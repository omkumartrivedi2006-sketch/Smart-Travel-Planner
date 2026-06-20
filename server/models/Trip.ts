import mongoose, { Schema, Document } from "mongoose";

export interface IItineraryActivity {
  time: string;
  activity: string;
  description: string;
  cost: number;
}

export interface IItineraryDay {
  day: number;
  activities: IItineraryActivity[];
}

export interface ITrip extends Document {
  user: mongoose.Types.ObjectId;
  destination: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  travelers: number;
  hotelPreference: "budget" | "mid-range" | "luxury";
  transportPreference: "car" | "train" | "flight";
  travelType: "solo" | "couple" | "family" | "friends";
  budget?: mongoose.Types.ObjectId;
  itinerary: IItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryActivitySchema = new Schema({
  time: { type: String, required: true },
  activity: { type: String, required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
});

const ItineraryDaySchema = new Schema({
  day: { type: Number, required: true },
  activities: { type: [ItineraryActivitySchema], required: true, default: [] },
});

const TripSchema: Schema<ITrip> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"],
      index: true,
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination association is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    travelers: {
      type: Number,
      required: [true, "Number of travelers is required"],
      min: [1, "Must have at least 1 traveler"],
      default: 1,
    },
    hotelPreference: {
      type: String,
      enum: ["budget", "mid-range", "luxury"],
      default: "mid-range",
    },
    transportPreference: {
      type: String,
      enum: ["car", "train", "flight"],
      default: "car",
    },
    travelType: {
      type: String,
      enum: ["solo", "couple", "family", "friends"],
      default: "solo",
    },
    budget: {
      type: Schema.Types.ObjectId,
      ref: "Budget",
    },
    itinerary: {
      type: [ItineraryDaySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = mongoose.model<ITrip>("Trip", TripSchema);
