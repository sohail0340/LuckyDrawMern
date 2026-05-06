import { Schema, model, Types } from "mongoose";

export interface IDrawParticipation {
  userId: Types.ObjectId;
  drawId: Types.ObjectId;
  drawName: string;
  prize?: string;
  displayName?: string;
  displayCity?: string;
  displayPrize?: string;
  displayTokenLabel?: string;
  displayDateLabel?: string;
  displayImageUrl?: string;
  displayAvatarUrl?: string;
  tokensUsed: number;
  status: "active" | "cancelled";
  result?: "won" | "lost";
  winningTokenNumber?: number;
  winningTokenSlot?: number;
  prizeDeliveryStatus:
    | "pending_contact"
    | "contacted"
    | "dispatched"
    | "delivered";
  contactedAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  deliveryNotes?: string;
  joinedAt: Date;
}

const DrawParticipationSchema = new Schema<IDrawParticipation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    drawId: { type: Schema.Types.ObjectId, ref: "Draw", required: true },
    drawName: { type: String, required: true },
    prize: { type: String },
    displayName: { type: String },
    displayCity: { type: String },
    displayPrize: { type: String },
    displayTokenLabel: { type: String },
    displayDateLabel: { type: String },
    displayImageUrl: { type: String },
    displayAvatarUrl: { type: String },
    tokensUsed: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    result: { type: String, enum: ["won", "lost"] },
    winningTokenNumber: { type: Number },
    winningTokenSlot: { type: Number },
    prizeDeliveryStatus: {
      type: String,
      enum: ["pending_contact", "contacted", "dispatched", "delivered"],
      default: "pending_contact",
    },
    contactedAt: { type: Date },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
    deliveryNotes: { type: String },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_draw_participations" }
);

// Indexes
DrawParticipationSchema.index({ userId: 1 });
DrawParticipationSchema.index({ drawId: 1 });
DrawParticipationSchema.index({ result: 1 });
DrawParticipationSchema.index({ status: 1 });

export const DrawParticipation = model<IDrawParticipation>(
  "DrawParticipation",
  DrawParticipationSchema
);