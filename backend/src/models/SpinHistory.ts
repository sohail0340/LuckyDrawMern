import { Schema, model, Types } from "mongoose";

export interface ISpinHistory {
  userId: Types.ObjectId;
  resultIndex: number;
  tokensWon: number;
  createdAt: Date;
}

const SpinHistorySchema = new Schema<ISpinHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resultIndex: { type: Number, required: true },
    tokensWon: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_spin_history" }
);

// Indexes
SpinHistorySchema.index({ userId: 1 });
SpinHistorySchema.index({ createdAt: -1 });

export const SpinHistory = model<ISpinHistory>(
  "SpinHistory",
  SpinHistorySchema
);