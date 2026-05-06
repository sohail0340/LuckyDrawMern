import mongoose from "mongoose";

/**
 * MongoDB connection initialization
 * Connects to MongoDB Atlas cluster
 */
export async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI must be set. Did you forget to provision a database?"
      );
    }

    if (mongoose.connection.readyState === 1) {
      console.log("✓ MongoDB already connected");
      return;
    }

    await mongoose.connect(MONGODB_URI as string, {
      retryWrites: true,
      w: "majority",
    });

    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Gracefully disconnect from MongoDB
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("✗ Failed to disconnect from MongoDB:", error);
    throw error;
  }
}

// Export all models and types
export * from "../../models/index.js";
export { mongoose };
