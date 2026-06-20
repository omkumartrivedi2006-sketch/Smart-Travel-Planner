import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  user: mongoose.Types.ObjectId;
  session: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "model"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema: Schema<IChat> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"],
      index: true,
    },
    session: {
      type: String,
      required: [true, "Session ID is required"],
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly retrieve a specific chat session for a user
ChatSchema.index({ user: 1, session: 1 }, { unique: true });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
