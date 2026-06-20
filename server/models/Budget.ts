import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  trip?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  hotelCost: number;
  foodCost: number;
  transportCost: number;
  activitiesCost: number;
  miscellaneousCost: number;
  totalEstimate: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema<IBudget> = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    hotelCost: {
      type: Number,
      required: true,
      default: 0,
    },
    foodCost: {
      type: Number,
      required: true,
      default: 0,
    },
    transportCost: {
      type: Number,
      required: true,
      default: 0,
    },
    activitiesCost: {
      type: Number,
      required: true,
      default: 0,
    },
    miscellaneousCost: {
      type: Number,
      required: true,
      default: 0,
    },
    totalEstimate: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Budget = mongoose.model<IBudget>("Budget", BudgetSchema);
