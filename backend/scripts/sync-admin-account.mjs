import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error("Missing DB URI: set MONGODB_URI, MONGO_URI, or DATABASE_URL");
  process.exit(1);
}

const adminEmail = (process.env.ADMIN_EMAIL || "kaptanluckydraw@gmail.com").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "KaptanLuckyDraw_937$AdminPannel##";

async function run() {
  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const result = await mongoose.connection.db.collection("cld_users").updateOne(
    { email: adminEmail },
    {
      $set: {
        email: adminEmail,
        name: "admin",
        passwordHash,
        isAdmin: true,
        suspended: false,
        tokens: 0,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log(JSON.stringify({ adminEmail, matched: result.matchedCount, modified: result.modifiedCount, upsertedId: result.upsertedId || null }));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
