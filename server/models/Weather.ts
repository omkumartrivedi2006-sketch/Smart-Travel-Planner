import mongoose, { Schema, Document } from "mongoose";

export interface IForecastItem {
  date: string; // YYYY-MM-DD
  temperature: number;
  condition: string;
  icon?: string; // weather icon code or URL
}

export interface IWeather extends Document {
  destinationName: string; // lowercased lookup name
  country?: string;
  temperature: number; // in Celsius
  condition: string;
  icon?: string;
  humidity: number; // percentage
  windSpeed: number; // in km/h
  forecast: IForecastItem[];
  lastUpdated: Date;
}

const ForecastItemSchema = new Schema({
  date: { type: String, required: true },
  temperature: { type: Number, required: true },
  condition: { type: String, required: true },
  icon: { type: String },
});

const WeatherSchema: Schema<IWeather> = new Schema(
  {
    destinationName: {
      type: String,
      required: [true, "Destination name lookup is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: "",
    },
    temperature: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    windSpeed: {
      type: Number,
      required: true,
    },
    forecast: {
      type: [ForecastItemSchema],
      required: true,
      default: [],
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Weather = mongoose.model<IWeather>("Weather", WeatherSchema);
