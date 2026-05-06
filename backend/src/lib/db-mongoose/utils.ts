import { User, Token, getNextTokenNumber } from "../../models/index.js";

/**
 * Utility functions for common MongoDB operations
 * Provides helpers for token generation, user lookups, etc.
 */

export async function generateTokensForTransaction(
  userId: string,
  transactionId: string,
  tokenCount: number
): Promise<void> {
  const tokenDocs = [];

  for (let i = 0; i < tokenCount; i++) {
    const tokenNumber = await getNextTokenNumber();
    tokenDocs.push({
      userId,
      transactionId,
      tokenNumber,
      status: "available",
    });
  }

  await Token.insertMany(tokenDocs);
}

export async function getUserByIdentifier(
  identifier: string
): Promise<InstanceType<typeof User> | null> {
  const isEmail = identifier.includes("@");

  return User.findOne(
    isEmail ? { email: identifier } : { phone: identifier }
  );
}

export async function getUserById(
  userId: string
): Promise<InstanceType<typeof User> | null> {
  return User.findById(userId);
}

export async function updateUserTokens(
  userId: string,
  delta: number
): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { tokens: delta } });
}

export async function markTokensAsUsed(
  tokenIds: string[],
  drawId: string
): Promise<void> {
  await Token.updateMany(
    { _id: { $in: tokenIds } },
    { $set: { status: "used", drawId } }
  );
}

export async function getAvailableTokensForUser(
  userId: string
): Promise<InstanceType<typeof Token>[]> {
  return Token.find({ userId, status: "available" }).sort({ tokenNumber: 1 });
}

export async function getRandomWinningToken(
  drawId: string
): Promise<InstanceType<typeof Token> | null> {
  const count = await Token.countDocuments({
    drawId,
    status: "used",
  });

  if (count === 0) return null;

  const random = Math.floor(Math.random() * count);
  return Token.findOne({ drawId, status: "used" }).skip(random);
}
