import { Schema, model, Types } from "mongoose";

export interface ITransaction {
  userId: Types.ObjectId;
  amountPkr: number;
  tokensCount: number;
  drawId?: Types.ObjectId;
  drawName?: string;
  paymentMethod: "EasyPaisa" | "JazzCash" | "Bank" | "Bank Transfer" | "SadaPay";
  screenshotUrl?: string;
  paymentTransactionId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountPkr: { type: Number, required: true },
    tokensCount: { type: Number, default: 1 },
    drawId: { type: Schema.Types.ObjectId, ref: "Draw" },
    drawName: { type: String },
    paymentMethod: {
      type: String,
      enum: ["EasyPaisa", "JazzCash", "Bank", "Bank Transfer", "SadaPay"],
      default: "EasyPaisa",
    },
    screenshotUrl: { type: String },
    paymentTransactionId: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    customerAddress: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_transactions" }
);

// Indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ drawId: 1 });

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);