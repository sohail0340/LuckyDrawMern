import { Schema, model, Types } from "mongoose";

export interface INotification {
  userId: Types.ObjectId;
  type: "system" | "win" | "activity" | "announcement";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["system", "win", "activity", "announcement"],
      default: "system",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_notifications" }
);

// Indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>(
  "Notification",
  NotificationSchema
);