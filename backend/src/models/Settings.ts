import { Schema, model } from "mongoose";

export interface ISettings {
  happyUsersCount: number;
  tokensSoldCount: number;
  prizesWonCount: number;
  maintenanceMode: boolean;
  announcementText?: string;
  easypaisaTitle?: string;
  easypaisaNumber?: string;
  jazzcashTitle?: string;
  jazzcashNumber?: string;
  bankTitle?: string;
  bankIban?: string;
  sadapayTitle?: string;
  sadapayNumber?: string;
  spinEnabled: boolean;
  socialLinks?: Record<string, string>;
  footerContent?: string;
  whatsappNumber?: string;
  // Draw Execution Settings
  includeSpinTokensInDraw: boolean;
  spinTokenWeightMultiplier: number;
  spinTokenMinimumForDraw: number;
  drawExecutionMode: "purchased_only" | "all_tokens" | "purchased_and_spin";
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    happyUsersCount: { type: Number, default: 50000 },
    tokensSoldCount: { type: Number, default: 1000000 },
    prizesWonCount: { type: Number, default: 1200 },
    maintenanceMode: { type: Boolean, default: false },
    announcementText: { type: String },
    easypaisaTitle: {
      type: String,
      default: "Kaptan Lucky Draw (Pvt) Ltd",
    },
    easypaisaNumber: { type: String, default: "0300 1234567" },
    jazzcashTitle: {
      type: String,
      default: "Kaptan Lucky Draw (Pvt) Ltd",
    },
    jazzcashNumber: { type: String, default: "0301 7654321" },
    bankTitle: { type: String, default: "Kaptan Lucky Draw (Pvt) Ltd" },
    bankIban: {
      type: String,
      default: "PK36 SCBL 0000 0011 2345 6702",
    },
    sadapayTitle: { type: String, default: "Kaptan Lucky Draw (Pvt) Ltd" },
    sadapayNumber: { type: String },
    spinEnabled: { type: Boolean, default: true },
    socialLinks: { type: Schema.Types.Mixed },
    footerContent: { type: String },
    whatsappNumber: { type: String },
    // Draw Execution Settings
    includeSpinTokensInDraw: { type: Boolean, default: true },
    spinTokenWeightMultiplier: { type: Number, default: 1.0 },
    spinTokenMinimumForDraw: { type: Number, default: 0 },
    drawExecutionMode: {
      type: String,
      enum: ["purchased_only", "all_tokens", "purchased_and_spin"],
      default: "purchased_and_spin",
    },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_settings" }
);

export const Settings = model<ISettings>("Settings", SettingsSchema);