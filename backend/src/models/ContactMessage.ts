import { Schema, model } from "mongoose";

export interface IContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "open" | "closed";
  adminNotes?: string;
  repliedAt?: Date;
  screenshotUrl?: string;
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    adminNotes: { type: String },
    repliedAt: { type: Date },
    screenshotUrl: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_contact_messages" }
);

// Indexes
ContactMessageSchema.index({ email: 1 });
ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);