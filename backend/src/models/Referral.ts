import { Schema, model, Types } from "mongoose";

export interface IReferral {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  rewardGiven: boolean;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rewardGiven: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_referrals" }
);

// Indexes
ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ referredUserId: 1 });

export const Referral = model<IReferral>("Referral", ReferralSchema);