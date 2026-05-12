#!/usr/bin/env node

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const args = process.argv.slice(2).filter(Boolean);
const listMode = args.includes("--list");
const dumpMode = args.includes("--dump");
const matchArg = args.find((arg) => arg.startsWith("--match="));
const matchValue = matchArg ? matchArg.slice("--match=".length) : null;
const emails = args.filter((arg) => arg !== "--list");
const targetEmails = emails.length > 0 ? emails : [
  "zoyankhansalvi2@gmail.com",
  "mrai033597@gmail.com",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.collection("users");
  const tokens = mongoose.connection.collection("tokens");

  if (listMode) {
    const filter = matchValue
      ? {
          $or: [
            { email: { $regex: matchValue, $options: "i" } },
            { name: { $regex: matchValue, $options: "i" } },
            { phone: { $regex: matchValue, $options: "i" } },
          ],
        }
      : { tokens: { $in: [0, 1, 2] } };

    const candidates = await users
      .find(filter, { projection: { email: 1, name: 1, phone: 1, tokens: 1 } })
      .sort({ tokens: -1, createdAt: -1 })
      .toArray();
    console.log(JSON.stringify(candidates, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  }

  if (dumpMode) {
    const candidates = await users
      .find({}, { projection: { email: 1, name: 1, phone: 1, tokens: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    console.log(JSON.stringify(candidates, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const email of targetEmails) {
    const user = await users.findOne({ email });
    if (!user) {
      console.log(`NOT FOUND ${email}`);
      continue;
    }

    const deleted = await tokens.deleteMany({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    });

    await users.updateOne(
      { _id: user._id },
      { $set: { tokens: 0 } },
    );

    const refreshed = await users.findOne({ _id: user._id }, { projection: { tokens: 1 } });
    console.log("UPDATED", email, {
      userId: user._id.toString(),
      deletedTokens: deleted.deletedCount ?? 0,
      tokens: refreshed?.tokens ?? null,
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});