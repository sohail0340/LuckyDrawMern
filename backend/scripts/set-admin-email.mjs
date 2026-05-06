import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error("Missing DB URI: set MONGODB_URI, MONGO_URI, or DATABASE_URL");
  process.exit(1);
}

const adminEmail = (process.env.ADMIN_EMAIL || "kaptanluckydraw@gmail.com").trim().toLowerCase();

async function run() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.db
    .collection("cld_users")
    .updateMany({ email: adminEmail }, { $set: { isAdmin: true } });

  console.log(JSON.stringify({ adminEmail, matched: result.matchedCount, modified: result.modifiedCount }));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
