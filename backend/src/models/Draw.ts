import { Schema, model, Types } from "mongoose";

export interface IDraw {
  name: string;
  category: string;
  prize: string;
  prizeValuePkr: number;
  tokenPricePkr: number;
  tokenLimit: number;
  imageUrl?: string;
  status: "draft" | "active" | "closed" | "drawn" | "completed" | "cancelled";
  badges?: string;
  startsAt?: Date;
  endsAt?: Date;
  winners?: Array<{
    userId: Types.ObjectId;
    name?: string;
    city?: string;
    prize?: string;
    tokenSlot: number;
    totalSlots: number;
    wonAt: Date;
  }>;
  createdAt: Date;
}

const DrawSchema = new Schema<IDraw>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    prize: { type: String, required: true },
    prizeValuePkr: { type: Number, required: true },
    tokenPricePkr: { type: Number, default: 100 },
    tokenLimit: { type: Number, required: true },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["draft", "active", "closed", "drawn", "completed", "cancelled"],
      default: "draft",
    },
    badges: { type: String },
    startsAt: { type: Date },
    endsAt: { type: Date },
    winners: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          name: { type: String },
          city: { type: String },
          prize: { type: String },
          tokenSlot: { type: Number, required: true },
          totalSlots: { type: Number, required: true },
          wonAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_draws" }
);

// Indexes
DrawSchema.index({ status: 1 });
DrawSchema.index({ createdAt: -1 });

export const Draw = model<IDraw>("Draw", DrawSchema);