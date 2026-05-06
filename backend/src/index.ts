import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app";
import { logger } from "./lib/logger";
import { connectDB, Draw } from "./lib/db-mongoose/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function seedDemoDraw() {
  try {
    const existing = await Draw.findOne();
    if (existing) return;
    
    await Draw.create({
      name: "Toyota Corolla Dream Draw",
      category: "Cars",
      prize: "Toyota Corolla",
      prizeValuePkr: 3500000,
      tokenPricePkr: 100,
      tokenLimit: 100000,
      imageUrl: "/api/uploads/draw_1777746156784_fm7kka.jfif",
      status: "active",
      badges: "verified,featured",
    });
    
    logger.info("Demo draw seeded");
  } catch (err) {
    logger.warn({ err }, "Seed warning");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

connectDB().then(() => seedDemoDraw()).then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}).catch(err => {
  logger.error({ err }, "Fatal: connection failed");
  process.exit(1);
});
