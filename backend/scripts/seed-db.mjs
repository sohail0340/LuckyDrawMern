#!/usr/bin/env node

import "dotenv/config";
import bcrypt from "bcryptjs";

const { connectDB, Settings, TokenCounter, User } = await import("../dist/index.mjs");

async function seed() {
  try {
    await connectDB();
    console.log("🌱 Starting database seed...");

    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      const settings = new Settings({
        happyUsersCount: 50000,
        tokensSoldCount: 1000000,
        prizesWonCount: 1200,
        maintenanceMode: false,
        spinEnabled: true,
        easypaisaTitle: "Kaptan Lucky Draw (Pvt) Ltd",
        easypaisaNumber: "0300 1234567",
        jazzcashTitle: "Kaptan Lucky Draw (Pvt) Ltd",
        jazzcashNumber: "0301 7654321",
        bankTitle: "Kaptan Lucky Draw (Pvt) Ltd",
        bankIban: "PK36 SCBL 0000 0011 2345 6702",
        sadapayTitle: "Kaptan Lucky Draw (Pvt) Ltd",
        whatsappNumber: "+923001234567",
      });
      await settings.save();
      console.log("✓ Settings initialized");
    } else {
      console.log("✓ Settings already exist");
    }

    const existingCounter = await TokenCounter.findById("tokenNumber");
    if (!existingCounter) {
      await TokenCounter.create({ _id: "tokenNumber", value: 1000 });
      console.log("✓ Token counter initialized (starting at 1000)");
    } else {
      console.log("✓ Token counter already exists");
    }

    const adminEmail = "KaptanLuckyDraw@gmail.com";
    const adminPassword = "KaptanLuckyDraw_937$AdminPannel##";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: adminEmail,
        name: "Admin",
        passwordHash,
        isAdmin: true,
        tokens: 0,
      });
      console.log("✓ Admin user created");
    } else {
      if (!existingAdmin.isAdmin) {
        await User.findByIdAndUpdate(existingAdmin._id, { isAdmin: true });
        console.log("✓ Admin user updated with admin role");
      } else {
        console.log("✓ Admin user already exists");
      }
    }

    console.log("✅ Database seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();