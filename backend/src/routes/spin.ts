import { Router } from "express";
import {
  User,
  SpinHistory,
  Notification,
  Transaction,
} from "../lib/db-mongoose/index.js";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();
router.use(requireAuth as any);

const SLICE_REWARDS: Record<number, number> = {
  0: 1,
  1: 0,
  2: 2,
  3: 0,
  4: 1,
  5: 0,
  6: 1,
  7: 0,
};

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5

function getTodayPKT(): string {
  return new Date(Date.now() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

function getMidnightPKTTimestamp(): number {
  const pktNow = new Date(Date.now() + PKT_OFFSET_MS);
  const nextMidnightPKT = new Date(Date.UTC(
    pktNow.getUTCFullYear(),
    pktNow.getUTCMonth(),
    pktNow.getUTCDate() + 1,
  ));
  return nextMidnightPKT.getTime() - PKT_OFFSET_MS;
}

async function getSpinEligibility(userId: string): Promise<{ isEligible: boolean; totalTokensPurchased: number }> {
  const user = await User.findById(userId).select("spinForceEnabled");

  const [purchaseRow] = await Transaction.aggregate([
    { $match: { userId, status: "approved" } },
    { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
  ]) || [{ totalTokensPurchased: 0 }];

  const totalTokensPurchased = purchaseRow?.totalTokensPurchased ?? 0;
  const isEligible = Boolean(user?.spinForceEnabled) || totalTokensPurchased >= 100;
  return { isEligible, totalTokensPurchased };
}

router.get("/status", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId!).select(
      "lastSpinDate spinForceEnabled"
    );

    const [purchaseRow] = await Transaction.aggregate([
      { $match: { userId: req.userId!, status: "approved" } },
      { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
    ]) || [{ totalTokensPurchased: 0 }];

    const totalTokensPurchased = purchaseRow?.totalTokensPurchased ?? 0;
    const isEligible = Boolean(user?.spinForceEnabled) || totalTokensPurchased >= 100;

    const today = getTodayPKT();
    const alreadySpun = user?.lastSpinDate?.toISOString().slice(0, 10) === today;
    const nextSpinAt = getMidnightPKTTimestamp();
    const secondsUntilNextSpin = alreadySpun
      ? Math.ceil((nextSpinAt - Date.now()) / 1000)
      : 0;

    res.json({
      isEligible,
      totalTokensPurchased,
      canSpin: isEligible && !alreadySpun,
      nextSpinAt: alreadySpun ? new Date(nextSpinAt).toISOString() : null,
      secondsUntilNextSpin: alreadySpun ? secondsUntilNextSpin : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch spin status" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId!).select(
      "tokens lastSpinDate spinForceEnabled"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check purchase eligibility
    const { isEligible, totalTokensPurchased } = await getSpinEligibility(
      req.userId!
    );
    if (!isEligible) {
      res.status(403).json({
        error:
          "You need to purchase at least 100 tokens to unlock daily spins",
        totalTokensPurchased,
      });
      return;
    }

    const today = getTodayPKT();
    if (user.lastSpinDate?.toISOString().slice(0, 10) === today) {
      const nextSpinAt = getMidnightPKTTimestamp();
      res.status(429).json({
        error: "You have already spun today. Come back tomorrow!",
        nextSpinAt: new Date(nextSpinAt).toISOString(),
        secondsUntilNextSpin: Math.ceil((nextSpinAt - Date.now()) / 1000),
      });
      return;
    }

    const resultIndex = Math.floor(Math.random() * 8);
    const tokensWon = SLICE_REWARDS[resultIndex] ?? 0;

    await User.findByIdAndUpdate(req.userId!, {
      $inc: { tokens: tokensWon },
      lastSpinDate: today,
    });

    await SpinHistory.create({
      userId: req.userId!,
      resultIndex,
      tokensWon,
    });

    if (tokensWon > 0) {
      await Notification.create({
        userId: req.userId!,
        type: "win",
        title: `Daily Spin Reward — ${tokensWon} Token${
          tokensWon > 1 ? "s" : ""
        } Won!`,
        message: `Congratulations! You won ${tokensWon} token${
          tokensWon > 1 ? "s" : ""
        } from the daily spin wheel.`,
      });
    }

    const nextSpinAt = getMidnightPKTTimestamp();

    res.json({
      resultIndex,
      tokensWon,
      newTotal: (user.tokens ?? 0) + tokensWon,
      nextSpinAt: new Date(nextSpinAt).toISOString(),
      secondsUntilNextSpin: Math.ceil((nextSpinAt - Date.now()) / 1000),
    });
  } catch (err) {
    console.error("Spin error:", err);
    res.status(500).json({ error: "Spin failed. Please try again." });
  }
});

export default router;
