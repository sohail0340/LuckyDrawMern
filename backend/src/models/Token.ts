import { Schema, model, Types } from "mongoose";

export interface IToken {
  userId: Types.ObjectId;
  transactionId?: Types.ObjectId;
  drawId?: Types.ObjectId;
  tokenNumber: number;
  status: "available" | "used";
  createdAt: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    drawId: { type: Schema.Types.ObjectId, ref: "Draw" },
    tokenNumber: { type: Number, unique: true, required: true },
    status: { type: String, enum: ["available", "used"], default: "available" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_tokens" }
);

// Indexes
TokenSchema.index({ userId: 1 });
TokenSchema.index({ drawId: 1 });
TokenSchema.index({ status: 1 });

export const Token = model<IToken>("Token", TokenSchema);