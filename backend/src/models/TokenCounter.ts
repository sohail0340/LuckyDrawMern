import { Schema, model } from "mongoose";

/**
 * TokenCounter maintains the next sequential token number to be assigned.
 * MongoDB lacks auto-increment like PostgreSQL sequences, so we use this
 * counter collection pattern. The counter starts at 1000.
 */
export interface ITokenCounter {
  _id: "tokenNumber";
  value: number;
}

const TokenCounterSchema = new Schema<ITokenCounter>(
  {
    _id: { type: String, default: "tokenNumber" },
    value: { type: Number, default: 1000 },
  },
  { timestamps: false, collection: "cld_token_counter" }
);

export const TokenCounter = model<ITokenCounter>(
  "TokenCounter",
  TokenCounterSchema
);

/**
 * Helper function to get and increment the next token number
 */
export async function getNextTokenNumber(): Promise<number> {
  const counter = await TokenCounter.findByIdAndUpdate(
    "tokenNumber",
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}