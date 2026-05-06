import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import {
  User,
  Referral,
  Notification,
  Transaction,
} from "../lib/db-mongoose/index.js";
import { signToken } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

function getReferralEligibility(totalTokensPurchased: number, forceEnabled: boolean) {
  return forceEnabled || totalTokensPurchased >= 100;
}

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "kaptanluckydraw@gmail.com").trim().toLowerCase();
}

export async function register(req: Request, res: Response) {
  try {
    const { identifier, name, password, referralCode } = req.body as {
      identifier: string; name?: string; password: string; referralCode?: string;
    };

    try {
      logger.info({ path: req.path, method: req.method, identifier: identifier && String(identifier).slice(0, 64), name: name || null }, "Register attempt");
    } catch {}

    if (!identifier || !password) {
      res.status(400).json({ error: "Identifier and password are required." });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const isEmail = identifier.includes("@");
    const normalizedIdentifier = identifier.trim();
    const normalizedEmail = isEmail ? normalizedIdentifier.toLowerCase() : undefined;
    const existing = await User.findOne(
      isEmail ? { email: normalizedEmail } : { phone: normalizedIdentifier }
    );

    if (existing) {
      res.status(409).json({ error: "An account with this identifier already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let referrer: any = undefined;
    if (referralCode?.trim()) {
      referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    const isAdminEmail = Boolean(normalizedEmail) && normalizedEmail === getAdminEmail();

    const newUser = await User.create({
      email: isEmail ? normalizedEmail : undefined,
      phone: !isEmail ? normalizedIdentifier : undefined,
      name: name || undefined,
      passwordHash,
      isAdmin: isAdminEmail,
      referralCode: undefined,
      referredBy: referrer?._id,
      tokens: 0,
    });

    if (referrer) {
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: newUser._id,
        rewardGiven: false,
      });

      await Notification.create({
        userId: referrer._id,
        type: "win",
        title: "Referral Registered!",
        message: `${name || identifier} signed up using your referral code. You'll get 1 token after their first approved purchase.`,
      });
    } else {
      await Notification.create({
        userId: newUser._id,
        type: "system",
        title: "Welcome to Kaptan Lucky Draw!",
        message: "Your account has been created. Start by joining a draw to win exciting prizes!",
      });
    }

    const token = signToken(newUser._id.toString());
    res.status(201).json({
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name || null,
        email: newUser.email || null,
        phone: newUser.phone || null,
        tokens: newUser.tokens,
        referralCode: newUser.referralCode || null,
        isAdmin: newUser.isAdmin,
        suspended: newUser.suspended,
        city: newUser.city || null,
        address: newUser.address || null,
        province: newUser.province || null,
        cnic: newUser.cnic || null,
        createdAt: newUser.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    logger.error({ err, message: err?.message }, "Register error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { identifier, password } = req.body as { identifier: string; password: string };
    if (!identifier || !password) {
      res.status(400).json({ error: "Identifier and password are required." });
      return;
    }

    const isEmail = identifier.includes("@");
    const normalizedIdentifier = identifier.trim();
    const normalizedEmail = isEmail ? normalizedIdentifier.toLowerCase() : undefined;
    const user = await User.findOne(
      isEmail ? { email: normalizedEmail } : { phone: normalizedIdentifier }
    );

    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    if (user.suspended) {
      res.status(401).json({ error: "Your account has been suspended. Please contact support." });
      return;
    }

    const isAdminEmail = typeof user.email === "string" && user.email.toLowerCase() === getAdminEmail();
    if (isAdminEmail && !user.isAdmin) {
      await User.findByIdAndUpdate(user._id, { isAdmin: true });
      user.isAdmin = true;
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken(user._id.toString());
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email || null,
        phone: user.phone || null,
        tokens: user.tokens,
        referralCode: user.referralCode || null,
        isAdmin: user.isAdmin,
        suspended: user.suspended,
        city: user.city || null,
        address: user.address || null,
        province: user.province || null,
        cnic: user.cnic || null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    logger.error({ err, message: err?.message }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export async function refreshReferral(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [purchaseResult] = await Transaction.aggregate([
      { $match: { userId: user._id, status: "approved" } },
      { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
    ]);

    const totalTokensPurchased = (purchaseResult as any)?.totalTokensPurchased ?? 0;
    const isEligible = getReferralEligibility(totalTokensPurchased, Boolean(user.referralForceEnabled));

    if (!isEligible) {
      await User.findByIdAndUpdate(userId, { $unset: { referralCode: "" } });
      res.status(403).json({ error: "Referral is locked. Purchase at least 100 tokens." });
      return;
    }

    if (!user.referralCode) {
      let code = Math.random().toString(36).slice(2, 10).toUpperCase();
      while (await User.findOne({ referralCode: code })) {
        code = Math.random().toString(36).slice(2, 10).toUpperCase();
      }
      await User.findByIdAndUpdate(userId, { referralCode: code });
      res.json({ referralCode: code, referralEnabled: true });
      return;
    }

    res.json({ referralCode: user.referralCode, referralEnabled: true });
  } catch (err) {
    logger.error({ err }, "Referral refresh error");
    res.status(500).json({ error: "Failed" });
  }
}
